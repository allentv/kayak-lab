import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ShellCapability } from "../shell.ts";
import type { CapabilityContext } from "../capability.ts";

Deno.test("ShellCapability", async (t) => {
  const context: CapabilityContext = {
    session_id: "test-session",
    working_directory: "/tmp",
  };

  await t.step("initializes successfully", async () => {
    const shell = new ShellCapability();
    await shell.initialize(context);
    assertEquals(shell.definition.name, "shell");
  });

  await t.step("executes simple command", async () => {
    const shell = new ShellCapability();
    await shell.initialize(context);

    const result = await shell.exec("echo hello");
    assertEquals(result.success, true);
    assertEquals(result.data?.exit_code, 0);
    assertEquals(result.data?.stdout.trim(), "hello");
  });

  await t.step("handles command failure", async () => {
    const shell = new ShellCapability();
    await shell.initialize(context);

    const result = await shell.exec("exit 1");
    assertEquals(result.success, true);
    assertEquals(result.data?.exit_code, 1);
  });

  await t.step("gets environment info", async () => {
    const shell = new ShellCapability();
    await shell.initialize(context);

    const result = await shell.getEnvironment();
    assertEquals(result.success, true);
    assertEquals(result.data?.platform, Deno.build.os);
  });

  await t.step("checks command existence", async () => {
    const shell = new ShellCapability();
    await shell.initialize(context);

    const result = await shell.commandExists("echo");
    assertEquals(result.success, true);
    assertEquals(result.data, true);
  });

  await t.step("returns false for non-existent command", async () => {
    const shell = new ShellCapability();
    await shell.initialize(context);

    const result = await shell.commandExists("nonexistent_command_12345");
    assertEquals(result.success, true);
    assertEquals(result.data, false);
  });

  await t.step("gets working directory", async () => {
    const shell = new ShellCapability();
    await shell.initialize(context);

    const result = await shell.getWorkingDirectory();
    assertEquals(result.success, true);
    assertEquals(result.data, "/tmp");
  });

  await t.step("sets working directory", async () => {
    const shell = new ShellCapability();
    await shell.initialize(context);

    const result = await shell.setWorkingDirectory("/tmp");
    assertEquals(result.success, true);

    const dir = await shell.getWorkingDirectory();
    assertEquals(dir.data, "/tmp");
  });

  await t.step("rejects blocked commands", async () => {
    const shell = new ShellCapability();
    await shell.initialize(context);

    const result = await shell.exec("sudo ls");
    assertEquals(result.success, false);
    assertEquals(result.error?.includes("Blocked"), true);
  });

  await t.step("rejects dangerous commands", async () => {
    const shell = new ShellCapability();
    await shell.initialize(context);

    const result = await shell.exec("rm -rf /");
    assertEquals(result.success, false);
    assertEquals(result.error?.includes("approval"), true);
  });

  await t.step("fails when not initialized", async () => {
    const shell = new ShellCapability();

    let threw = false;
    try {
      await shell.exec("echo test");
    } catch (e) {
      threw = e instanceof Error && e.name === "CapabilityNotInitializedError";
    }
    assertEquals(threw, true);
  });

  await t.step("disposes successfully", async () => {
    const shell = new ShellCapability();
    await shell.initialize(context);
    await shell.dispose();

    // After dispose, operations should fail
    let threw = false;
    try {
      await shell.exec("echo test");
    } catch (e) {
      threw = e instanceof Error && e.name === "CapabilityNotInitializedError";
    }
    assertEquals(threw, true);
  });
});
