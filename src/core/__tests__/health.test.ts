/**
 * Tests for health check system.
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  HealthRegistry,
  createHealthHandler,
  errorResponse,
  errorHttpResponse,
} from "../health.ts";
import type { ComponentHealth } from "../health.ts";

Deno.test("HealthRegistry", async (t) => {
  await t.step("register and check", async () => {
    const registry = new HealthRegistry();
    registry.register("test-component", () => ({
      name: "test-component",
      healthy: true,
      message: "OK",
      duration_ms: 0,
    }));

    const result = await registry.check();

    assertEquals(result.status, "healthy");
    assertEquals(result.components.length, 1);
    assertEquals(result.components[0].name, "test-component");
    assertEquals(result.components[0].healthy, true);
  });

  await t.step("deregister removes check", async () => {
    const registry = new HealthRegistry();
    registry.register("comp-a", () => ({
      name: "comp-a",
      healthy: true,
      message: "OK",
      duration_ms: 0,
    }));

    registry.deregister("comp-a");
    const result = await registry.check();

    assertEquals(result.components.length, 0);
    assertEquals(result.status, "healthy");
  });

  await t.step("runs checks in parallel", async () => {
    const registry = new HealthRegistry();
    let checkCount = 0;

    registry.register("slow", () => {
      checkCount++;
      return { name: "slow", healthy: true, message: "OK", duration_ms: 0 };
    });
    registry.register("fast", () => {
      checkCount++;
      return { name: "fast", healthy: true, message: "OK", duration_ms: 0 };
    });

    await registry.check();

    assertEquals(checkCount, 2);
  });

  await t.step("returns degraded when some checks fail", async () => {
    const registry = new HealthRegistry();
    registry.register("healthy", () => ({
      name: "healthy",
      healthy: true,
      message: "OK",
      duration_ms: 0,
    }));
    registry.register("unhealthy", () => ({
      name: "unhealthy",
      healthy: false,
      message: "Failed",
      duration_ms: 0,
    }));

    const result = await registry.check();

    assertEquals(result.status, "degraded");
    assertEquals(result.components.length, 2);
  });

  await t.step("returns unhealthy when all checks fail", async () => {
    const registry = new HealthRegistry();
    registry.register("a", () => ({
      name: "a",
      healthy: false,
      message: "Failed",
      duration_ms: 0,
    }));
    registry.register("b", () => ({
      name: "b",
      healthy: false,
      message: "Failed",
      duration_ms: 0,
    }));

    const result = await registry.check();

    assertEquals(result.status, "unhealthy");
  });

  await t.step("handles check timeout", async () => {
    const registry = new HealthRegistry(100); // 100ms timeout
    registry.register("slow", () => {
      // Simulate slow check
      return new Promise<ComponentHealth>((resolve) => {
        setTimeout(() => {
          resolve({
            name: "slow",
            healthy: true,
            message: "OK",
            duration_ms: 0,
          });
        }, 500);
      });
    });

    const result = await registry.check();

    assertEquals(result.status, "unhealthy");
    assertEquals(result.components[0].healthy, false);
    assertEquals(
      result.components[0].message.includes("timed out"),
      true,
    );
  });

  await t.step("handles check error", async () => {
    const registry = new HealthRegistry();
    registry.register("error", () => {
      throw new Error("Check failed");
    });

    const result = await registry.check();

    assertEquals(result.status, "unhealthy");
    assertEquals(result.components[0].healthy, false);
    assertEquals(result.components[0].message, "Check failed");
  });

  await t.step("returns healthy with no registered checks", async () => {
    const registry = new HealthRegistry();
    const result = await registry.check();

    assertEquals(result.status, "healthy");
    assertEquals(result.components.length, 0);
  });

  await t.step("timestamp is ISO string", async () => {
    const registry = new HealthRegistry();
    const result = await registry.check();

    assertExists(result.timestamp);
    // Should be parseable as ISO date
    assertEquals(!isNaN(Date.parse(result.timestamp)), true);
  });
});

Deno.test("createHealthHandler", async (t) => {
  await t.step("GET /health returns health status", async () => {
    const registry = new HealthRegistry();
    registry.register("test", () => ({
      name: "test",
      healthy: true,
      message: "OK",
      duration_ms: 0,
    }));

    const handler = createHealthHandler(registry);
    const req = new Request("http://localhost/health");
    const res = await handler(req);

    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.status, "healthy");
    assertEquals(Array.isArray(body.components), true);
  });

  await t.step("GET /health returns 503 when unhealthy", async () => {
    const registry = new HealthRegistry();
    registry.register("test", () => ({
      name: "test",
      healthy: false,
      message: "Failed",
      duration_ms: 0,
    }));

    const handler = createHealthHandler(registry);
    const req = new Request("http://localhost/health");
    const res = await handler(req);

    assertEquals(res.status, 503);
  });

  await t.step("GET /ready returns readiness", async () => {
    const registry = new HealthRegistry();
    registry.register("test", () => ({
      name: "test",
      healthy: true,
      message: "OK",
      duration_ms: 0,
    }));

    const handler = createHealthHandler(registry);
    const req = new Request("http://localhost/ready");
    const res = await handler(req);

    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.ready, true);
  });

  await t.step("GET /ready returns 503 when unhealthy", async () => {
    const registry = new HealthRegistry();
    registry.register("test", () => ({
      name: "test",
      healthy: false,
      message: "Failed",
      duration_ms: 0,
    }));

    const handler = createHealthHandler(registry);
    const req = new Request("http://localhost/ready");
    const res = await handler(req);

    assertEquals(res.status, 503);
    const body = await res.json();
    assertEquals(body.ready, false);
  });

  await t.step("GET /alive returns liveness", async () => {
    const handler = createHealthHandler(new HealthRegistry());
    const req = new Request("http://localhost/alive");
    const res = await handler(req);

    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.alive, true);
    assertExists(body.timestamp);
  });

  await t.step("unknown path returns 404", async () => {
    const handler = createHealthHandler(new HealthRegistry());
    const req = new Request("http://localhost/unknown");
    const res = await handler(req);

    assertEquals(res.status, 404);
  });
});

Deno.test("errorResponse", async (t) => {
  await t.step("creates structured error response", () => {
    const response = errorResponse("VALIDATION_ERROR", "Invalid input", {
      field: "name",
    });

    assertEquals(response.error.code, "VALIDATION_ERROR");
    assertEquals(response.error.message, "Invalid input");
    assertEquals(response.error.details?.field, "name");
    assertExists(response.error.timestamp);
  });

  await t.step("creates response without details", () => {
    const response = errorResponse("NOT_FOUND", "Resource not found");

    assertEquals(response.error.code, "NOT_FOUND");
    assertEquals(response.error.details, undefined);
  });
});

Deno.test("errorHttpResponse", async (t) => {
  await t.step("creates HTTP response with error", async () => {
    const res = errorHttpResponse(400, "BAD_REQUEST", "Invalid data");

    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error.code, "BAD_REQUEST");
    assertEquals(body.error.message, "Invalid data");
  });

  await t.step("sets content-type header", () => {
    const res = errorHttpResponse(500, "INTERNAL_ERROR", "Oops");

    assertEquals(res.headers.get("Content-Type"), "application/json");
  });
});
