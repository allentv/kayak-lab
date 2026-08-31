import {
  assertEquals,
  assertRejects,
  assertInstanceOf,
} from "@std/assert";
import { CircuitBreaker, CircuitState, CircuitOpenError } from "../circuit-breaker.ts";

Deno.test("Circuit Breaker", async (t) => {
  await t.step("starts in closed state", () => {
    const cb = new CircuitBreaker("test");
    assertEquals(cb.getState(), CircuitState.CLOSED);
    assertEquals(cb.getFailureCount(), 0);
  });

  await t.step("stays closed below failure threshold", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 3,
      recoveryTimeMs: 100,
      halfOpenMaxAttempts: 1,
    });

    for (let i = 0; i < 2; i++) {
      await cb.execute(async () => {
        throw new Error("fail");
      }).catch(() => {});
    }

    assertEquals(cb.getState(), CircuitState.CLOSED);
    assertEquals(cb.getFailureCount(), 2);
  });

  await t.step("opens after failure threshold", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 3,
      recoveryTimeMs: 100,
      halfOpenMaxAttempts: 1,
    });

    for (let i = 0; i < 3; i++) {
      await cb.execute(async () => {
        throw new Error("fail");
      }).catch(() => {});
    }

    assertEquals(cb.getState(), CircuitState.OPEN);
  });

  await t.step("rejects execution when open", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 2,
      recoveryTimeMs: 1000,
      halfOpenMaxAttempts: 1,
    });

    for (let i = 0; i < 2; i++) {
      await cb.execute(async () => {
        throw new Error("fail");
      }).catch(() => {});
    }

    assertEquals(cb.getState(), CircuitState.OPEN);

    await assertRejects(
      () => cb.execute(async () => "should not run"),
      CircuitOpenError,
    );
  });

  await t.step("transitions to half-open after recovery time", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 2,
      recoveryTimeMs: 50,
      halfOpenMaxAttempts: 1,
    });

    for (let i = 0; i < 2; i++) {
      await cb.execute(async () => {
        throw new Error("fail");
      }).catch(() => {});
    }

    assertEquals(cb.getState(), CircuitState.OPEN);

    // Wait for recovery
    await new Promise((r) => setTimeout(r, 60));

    assertEquals(cb.getState(), CircuitState.HALF_OPEN);
  });

  await t.step("closes on successful half-open test", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 2,
      recoveryTimeMs: 50,
      halfOpenMaxAttempts: 1,
    });

    for (let i = 0; i < 2; i++) {
      await cb.execute(async () => {
        throw new Error("fail");
      }).catch(() => {});
    }

    await new Promise((r) => setTimeout(r, 60));

    const result = await cb.execute(async () => "recovered");
    assertEquals(result, "recovered");
    assertEquals(cb.getState(), CircuitState.CLOSED);
    assertEquals(cb.getFailureCount(), 0);
  });

  await t.step("re-opens on failure during half-open", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 2,
      recoveryTimeMs: 50,
      halfOpenMaxAttempts: 1,
    });

    for (let i = 0; i < 2; i++) {
      await cb.execute(async () => {
        throw new Error("fail");
      }).catch(() => {});
    }

    await new Promise((r) => setTimeout(r, 60));
    assertEquals(cb.getState(), CircuitState.HALF_OPEN);

    await cb.execute(async () => {
      throw new Error("still failing");
    }).catch(() => {});

    assertEquals(cb.getState(), CircuitState.OPEN);
  });

  await t.step("resets failure count on success", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 3,
      recoveryTimeMs: 100,
      halfOpenMaxAttempts: 1,
    });

    // 2 failures
    for (let i = 0; i < 2; i++) {
      await cb.execute(async () => {
        throw new Error("fail");
      }).catch(() => {});
    }

    // 1 success resets count
    await cb.execute(async () => "ok");
    assertEquals(cb.getFailureCount(), 0);

    // 2 more failures — still under threshold
    for (let i = 0; i < 2; i++) {
      await cb.execute(async () => {
        throw new Error("fail");
      }).catch(() => {});
    }

    assertEquals(cb.getState(), CircuitState.CLOSED);
  });

  await t.step("reset() returns to closed state", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 1,
      recoveryTimeMs: 100,
      halfOpenMaxAttempts: 1,
    });

    await cb.execute(async () => {
      throw new Error("fail");
    }).catch(() => {});

    assertEquals(cb.getState(), CircuitState.OPEN);
    cb.reset();
    assertEquals(cb.getState(), CircuitState.CLOSED);
    assertEquals(cb.getFailureCount(), 0);
  });

  await t.step("CircuitOpenError has correct properties", () => {
    const error = new CircuitOpenError("github", "github-api", Date.now());
    assertInstanceOf(error, CircuitOpenError);
    assertEquals(error.code, "EXTERNAL_SERVICE");
    assertEquals(error.module, "github");
    assertEquals(error.retryable, false);
    assertEquals(error.name, "CircuitOpenError");
  });
});
