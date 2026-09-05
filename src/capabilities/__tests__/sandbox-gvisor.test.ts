/**
 * Unit tests for gVisor sandbox runtime.
 *
 * Tests gVisor-specific behavior on top of Docker runtime.
 * Requires Docker with runsc runtime installed.
 */

import { assertEquals, assertExists } from "@std/assert";
import { GVisorRuntime } from "../sandbox/gvisor-runtime.ts";

Deno.test("GVisorRuntime", async (t) => {
  await t.step("has correct name", () => {
    const runtime = new GVisorRuntime();
    assertEquals(runtime.name, "docker-runsc");
  });

  await t.step("healthCheck returns structured result", async () => {
    const runtime = new GVisorRuntime();
    const status = await runtime.healthCheck();

    assertExists(status.healthy);
    assertExists(status.checks);
    assertEquals(Array.isArray(status.checks), true);

    for (const check of status.checks) {
      assertExists(check.name);
      assertExists(check.passed);
      assertExists(check.message);
    }
  });

  await t.step("healthCheck verifies Docker is installed", async () => {
    const runtime = new GVisorRuntime();
    const status = await runtime.healthCheck();

    const dockerCheck = status.checks.find((c) => c.name === "docker-installed");
    assertExists(dockerCheck);
    assertEquals(dockerCheck.passed, true);
  });

  await t.step("healthCheck verifies runsc is available", async () => {
    const runtime = new GVisorRuntime();
    const status = await runtime.healthCheck();

    const runscCheck = status.checks.find((c) => c.name === "runtime-available");
    assertExists(runscCheck);
    assertEquals(runscCheck.passed, true);
  });

  await t.step("healthCheck tests gVisor container execution", async () => {
    const runtime = new GVisorRuntime();
    const status = await runtime.healthCheck();

    const execCheck = status.checks.find((c) => c.name === "test-execution");
    assertExists(execCheck);
    assertEquals(execCheck.passed, true);
  });

  await t.step("healthCheck tests ptrace blocking", async () => {
    const runtime = new GVisorRuntime();
    const status = await runtime.healthCheck();

    const ptraceCheck = status.checks.find((c) => c.name === "ptrace-blocked");
    assertExists(ptraceCheck);
    assertEquals(ptraceCheck.passed, true);
  });

  await t.step("execute runs command in gVisor container", async () => {
    const runtime = new GVisorRuntime();
    const result = await runtime.execute({
      command: "echo gvisor-test",
    });

    assertEquals(result.exit_code, 0);
    assertEquals(result.stdout.trim(), "gvisor-test");
  });

  await t.step("execute uses gVisor kernel", async () => {
    const runtime = new GVisorRuntime();
    const result = await runtime.execute({
      command: "cat /proc/version",
    });

    assertEquals(result.exit_code, 0);
    // gVisor containers report gvisor in /proc/version (lowercase)
    assertEquals(result.stdout.includes("gvisor") || result.stdout.includes("runsc"), true);
  });

  await t.step("execute respects network isolation", async () => {
    const runtime = new GVisorRuntime();
    const result = await runtime.execute({
      command: "wget -q -O /dev/null http://example.com 2>&1; echo exit:$?",
    });

    // Network should be blocked
    assertEquals(result.exit_code !== 0 || result.stdout.includes("exit:1") || result.stdout.includes("exit:8"), true);
  });
});
