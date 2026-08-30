import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { GitCapability } from "../git.ts";
import type { CapabilityContext } from "../capability.ts";

Deno.test("GitCapability", async (t) => {
  const context: CapabilityContext = {
    session_id: "test-session",
    working_directory: "/tmp",
  };

  await t.step("initializes successfully", async () => {
    const git = new GitCapability();
    await git.initialize(context);
    assertEquals(git.definition.name, "git");
  });

  await t.step("returns repository status", async () => {
    const git = new GitCapability();
    await git.initialize(context);

    const result = await git.getStatus();
    assertEquals(result.success, true);
    assertEquals(result.data?.branch, "main");
  });

  await t.step("returns file changes", async () => {
    const git = new GitCapability();
    await git.initialize(context);

    const result = await git.getChanges();
    assertEquals(result.success, true);
    assertEquals(Array.isArray(result.data), true);
  });

  await t.step("stages files", async () => {
    const git = new GitCapability();
    await git.initialize(context);

    const result = await git.stage(["file.txt"]);
    assertEquals(result.success, true);
  });

  await t.step("unstages files", async () => {
    const git = new GitCapability();
    await git.initialize(context);

    const result = await git.unstage(["file.txt"]);
    assertEquals(result.success, true);
  });

  await t.step("creates commit", async () => {
    const git = new GitCapability();
    await git.initialize(context);

    const result = await git.commit("Test commit");
    assertEquals(result.success, true);
    assertEquals(result.data?.message, "Test commit");
  });

  await t.step("gets commit history", async () => {
    const git = new GitCapability();
    await git.initialize(context);

    const result = await git.getHistory(5);
    assertEquals(result.success, true);
    assertEquals(Array.isArray(result.data), true);
  });

  await t.step("lists branches", async () => {
    const git = new GitCapability();
    await git.initialize(context);

    const result = await git.getBranches();
    assertEquals(result.success, true);
    assertEquals(result.data?.length, 1);
    assertEquals(result.data?.[0].name, "main");
  });

  await t.step("creates branch", async () => {
    const git = new GitCapability();
    await git.initialize(context);

    const result = await git.createBranch("feature");
    assertEquals(result.success, true);
  });

  await t.step("switches branch", async () => {
    const git = new GitCapability();
    await git.initialize(context);

    const result = await git.switchBranch("feature");
    assertEquals(result.success, true);
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

  await t.step("disposes successfully", async () => {
    const git = new GitCapability();
    await git.initialize(context);
    await git.dispose();

    // After dispose, operations should fail
    let threw = false;
    try {
      await git.getStatus();
    } catch (e) {
      threw = e instanceof Error && e.name === "CapabilityNotInitializedError";
    }
    assertEquals(threw, true);
  });
});
