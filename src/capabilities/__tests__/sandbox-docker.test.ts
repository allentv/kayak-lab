/**
 * Unit tests for Docker sandbox runtime.
 *
 * Tests Docker command construction and configuration.
 * Requires Docker to be installed for integration tests.
 */

import { assertEquals, assertExists } from "@std/assert";
import { DockerRuntime } from "../sandbox/docker-runtime.ts";

Deno.test("DockerRuntime", async (t) => {
  await t.step("has correct name", () => {
    const runtime = new DockerRuntime();
    assertEquals(runtime.name, "docker");
  });

  await t.step("has correct name with custom runtime", () => {
    const runtime = new DockerRuntime({ runtime: "runsc" });
    assertEquals(runtime.name, "docker-runsc");
  });

  await t.step("has correct default config", () => {
    const runtime = new DockerRuntime();
    assertExists(runtime.healthCheck);
    assertExists(runtime.setup);
  });

  await t.step("healthCheck returns structured result", async () => {
    const runtime = new DockerRuntime();
    const status = await runtime.healthCheck();

    assertExists(status.healthy);
    assertExists(status.checks);
    assertEquals(Array.isArray(status.checks), true);

    // Each check should have name, passed, message
    for (const check of status.checks) {
      assertExists(check.name);
      assertExists(check.passed);
      assertExists(check.message);
      assertEquals(typeof check.name, "string");
      assertEquals(typeof check.passed, "boolean");
      assertEquals(typeof check.message, "string");
    }
  });

  await t.step("healthCheck verifies Docker is installed", async () => {
    const runtime = new DockerRuntime();
    const status = await runtime.healthCheck();

    const dockerCheck = status.checks.find((c) => c.name === "docker-installed");
    assertExists(dockerCheck);
    // Docker should be installed on test system
    assertEquals(dockerCheck.passed, true);
  });

  await t.step("healthCheck verifies Docker daemon is running", async () => {
    const runtime = new DockerRuntime();
    const status = await runtime.healthCheck();

    const daemonCheck = status.checks.find((c) => c.name === "docker-daemon");
    assertExists(daemonCheck);
    assertEquals(daemonCheck.passed, true);
  });

  await t.step("healthCheck tests container execution", async () => {
    const runtime = new DockerRuntime();
    const status = await runtime.healthCheck();

    const execCheck = status.checks.find((c) => c.name === "test-execution");
    assertExists(execCheck);
    assertEquals(execCheck.passed, true);
  });

  await t.step("healthCheck tests network isolation", async () => {
    const runtime = new DockerRuntime();
    const status = await runtime.healthCheck();

    const netCheck = status.checks.find((c) => c.name === "network-isolation");
    assertExists(netCheck);
    assertEquals(netCheck.passed, true);
  });

  await t.step("execute runs command in container", async () => {
    const runtime = new DockerRuntime();
    const result = await runtime.execute({
      command: "echo hello",
    });

    assertEquals(result.exit_code, 0);
    assertEquals(result.stdout.trim(), "hello");
    assertEquals(result.timed_out, false);
  });

  await t.step("execute handles command failure", async () => {
    const runtime = new DockerRuntime();
    const result = await runtime.execute({
      command: "exit 1",
    });

    assertEquals(result.exit_code, 1);
  });

  await t.step("execute respects timeout", async () => {
    const runtime = new DockerRuntime();
    const result = await runtime.execute({
      command: "sleep 10",
      resource_limits: { timeout_ms: 1000 },
    });

    assertEquals(result.timed_out, true);
    assertEquals(result.exit_code, 137);
  });

  await t.step("execute with custom resource limits", async () => {
    const runtime = new DockerRuntime();
    const result = await runtime.execute({
      command: "echo test",
      resource_limits: {
        memory: "128m",
        cpus: 0.5,
        pids: 64,
      },
    });

    assertEquals(result.exit_code, 0);
    assertEquals(result.stdout.trim(), "test");
  });
});
