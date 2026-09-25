import { assertEquals } from "@std/assert";
import { SearchCapability } from "../search.ts";
import type { CapabilityContext } from "../capability.ts";
import { CapabilityNotInitializedError } from "../capability.ts";

/** Create a temporary git project for testing. */
async function createTempProject(): Promise<string> {
  const dir = await Deno.makeTempDir({ prefix: "search-test-" });
  await Deno.mkdir(`${dir}/src/lib`, { recursive: true });
  await Deno.writeTextFile(`${dir}/src/a.ts`, "const Foo = 1;\nfunction bar() { return 'FOO'; }\n");
  await Deno.writeTextFile(`${dir}/src/lib/b.ts`, "export const bar = 2;\n");
  await Deno.writeTextFile(`${dir}/README.md`, "# Project\nbar baz\n");
  await Deno.writeTextFile(`${dir}/gen.txt`, "generated bar output\n");
  await Deno.writeTextFile(`${dir}/.gitignore`, "gen.txt\n");
  await Deno.writeTextFile(`${dir}/.hidden.txt`, "hidden bar\n");
  for (const args of [["init"], ["config", "user.email", "test@test.com"], ["config", "user.name", "Test User"]]) {
    const cmd = new Deno.Command("git", {
      args,
      cwd: dir,
      stdout: "piped",
      stderr: "piped",
    });
    await cmd.output();
  }
  return dir;
}

/** Run all spec scenarios against one capability instance. */
async function assertSearchBehavior(cap: SearchCapability): Promise<void> {
  // Grep: basic regex search with file, line, column, and content.
  const basic = await cap.grep("bar");
  assertEquals(basic.success, true);
  assertEquals(basic.data, [
    { file: "README.md", line: 2, column: 1, content: "bar baz" },
    { file: "src/a.ts", line: 2, column: 10, content: "function bar() { return 'FOO'; }" },
    { file: "src/lib/b.ts", line: 1, column: 14, content: "export const bar = 2;" },
  ]);

  // Grep: case-insensitive via { case: false }.
  const ci = await cap.grep("foo", undefined, { case: false });
  assertEquals(ci.data, [
    { file: "src/a.ts", line: 1, column: 7, content: "const Foo = 1;" },
    { file: "src/a.ts", line: 2, column: 26, content: "function bar() { return 'FOO'; }" },
  ]);
  const caseSensitive = await cap.grep("foo");
  assertEquals(caseSensitive.data, []);

  // Grep: single-file path.
  const single = await cap.grep("bar", "src/lib/b.ts");
  assertEquals(single.data, [
    { file: "src/lib/b.ts", line: 1, column: 14, content: "export const bar = 2;" },
  ]);

  // Grep: directory path searched recursively.
  const inDir = await cap.grep("bar", "src");
  assertEquals(inDir.data, [
    { file: "src/a.ts", line: 2, column: 10, content: "function bar() { return 'FOO'; }" },
    { file: "src/lib/b.ts", line: 1, column: 14, content: "export const bar = 2;" },
  ]);

  // Grep: glob filter restricts searched files.
  const mdOnly = await cap.grep("bar", undefined, { glob: "*.md" });
  assertEquals(mdOnly.data, [
    { file: "README.md", line: 2, column: 1, content: "bar baz" },
  ]);

  // Grep: no matches yields an empty result.
  const noMatch = await cap.grep("nosuchpattern");
  assertEquals(noMatch.success, true);
  assertEquals(noMatch.data, []);

  // Grep: invalid regex returns an error.
  const invalid = await cap.grep("[invalid");
  assertEquals(invalid.success, false);
  assertEquals(invalid.error, "Invalid regex pattern: [invalid");

  // Glob: basic pattern match.
  assertEquals((await cap.glob("*.ts")).data, ["src/a.ts", "src/lib/b.ts"]);
  assertEquals((await cap.glob("src/**/*.ts")).data, ["src/a.ts", "src/lib/b.ts"]);

  // Glob: hidden files excluded by default, included with { hidden: true }.
  assertEquals((await cap.glob("*.txt")).data, []);
  assertEquals((await cap.glob("*.txt", { hidden: true })).data, [".hidden.txt"]);

  // Glob: gitignored files excluded by default, included with { gitignore: false }.
  assertEquals((await cap.glob("*.txt", { gitignore: false })).data, ["gen.txt"]);
  assertEquals((await cap.glob("*.txt", { hidden: true, gitignore: false })).data, [
    ".hidden.txt",
    "gen.txt",
  ]);

  // Glob: no matches yields an empty result.
  assertEquals((await cap.glob("*.xyz")).data, []);
}

Deno.test("SearchCapability", async (t) => {
  const dir = await createTempProject();
  const context: CapabilityContext = {
    session_id: "test-session",
    working_directory: dir,
  };

  try {
    await t.step("exposes the search definition", async () => {
      const search = new SearchCapability();
      await search.initialize(context);
      assertEquals(search.definition.name, "search");
      assertEquals(search.definition.version, "1.0.0");
      await search.dispose();
    });

    await t.step("throws when used before initialization", async () => {
      const search = new SearchCapability();
      let error: unknown;
      try {
        await search.grep("x");
      } catch (e) {
        error = e;
      }
      assertEquals(error instanceof CapabilityNotInitializedError, true);
    });

    await t.step("grep and glob satisfy the spec scenarios", async () => {
      const search = new SearchCapability();
      await search.initialize(context);
      await assertSearchBehavior(search);
      await search.dispose();
    });

    await t.step("fallback implementation satisfies the same scenarios", async () => {
      const search = new SearchCapability({ useFallback: true });
      await search.initialize(context);
      await assertSearchBehavior(search);
      await search.dispose();
    });
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});