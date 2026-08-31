import {
  assertEquals,
  assertRejects,
} from "@std/assert";
import { withRetry, DEFAULT_RETRY_POLICY } from "../retry.ts";
import { AppError, ErrorCodes, TimeoutError, AuthenticationError } from "../errors.ts";

Deno.test("Retry Policies", async (t) => {
  await t.step("succeeds on first attempt if no error", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      return "ok";
    });
    assertEquals(result, "ok");
    assertEquals(calls, 1);
  });

  await t.step("retries on retryable error and eventually succeeds", async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls < 3) {
          throw new TimeoutError("timeout", "test", "op");
        }
        return "recovered";
      },
      { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 10, jitter: false },
    );
    assertEquals(result, "recovered");
    assertEquals(calls, 3);
  });

  await t.step("stops retrying on non-retryable error", async () => {
    let calls = 0;
    await assertRejects(
      () =>
        withRetry(
          async () => {
            calls++;
            throw new AuthenticationError("unauth", "test", "op");
          },
          { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 10, jitter: false },
        ),
      AuthenticationError,
    );
    assertEquals(calls, 1);
  });

  await t.step("throws after exhausting retries", async () => {
    let calls = 0;
    await assertRejects(
      () =>
        withRetry(
          async () => {
            calls++;
            throw new TimeoutError("timeout", "test", "op");
          },
          { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 10, jitter: false },
        ),
      TimeoutError,
    );
    assertEquals(calls, 3); // 1 initial + 2 retries
  });

  await t.step("uses custom retryableFn", async () => {
    let calls = 0;
    const error = new AppError("custom", ErrorCodes.INTERNAL, "test", "op");
    await assertRejects(
      () =>
        withRetry(
          async () => {
            calls++;
            throw error;
          },
          {
            maxRetries: 3,
            baseDelayMs: 1,
            maxDelayMs: 10,
            jitter: false,
            retryableFn: () => false,
          },
        ),
    );
    assertEquals(calls, 1); // custom function says not retryable
  });

  await t.step("default policy has correct values", () => {
    assertEquals(DEFAULT_RETRY_POLICY.maxRetries, 3);
    assertEquals(DEFAULT_RETRY_POLICY.baseDelayMs, 1000);
    assertEquals(DEFAULT_RETRY_POLICY.maxDelayMs, 10000);
    assertEquals(DEFAULT_RETRY_POLICY.jitter, true);
  });

  await t.step("applies default policy when none specified", async () => {
    let calls = 0;
    // TimeoutError is retryable by default — will retry 3 times
    await assertRejects(
      () =>
        withRetry(
          async () => {
            calls++;
            throw new TimeoutError("timeout", "test", "op");
          },
          { baseDelayMs: 10, maxDelayMs: 20, jitter: false },
        ),
    );
    assertEquals(calls, 4); // 1 initial + 3 retries
  });

  await t.step("respects maxDelayMs cap", async () => {
    let calls = 0;
    const start = Date.now();
    await assertRejects(
      () =>
        withRetry(
          async () => {
            calls++;
            throw new TimeoutError("timeout", "test", "op");
          },
          {
            maxRetries: 4,
            baseDelayMs: 100,
            maxDelayMs: 150,
            jitter: false,
          },
        ),
    );
    const elapsed = Date.now() - start;
    // With cap at 150ms: 100 + 150 + 150 + 150 = max 550ms
    // Without cap: 100 + 200 + 400 + 800 = 1500ms
    assertEquals(elapsed < 1000, true);
  });
});
