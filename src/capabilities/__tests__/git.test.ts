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

/** Run a git command in a directory, throwing on failure. Returns combined output. */
async function runGit(cwd: string, args: string[]): Promise<string> {
  const cmd = new Deno.Command("git", {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const output = await cmd.output();
  const text = new TextDecoder().decode(output.stdout) +
    new TextDecoder().decode(output.stderr);
  if (!output.success) {
    throw new Error(`git ${args.join(" ")} failed: ${text}`);
  }
  return text;
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

    await t.step("getDiff returns unstaged and staged diffs", async () => {
      const git = new GitCapability();
      await git.initialize(context);

      // Unstaged modification of a tracked file
      await Deno.writeTextFile(`${dir}/test.txt`, "modified again");
      const unstaged = await git.getDiff();
      assertEquals(unstaged.success, true);
      assertExists(unstaged.data);
      assertEquals(unstaged.data.includes("diff --git a/test.txt b/test.txt"), true);
      assertEquals(unstaged.data.includes("+modified again"), true);

      // Nothing staged yet: empty diff is a success with empty data
      const stagedBefore = await git.getDiff(undefined, { staged: true });
      assertEquals(stagedBefore.success, true);
      assertEquals(stagedBefore.data, "");

      // Stage the file: unstaged diff empties out, staged diff shows the change
      await git.stage(["test.txt"]);

      const unstagedAfter = await git.getDiff();
      assertEquals(unstagedAfter.success, true);
      assertEquals(unstagedAfter.data, "");

      const stagedAfter = await git.getDiff(undefined, { staged: true });
      assertEquals(stagedAfter.success, true);
      assertExists(stagedAfter.data);
      assertEquals(stagedAfter.data.includes("diff --git a/test.txt b/test.txt"), true);
      assertEquals(stagedAfter.data.includes("+modified again"), true);

      // Restore clean state for later steps
      await git.commit("Diff state");
    });

    await t.step("getDiff(path) scopes the diff to one file", async () => {
      const git = new GitCapability();
      await git.initialize(context);

      await Deno.writeTextFile(`${dir}/test.txt`, "scoped change");
      await Deno.writeTextFile(`${dir}/another.txt`, "other change");

      const result = await git.getDiff("another.txt");
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.includes("diff --git a/another.txt b/another.txt"), true);
      assertEquals(result.data.includes("+other change"), true);
      assertEquals(result.data.includes("diff --git a/test.txt"), false);
      assertEquals(result.data.includes("+scoped change"), false);

      // Restore clean state for later steps
      await git.stage(["test.txt", "another.txt"]);
      await git.commit("Scoped diff state");
    });

    await t.step("push and pull transfer commits through a real remote", async () => {
      // Set up: bare remote + two clones of it, all in one temp workspace
      const ws = await Deno.makeTempDir({ prefix: "git-remote-" });
      const remoteDir = `${ws}/remote.git`;
      const cloneA = `${ws}/clone-a`;
      const cloneB = `${ws}/clone-b`;

      try {
        await runGit(ws, ["init", "--bare", remoteDir]);
        await runGit(ws, ["clone", remoteDir, "clone-a"]);
        await runGit(cloneA, ["config", "user.email", "test@test.com"]);
        await runGit(cloneA, ["config", "user.name", "Test User"]);

        const gitA = new GitCapability();
        await gitA.initialize({
          session_id: "test-push",
          working_directory: cloneA,
        });

        // Commit in clone-a and push to the bare remote
        await Deno.writeTextFile(`${cloneA}/pushed.txt`, "pushed content");
        const stageResult = await gitA.stage(["pushed.txt"]);
        assertEquals(stageResult.success, true);
        const commitResult = await gitA.commit("Push commit");
        assertEquals(commitResult.success, true);

        const pushResult = await gitA.push("origin", "master");
        assertEquals(pushResult.success, true);

        // The remote actually received the commit
        const lsRemote = await runGit(ws, ["ls-remote", remoteDir, "refs/heads/master"]);
        assertEquals(lsRemote.includes(commitResult.data?.hash ?? "missing"), true);

        // Failures surface as success: false (unknown remote)
        const failedPush = await gitA.push("nonexistent-remote", "master");
        assertEquals(failedPush.success, false);
        assertExists(failedPush.error);

        // clone-b is cloned only now so its history includes clone-a's push
        await runGit(ws, ["clone", remoteDir, "clone-b"]);
        await runGit(cloneB, ["config", "user.email", "test@test.com"]);
        await runGit(cloneB, ["config", "user.name", "Test User"]);
        const gitB = new GitCapability();
        await gitB.initialize({
          session_id: "test-pull",
          working_directory: cloneB,
        });
        await Deno.writeTextFile(`${cloneB}/pulled.txt`, "pulled content");
        await gitB.stage(["pulled.txt"]);
        await gitB.commit("Pull commit");
        const pushB = await gitB.push("origin", "master");
        assertEquals(pushB.success, true);

        // clone-a pulls and receives clone-b's change
        const pullResult = await gitA.pull("origin", "master");
        assertEquals(pullResult.success, true);
        const content = await Deno.readTextFile(`${cloneA}/pulled.txt`);
        assertEquals(content, "pulled content");

        // Failures surface as success: false (unknown remote)
        const failedPull = await gitA.pull("nonexistent-remote", "master");
        assertEquals(failedPull.success, false);
        assertExists(failedPull.error);
      } finally {
        await removeTempDir(ws);
      }
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
