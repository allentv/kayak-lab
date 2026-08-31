import {
  assertEquals,
  assertRejects,
} from "@std/assert";
import { executeWithFallback } from "../fallback.ts";
import { CircuitBreaker, CircuitState } from "../circuit-breaker.ts";
import { TimeoutError } from "../errors.ts";

Deno.test("Graceful Degradation", async (t) => {
  await t.step("returns primary result on success", async () => {
    const result = await executeWithFallback(
      async () => "primary",
      async () => "fallback",
    );
    assertEquals(result.primarySucceeded, true);
    assertEquals(result.value, "primary");
  });

  await t.step("falls back on primary failure", async () => {
    const result = await executeWithFallback(
      async () => {
        throw new TimeoutError("timeout", "test", "op");
      },
      async () => "fallback value",
    );
    assertEquals(result.primarySucceeded, false);
    assertEquals(result.value, "fallback value");
  });

  await t.step("throws if fallback also fails", async () => {
    await assertRejects(
      () =>
        executeWithFallback(
          async () => {
            throw new TimeoutError("timeout", "test", "op");
          },
          async () => {
            throw new Error("fallback also failed");
          },
        ),
      Error,
      "fallback also failed",
    );
  });

  await t.step("skips primary when circuit is open", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 1,
      recoveryTimeMs: 60000,
      halfOpenMaxAttempts: 1,
    });

    // Open the circuit
    await cb.execute(async () => {
      throw new Error("fail");
    }).catch(() => {});

    assertEquals(cb.getState(), CircuitState.OPEN);

    const result = await executeWithFallback(
      async () => "should not run",
      async () => "fallback via circuit",
      cb,
    );

    assertEquals(result.primarySucceeded, false);
    assertEquals(result.value, "fallback via circuit");
  });

  await t.step("uses primary when circuit is closed", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 3,
      recoveryTimeMs: 100,
      halfOpenMaxAttempts: 1,
    });

    const result = await executeWithFallback(
      async () => "primary via circuit",
      async () => "fallback via circuit",
      cb,
    );

    assertEquals(result.primarySucceeded, true);
    assertEquals(result.value, "primary via circuit");
  });

  await t.step("works without circuit breaker", async () => {
    const result = await executeWithFallback(
      async () => "primary",
      async () => "fallback",
    );
    assertEquals(result.primarySucceeded, true);
    assertEquals(result.value, "primary");
  });

  await t.step("fallback runs when primary throws without circuit", async () => {
    let fallbackCalled = false;
    const result = await executeWithFallback(
      async () => {
        throw new Error("boom");
      },
      async () => {
        fallbackCalled = true;
        return "recovered";
      },
    );
    assertEquals(result.primarySucceeded, false);
    assertEquals(result.value, "recovered");
    assertEquals(fallbackCalled, true);
  });
});
