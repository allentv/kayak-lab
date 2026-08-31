/**
 * Tests for SandboxedShellCapability.
 *
 * Tests Deno permission injection and result mapping.
 */

import { assertEquals, assertExists } from "@std/assert";
import { SandboxedShellCapability } from "../sandboxed-shell.ts";
import { DockerRuntime } from "../sandbox/docker-runtime.ts";

Deno.test("SandboxedShellCapability", async (t) => {
  await t.step("has correct definition", () => {
    const runtime = new DockerRuntime();
    const shell = new SandboxedShellCapability(runtime);

    assertEquals(shell.definition.name, "sandboxed-shell");
    assertEquals(shell.definition.version, "1.0.0");
  });

  await t.step("initialize and dispose", async () => {
    const runtime = new DockerRuntime();
    const shell = new SandboxedShellCapability(runtime);

    await shell.initialize({
      session_id: "test-session",
      working_directory: "/tmp",
    });

    const dir = await shell.getWorkingDirectory();
    assertEquals(dir.success, true);
    assertEquals(dir.data, "/tmp");

    await shell.dispose();
  });

  await t.step("exec returns result in ShellExecResult format", async () => {
    const runtime = new DockerRuntime();
    const shell = new SandboxedShellCapability(runtime);
    await shell.initialize({ session_id: "test" });

    const result = await shell.exec("echo hello");

    assertEquals(result.success, true);
    assertExists(result.data);
    assertEquals(result.data.exit_code, 0);
    assertEquals(result.data.stdout.trim(), "hello");
    assertEquals(typeof result.data.duration_ms, "number");
    assertEquals(typeof result.data.timed_out, "boolean");
  });

  await t.step("exec handles command failure", async () => {
    const runtime = new DockerRuntime();
    const shell = new SandboxedShellCapability(runtime);
    await shell.initialize({ session_id: "test" });

    const result = await shell.exec("exit 1");

    assertEquals(result.success, true);
    assertEquals(result.data?.exit_code, 1);
  });

  await t.step("getEnvironment returns sandbox info", async () => {
    const runtime = new DockerRuntime();
    const shell = new SandboxedShellCapability(runtime);
    await shell.initialize({ session_id: "test" });

    const env = await shell.getEnvironment();

    assertEquals(env.success, true);
    assertEquals(env.data?.platform, "sandbox");
    assertEquals(env.data?.shell, "sh");
  });

  await t.step("commandExists checks command availability", async () => {
    const runtime = new DockerRuntime();
    const shell = new SandboxedShellCapability(runtime);
    await shell.initialize({ session_id: "test" });

    const exists = await shell.commandExists("echo");
    assertEquals(exists.success, true);
    assertEquals(exists.data, true);

    const notExists = await shell.commandExists("nonexistent-command-xyz");
    assertEquals(notExists.success, true);
    assertEquals(notExists.data, false);
  });
});

Deno.test("SandboxedShellCapability - Deno permission injection", async (t) => {
  // Test that Deno permission flags are injected for deno run commands
  await t.step("injects permissions for deno run commands", async () => {
    const runtime = new DockerRuntime();
    const shell = new SandboxedShellCapability(runtime);
    await shell.initialize({ session_id: "test" });

    // The injectDenoPermissions method is private, so we test via exec
    // We verify the command runs successfully (permissions don't break it)
    const result = await shell.exec("deno eval 'console.log(\"hello\")'");

    assertEquals(result.success, true);
    assertEquals(result.data?.exit_code, 0);
  });

  await t.step("does not inject for non-deno commands", async () => {
    const runtime = new DockerRuntime();
    const shell = new SandboxedShellCapability(runtime);
    await shell.initialize({ session_id: "test" });

    // Regular commands should pass through unchanged
    const result = await shell.exec("echo test");

    assertEquals(result.success, true);
    assertEquals(result.data?.exit_code, 0);
    assertEquals(result.data?.stdout.trim(), "test");
  });
});
