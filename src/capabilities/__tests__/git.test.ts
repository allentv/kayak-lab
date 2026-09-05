import { assertEquals, assertExists } from "@std/assert";
import { GitCapability } from "../git.ts";
import type { CapabilityContext } from "../capability.ts";

/** Create a temporary git repo for testing. */
async function createTempRepo(): Promise<string> {
  const dir = await Deno.makeTempDir({ prefix: "git-test-" });
  const cmd = new Deno.Command("git", {
    args: ["init"],
    cwd: dir,
    stdout: "piped",
    stderr: "piped",
  });
  await cmd.output();

  // Configure git user for commits
  const configCmd = new Deno.Command("git", {
    args: ["config", "user.email", "test@test.com"],
    cwd: dir,
    stdout: "piped",
    stderr: "piped",
  });
  await configCmd.output();

  const configNameCmd = new Deno.Command("git", {
    args: ["config", "user.name", "Test User"],
    cwd: dir,
    stdout: "piped",
    stderr: "piped",
  });
  await configNameCmd.output();

  return dir;
}

/** Remove temp dir recursively. */
async function removeTempDir(dir: string): Promise<void> {
  await Deno.remove(dir, { recursive: true });
}

Deno.test("GitCapability", async (t) => {
  const dir = await createTempRepo();
  const context: CapabilityContext = {
    session_id: "test-session",
    working_directory: dir,
  };

  try {
    await t.step("initializes successfully", async () => {
      const git = new GitCapability();
      await git.initialize(context);
      assertEquals(git.definition.name, "git");
    });

    await t.step("getStatus returns branch info", async () => {
      const git = new GitCapability();
      await git.initialize(context);

      const result = await git.getStatus();
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.branch, "master");
      assertEquals(result.data.changes.length, 0);
    });

    await t.step("stage and getStatus shows staged files", async () => {
      const git = new GitCapability();
      await git.initialize(context);

      // Create a file
      await Deno.writeTextFile(`${dir}/test.txt`, "hello");

      const stageResult = await git.stage(["test.txt"]);
      assertEquals(stageResult.success, true);

      const status = await git.getStatus();
      assertEquals(status.success, true);
      assertEquals(status.data?.changes.length, 1);
      assertEquals(status.data?.changes[0].status, "staged");
    });

    await t.step("commit creates a real commit", async () => {
      const git = new GitCapability();
      await git.initialize(context);

      const result = await git.commit("Initial commit");
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.message, "Initial commit");
      assertExists(result.data.hash);
      assertEquals(result.data.hash.length > 0, true);
    });

    await t.step("getHistory returns commits", async () => {
      const git = new GitCapability();
      await git.initialize(context);

      const result = await git.getHistory(5);
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length >= 1, true);
      assertEquals(result.data[0].message, "Initial commit");
    });

    await t.step("getChanges returns modified files", async () => {
      const git = new GitCapability();
      await git.initialize(context);

      await Deno.writeTextFile(`${dir}/test.txt`, "modified");
      // Stage it to make it "staged"
      await git.stage(["test.txt"]);

      const result = await git.getChanges();
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length >= 1, true);
    });

    await t.step("createBranch and switchBranch work", async () => {
      const git = new GitCapability();
      await git.initialize(context);

      const createResult = await git.createBranch("feature");
      assertEquals(createResult.success, true);

      const switchResult = await git.switchBranch("feature");
      assertEquals(switchResult.success, true);

      const status = await git.getStatus();
      assertEquals(status.data?.branch, "feature");
    });

    await t.step("getBranches lists all branches", async () => {
      const git = new GitCapability();
      await git.initialize(context);

      const result = await git.getBranches();
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length >= 2, true);

      const current = result.data.find((b) => b.is_current);
      assertExists(current);
      assertEquals(current.name, "feature");
    });

    await t.step("commit returns correct hash", async () => {
      const git = new GitCapability();
      await git.initialize(context);

      await Deno.writeTextFile(`${dir}/another.txt`, "content");
      await git.stage(["another.txt"]);

      const result = await git.commit("Second commit");
      assertEquals(result.success, true);

      // Verify the hash matches git log
      const logCmd = new Deno.Command("git", {
        args: ["log", "-1", "--format=%H"],
        cwd: dir,
        stdout: "piped",
      });
      const logOutput = await logCmd.output();
      const expectedHash = new TextDecoder().decode(logOutput.stdout).trim();
      assertEquals(result.data?.hash, expectedHash);
    });

    await t.step("unstage removes files from index", async () => {
      const git = new GitCapability();
      await git.initialize(context);

      await Deno.writeTextFile(`${dir}/unstage-test.txt`, "content");
      await git.stage(["unstage-test.txt"]);

      const unstageResult = await git.unstage(["unstage-test.txt"]);
      assertEquals(unstageResult.success, true);

      const status = await git.getStatus();
      const unstaged = status.data?.changes.find((c) => c.path === "unstage-test.txt");
      assertExists(unstaged);
      assertEquals(unstaged.status, "untracked");
    });

    await t.step("fails when not initialized", async () => {
      const git = new GitCapability();

      let threw = false;
      try {
        await git.getStatus();
      } catch (e) {
        threw = e instanceof Error && e.name === "CapabilityNotInitializedError";
      }
      assertEquals(threw, true);
    });

    await t.step("commit fails gracefully on git error", async () => {
      // Create a git repo but then corrupt the HEAD to force a commit failure
      const corruptDir = await createTempRepo();
      const corruptContext: CapabilityContext = {
        session_id: "test-corrupt",
        working_directory: corruptDir,
      };

      try {
        // Remove .git/HEAD to break git
        await Deno.remove(`${corruptDir}/.git/HEAD`);

        const git = new GitCapability();
        await git.initialize(corruptContext);

        const result = await git.commit("Should fail");
        assertEquals(result.success, false);
        assertExists(result.error);
      } finally {
        await removeTempDir(corruptDir);
      }
    });

    await t.step("getStatus returns empty changes on clean repo", async () => {
      const git = new GitCapability();
      await git.initialize(context);

      // Commit everything so working tree is clean
      const files = ["test.txt", "another.txt", "unstage-test.txt"];
      for (const f of files) {
        try {
          await Deno.writeTextFile(`${dir}/${f}`, "clean");
        } catch {
          // file may not exist
        }
      }
      await git.stage(files);
      await git.commit("Clean state");

      const result = await git.getStatus();
      assertEquals(result.success, true);
      assertEquals(result.data?.changes.length, 0);
    });

    await t.step("disposes successfully", async () => {
      const git = new GitCapability();
      await git.initialize(context);
      await git.dispose();

      let threw = false;
      try {
        await git.getStatus();
      } catch (e) {
        threw = e instanceof Error && e.name === "CapabilityNotInitializedError";
      }
      assertEquals(threw, true);
    });
  } finally {
    await removeTempDir(dir);
  }
});
