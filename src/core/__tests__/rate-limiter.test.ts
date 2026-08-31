/**
 * Tests for token bucket rate limiter and bounded queue.
 */

import { assertEquals, assertRejects } from "@std/assert";
import { TokenBucket, RateLimiter } from "../rate-limiter.ts";
import { BoundedQueue } from "../bounded-queue.ts";

Deno.test("TokenBucket", async (t) => {
  await t.step("creates with correct capacity", () => {
    const bucket = new TokenBucket({
      capacity: 10,
      refillRate: 1,
      refillIntervalMs: 100,
    });

    assertEquals(bucket.capacity, 10);
    assertEquals(bucket.getAvailableTokens(), 10);
  });

  await t.step("tryConsume consumes tokens", () => {
    const bucket = new TokenBucket({
      capacity: 5,
      refillRate: 1,
      refillIntervalMs: 100,
    });

    assertEquals(bucket.tryConsume(3), true);
    assertEquals(bucket.getAvailableTokens(), 2);
  });

  await t.step("tryConsume rejects when insufficient", () => {
    const bucket = new TokenBucket({
      capacity: 3,
      refillRate: 1,
      refillIntervalMs: 100,
    });

    assertEquals(bucket.tryConsume(5), false);
    assertEquals(bucket.getAvailableTokens(), 3);
  });

  await t.step("tryConsume rejects at exact limit", () => {
    const bucket = new TokenBucket({
      capacity: 5,
      refillRate: 1,
      refillIntervalMs: 100,
    });

    assertEquals(bucket.tryConsume(5), true);
    assertEquals(bucket.tryConsume(1), false);
  });

  await t.step("refills tokens over time", async () => {
    const bucket = new TokenBucket({
      capacity: 10,
      refillRate: 5,
      refillIntervalMs: 50,
    });

    bucket.tryConsume(10);
    assertEquals(bucket.getAvailableTokens(), 0);

    // Wait for refill
    await new Promise((r) => setTimeout(r, 60));

    const tokens = bucket.getAvailableTokens();
    assertEquals(tokens >= 5, true);
  });

  await t.step("does not refill above capacity", async () => {
    const bucket = new TokenBucket({
      capacity: 5,
      refillRate: 10,
      refillIntervalMs: 50,
    });

    // Wait for refill
    await new Promise((r) => setTimeout(r, 60));

    assertEquals(bucket.getAvailableTokens(), 5);
  });

  await t.step("startRefill and stopRefill", async () => {
    const bucket = new TokenBucket({
      capacity: 10,
      refillRate: 5,
      refillIntervalMs: 50,
    });

    bucket.tryConsume(10);
    bucket.startRefill();

    await new Promise((r) => setTimeout(r, 60));
    assertEquals(bucket.getAvailableTokens() >= 5, true);

    bucket.stopRefill();
  });

  await t.step("waitAndConsume waits for tokens", async () => {
    const bucket = new TokenBucket({
      capacity: 2,
      refillRate: 1,
      refillIntervalMs: 50,
    });

    bucket.tryConsume(2);

    const start = Date.now();
    await bucket.waitAndConsume(1);
    const elapsed = Date.now() - start;

    assertEquals(bucket.getAvailableTokens(), 0);
    assertEquals(elapsed >= 40, true);
  });
});

Deno.test("RateLimiter", async (t) => {
  await t.step("wrap enforces rate limit", async () => {
    const bucket = new TokenBucket({
      capacity: 2,
      refillRate: 1,
      refillIntervalMs: 100,
    });
    const limiter = new RateLimiter(bucket);

    const fn = async () => "ok";
    const limited = limiter.wrap(fn);

    assertEquals(await limited(), "ok");
    assertEquals(await limited(), "ok");

    await assertRejects(
      () => limited(),
      Error,
      "Rate limit exceeded",
    );
  });

  await t.step("wrapWithWait blocks until tokens available", async () => {
    const bucket = new TokenBucket({
      capacity: 1,
      refillRate: 1,
      refillIntervalMs: 50,
    });
    const limiter = new RateLimiter(bucket);

    const fn = async () => "ok";
    const limited = limiter.wrapWithWait(fn);

    assertEquals(await limited(), "ok");

    const start = Date.now();
    assertEquals(await limited(), "ok");
    const elapsed = Date.now() - start;

    assertEquals(elapsed >= 40, true);
  });
});

