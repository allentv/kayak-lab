import { assertEquals, assertExists } from "@std/assert";
import { FileCapability } from "../file.ts";
import type { CapabilityContext } from "../capability.ts";

/** Create a temp sandbox root for file capability tests. */
async function createTempRoot(): Promise<string> {
  return await Deno.makeTempDir({ prefix: "file-test-" });
}

/** Remove temp dir recursively. */
async function removeTempDir(dir: string): Promise<void> {
  await Deno.remove(dir, { recursive: true });
}

Deno.test("FileCapability", async (t) => {
  let root: string;
  let capability: FileCapability;

  const setup = async () => {
    root = await createTempRoot();
    capability = new FileCapability();
    const context: CapabilityContext = {
      session_id: "test-session",
      working_directory: root,
    };
    await capability.initialize(context);
  };

  const teardown = async () => {
    await capability.dispose();
    await removeTempDir(root);
  };

  await t.step("read returns full text file content", async () => {
    await setup();
    try {
      const writeResult = await capability.write(
        "hello.txt",
        "line1\nline2\nline3",
      );
      assertEquals(writeResult.success, true);

      const result = await capability.read("hello.txt");
      assertEquals(result.success, true);
      assertEquals(result.data, "line1\nline2\nline3");
    } finally {
      await teardown();
    }
  });

  await t.step("read range selects 1-indexed inclusive lines", async () => {
    await setup();
    try {
      const lines = Array.from({ length: 300 }, (_, i) => `line ${i + 1}`);
      await capability.write("numbered.txt", lines.join("\n"));

      const result = await capability.read("numbered.txt", {
        offset: 50,
        limit: 100,
      });
      assertEquals(result.success, true);
      const selected = (result.data as string).split("\n");
      assertEquals(selected.length, 100);
      assertEquals(selected[0], "line 50");
      assertEquals(selected[selected.length - 1], "line 149");
    } finally {
      await teardown();
    }
  });

  await t.step("read returns base64 data for binary files", async () => {
    await setup();
    try {
      // PNG magic header plus a NUL byte to trip binary detection.
      const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x0d, 0x0a]);
      await Deno.writeFile(`${root}/image.png`, bytes);

      const result = await capability.read("image.png");
      assertEquals(result.success, true);
      const data = result.data as { base64: string; mimeType: string; binary: true };
      assertEquals(data.binary, true);
      assertEquals(data.mimeType, "image/png");
      assertEquals(data.base64, btoa(String.fromCharCode(...bytes)));
    } finally {
      await teardown();
    }
  });

  await t.step("read non-existent file returns 404 error", async () => {
    await setup();
    try {
      const result = await capability.read("missing.txt");
      assertEquals(result.success, false);
      assertEquals(result.error, "File not found: missing.txt");
      assertEquals(result.metadata?.status, 404);
    } finally {
      await teardown();
    }
  });

  await t.step("read directory returns entry listing", async () => {
    await setup();
    try {
      await capability.write("dir/a.txt", "a");
      await capability.write("dir/b.txt", "b");
      await Deno.mkdir(`${root}/dir/subdir`);

      const result = await capability.read("dir");
      assertEquals(result.success, true);
      assertEquals(result.data, {
        directory: true,
        entries: [
          { name: "a.txt", type: "file" },
          { name: "b.txt", type: "file" },
          { name: "subdir", type: "directory" },
        ],
      });
    } finally {
      await teardown();
    }
  });

  await t.step("write creates new file with parent directories", async () => {
    await setup();
    try {
      const result = await capability.write(
        "nested/deep/file.txt",
        "content",
      );
      assertEquals(result.success, true);
      assertEquals(result.data?.bytes, "content".length);
      assertExists(result.data?.path);

      const text = await Deno.readTextFile(`${root}/nested/deep/file.txt`);
      assertEquals(text, "content");
    } finally {
      await teardown();
    }
  });

  await t.step("write overwrites existing file", async () => {
    await setup();
    try {
      await capability.write("file.txt", "first");
      const result = await capability.write("file.txt", "second-longer");

      assertEquals(result.success, true);
      const text = await Deno.readTextFile(`${root}/file.txt`);
      assertEquals(text, "second-longer");
    } finally {
      await teardown();
    }
  });

  await t.step("write outside root is rejected", async () => {
    await setup();
    try {
      const result = await capability.write("../escape.txt", "nope");
      assertEquals(result.success, false);
      assertEquals(
        result.error,
        'Security error: path "../escape.txt" resolves outside the sandbox root',
      );
      // Nothing should have been written next to the root.
      const stat = await Deno.stat(`${root}/../escape.txt`).catch(() => null);
      assertEquals(stat, null);
    } finally {
      await teardown();
    }
  });

  await t.step("edit replaces a unique match", async () => {
    await setup();
    try {
      await capability.write("code.txt", "const answer = 1;\nconst total = 2;");
      const result = await capability.edit("code.txt", "const answer = 1;", "const answer = 42;");

      assertEquals(result.success, true);
      assertEquals(result.data?.replacements, 1);
      const text = await Deno.readTextFile(`${root}/code.txt`);
      assertEquals(text, "const answer = 42;\nconst total = 2;");
    } finally {
      await teardown();
    }
  });

  await t.step("edit rejects non-unique match without replace_all", async () => {
    await setup();
    try {
      await capability.write("dup.txt", "foo one\nfoo two\nfoo three");
      const result = await capability.edit("dup.txt", "foo", "bar");

      assertEquals(result.success, false);
      // File must be unchanged on rejection.
      const text = await Deno.readTextFile(`${root}/dup.txt`);
      assertEquals(text, "foo one\nfoo two\nfoo three");
    } finally {
      await teardown();
    }
  });

  await t.step("edit with replace_all replaces every occurrence", async () => {
    await setup();
    try {
      await capability.write("dup.txt", "foo one\nfoo two\nfoo three");
      const result = await capability.edit("dup.txt", "foo", "bar", {
        replace_all: true,
      });

      assertEquals(result.success, true);
      assertEquals(result.data?.replacements, 3);
      const text = await Deno.readTextFile(`${root}/dup.txt`);
      assertEquals(text, "bar one\nbar two\nbar three");
    } finally {
      await teardown();
    }
  });

  await t.step("edit non-existent file returns 404 error", async () => {
    await setup();
    try {
      const result = await capability.edit("missing.txt", "a", "b");
      assertEquals(result.success, false);
      assertEquals(result.metadata?.status, 404);
    } finally {
      await teardown();
    }
  });

  await t.step("edit with no match returns error", async () => {
    await setup();
    try {
      await capability.write("file.txt", "hello world");
      const result = await capability.edit("file.txt", "absent-string", "x");

      assertEquals(result.success, false);
      const text = await Deno.readTextFile(`${root}/file.txt`);
      assertEquals(text, "hello world");
    } finally {
      await teardown();
    }
  });

  await t.step("path traversal with .. is rejected", async () => {
    await setup();
    try {
      // `..` that stays inside the root is fine; escaping is not.
      const inside = await capability.read("nested/../inside.txt");
      assertEquals(inside.success, false); // file absent, but not a security error
      assertEquals(inside.error, "File not found: nested/../inside.txt");

      const outside = await capability.read("../../../etc/passwd");
      assertEquals(outside.success, false);
      assertEquals(
        outside.error,
        'Security error: path "../../../etc/passwd" resolves outside the sandbox root',
      );
    } finally {
      await teardown();
    }
  });

  await t.step("symlink pointing outside root is rejected", async () => {
    await setup();
    try {
      const outsideDir = await Deno.makeTempDir({ prefix: "file-outside-" });
      try {
        await Deno.writeTextFile(`${outsideDir}/secret.txt`, "secret");
        await Deno.symlink(
          `${outsideDir}/secret.txt`,
          `${root}/link.txt`,
        );

        const readResult = await capability.read("link.txt");
        assertEquals(readResult.success, false);
        assertEquals(
          readResult.error,
          'Security error: path "link.txt" resolves outside the sandbox root',
        );

        const writeResult = await capability.write("link.txt", "overwrite");
        assertEquals(writeResult.success, false);
        assertEquals(
          writeResult.error,
          'Security error: path "link.txt" resolves outside the sandbox root',
        );
      } finally {
        await removeTempDir(outsideDir);
      }
    } finally {
      await teardown();
    }
  });

  await t.step("read of files larger than 10MB is rejected", async () => {
    await setup();
    try {
      // 10MB + 1 byte of NUL-free data (0x61 = 'a').
      const big = new Uint8Array(10 * 1024 * 1024 + 1).fill(0x61);
      await Deno.writeFile(`${root}/big.txt`, big);

      const result = await capability.read("big.txt");
      assertEquals(result.success, false);
      assertEquals(
        result.error,
        `File exceeds the 10MB read limit: big.txt is ${big.byteLength} bytes`,
      );
    } finally {
      await teardown();
    }
  });
});