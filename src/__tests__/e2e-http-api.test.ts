/**
 * Blackbox E2E tests for the harness HTTP API.
 *
 * Starts the actual server process and verifies behavior over HTTP.
 * No imports from src/ — true blackbox testing.
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  startHarness,
  type HarnessProcess,
} from "./_helpers/harness-process.ts";
import { HarnessClient, HttpError } from "./_helpers/harness-client.ts";

// ============================================================================
// Server lifecycle
// ============================================================================

let server: HarnessProcess;
let client: HarnessClient;

Deno.test("HTTP API E2E", async (t) => {
  // Start server once for all subtests
  server = await startHarness();
  client = new HarnessClient(server.url);

  // ── Health ──────────────────────────────────────────────────────────

  await t.step("health returns correct shape", async () => {
    const health = await client.getHealth();

    assertEquals(health.status, "ok");
    assertEquals(typeof health.uptime, "number");
    assertEquals(typeof health.session_count, "number");
    assertEquals(typeof health.event_count, "number");
  });

  await t.step("health reports zero sessions on fresh start", async () => {
    const health = await client.getHealth();
    assertEquals(health.session_count, 0);
    assertEquals(health.event_count, 0);
  });

  await t.step("uptime is non-negative", async () => {
    const health = await client.getHealth();
    assertEquals(health.uptime >= 0, true);
  });

  // ── Sessions ────────────────────────────────────────────────────────

  await t.step("sessions list is empty on fresh start", async () => {
    const sessions = await client.getSessions();
    assertEquals(Array.isArray(sessions), true);
    assertEquals(sessions.length, 0);
  });

  // ── Session 404 ─────────────────────────────────────────────────────

  await t.step("session not found returns 404", async () => {
    try {
      await client.getSession("nonexistent-session-id");
      throw new Error("Expected HttpError");
    } catch (error) {
      assertEquals(error instanceof HttpError, true);
      assertEquals((error as HttpError).status, 404);
    }
  });

  // ── Capabilities ────────────────────────────────────────────────────

  await t.step("capabilities lists registered capabilities", async () => {
    const capabilities = await client.getCapabilities();

    assertEquals(Array.isArray(capabilities), true);
    assertExists(capabilities.length > 0);

    // Verify each capability has the expected shape
    for (const cap of capabilities) {
      assertEquals(typeof cap.name, "string");
      assertEquals(typeof cap.version, "string");
      assertEquals(typeof cap.initialized, "boolean");
    }
  });

  await t.step("capabilities includes git and shell", async () => {
    const capabilities = await client.getCapabilities();
    const names = capabilities.map((c) => c.name);

    assertEquals(names.includes("git"), true);
    assertEquals(names.includes("shell"), true);
  });

  // ── CORS ────────────────────────────────────────────────────────────

  await t.step("CORS preflight returns 204", async () => {
    const result = await client.options("/api/health");
    assertEquals(result.status, 204);
    assertEquals(
      result.headers["access-control-allow-origin"],
      "*",
    );
  });

  await t.step("GET response includes CORS headers", async () => {
    const res = await fetch(`${server.url}/api/health`, {
      headers: { "Origin": "http://localhost:3000" },
    });

    assertEquals(res.headers.get("access-control-allow-origin"), "*");
    res.body?.cancel();
  });

  // ── 404 for unknown routes ──────────────────────────────────────────

  await t.step("unknown route returns 404", async () => {
    const res = await fetch(`${server.url}/api/nonexistent`);
    assertEquals(res.status, 404);
    res.body?.cancel();
  });

  // Cleanup
  await server.stop();
});