Deno.test("BoundedQueue", async (t) => {
  await t.step("push adds items within capacity", () => {
    const queue = new BoundedQueue<number>({
      maxSize: 3,
      policy: "reject",
    });

    queue.push(1);
    queue.push(2);
    queue.push(3);

    assertEquals(queue.size, 3);
    assertEquals(queue.isFull, true);
  });

  await t.step("shift removes oldest item", () => {
    const queue = new BoundedQueue<number>({
      maxSize: 3,
      policy: "reject",
    });

    queue.push(1);
    queue.push(2);
    queue.push(3);

    assertEquals(queue.shift(), 1);
    assertEquals(queue.shift(), 2);
    assertEquals(queue.shift(), 3);
    assertEquals(queue.shift(), undefined);
  });

  await t.step("reject policy throws when full", () => {
    const queue = new BoundedQueue<number>({
      maxSize: 2,
      policy: "reject",
    });

    queue.push(1);
    queue.push(2);

    let threw = false;
    try {
      queue.push(3);
    } catch (e) {
      threw = e instanceof Error && e.message === "Queue is full";
    }
    assertEquals(threw, true);
  });

  await t.step("drop-oldest policy removes oldest", () => {
    const queue = new BoundedQueue<number>({
      maxSize: 2,
      policy: "drop-oldest",
    });

    queue.push(1);
    queue.push(2);
    queue.push(3); // Drops 1

    assertEquals(queue.size, 2);
    assertEquals(queue.shift(), 2);
    assertEquals(queue.shift(), 3);
  });

  await t.step("drop-newest policy discards new item", () => {
    const queue = new BoundedQueue<number>({
      maxSize: 2,
      policy: "drop-newest",
    });

    queue.push(1);
    queue.push(2);
    queue.push(3); // Discarded

    assertEquals(queue.size, 2);
    assertEquals(queue.shift(), 1);
    assertEquals(queue.shift(), 2);
  });

  await t.step("remaining returns available capacity", () => {
    const queue = new BoundedQueue<number>({
      maxSize: 5,
      policy: "reject",
    });

    assertEquals(queue.remaining, 5);
    queue.push(1);
    assertEquals(queue.remaining, 4);
  });

  await t.step("clear empties the queue", () => {
    const queue = new BoundedQueue<number>({
      maxSize: 3,
      policy: "reject",
    });

    queue.push(1);
    queue.push(2);
    queue.clear();

    assertEquals(queue.size, 0);
    assertEquals(queue.toArray().length, 0);
  });

  await t.step("peek returns oldest without removing", () => {
    const queue = new BoundedQueue<number>({
      maxSize: 3,
      policy: "reject",
    });

    queue.push(1);
    queue.push(2);

    assertEquals(queue.peek(), 1);
    assertEquals(queue.size, 2);
  });

  await t.step("block policy waits for space", async () => {
    const queue = new BoundedQueue<number>({
      maxSize: 1,
      policy: "block",
    });

    queue.push(1);

    let resolved = false;
    const waitPromise = queue.waitAndPush(2).then(() => {
      resolved = true;
    });

    // Should not resolve yet
    await new Promise((r) => setTimeout(r, 10));
    assertEquals(resolved, false);

    // Make space
    queue.shift();

    // Now it should resolve
    await waitPromise;
    assertEquals(resolved, true);
    assertEquals(queue.size, 1);
  });
});
