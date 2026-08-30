/**
 * Performance benchmarks for critical paths.
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { EventStream } from "../core/event-stream.ts";
import { SessionManager } from "../core/session-manager.ts";
import { ProjectionProtocol } from "../projection/protocol.ts";
import { EventTypes } from "../types/events.ts";

Deno.test("EventStream - append performance", () => {
  const eventStream = new EventStream();
  const sessionId = "bench-session";
  const iterations = 10000;

  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    eventStream.append({
      session_id: sessionId,
      sequence_number: i + 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: { index: i },
      metadata: { source: "bench" },
    });
  }

  const endTime = performance.now();
  const duration = endTime - startTime;
  const opsPerSecond = (iterations / duration) * 1000;

  console.log(`EventStream append: ${iterations} ops in ${duration.toFixed(2)}ms`);
  console.log(`  ${opsPerSecond.toFixed(0)} ops/second`);
  console.log(`  ${(duration / iterations).toFixed(4)} ms/op`);

  // Performance baseline: should be able to append at least 1000 ops/sec
  assertEquals(opsPerSecond > 1000, true, "EventStream append too slow");
});

Deno.test("EventStream - read performance", () => {
  const eventStream = new EventStream();
  const sessionId = "bench-session";
  const eventCount = 10000;

  // Populate event stream
  for (let i = 0; i < eventCount; i++) {
    eventStream.append({
      session_id: sessionId,
      sequence_number: i + 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: { index: i },
      metadata: { source: "bench" },
    });
  }

  const iterations = 1000;
  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    eventStream.getEvents(sessionId);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;
  const opsPerSecond = (iterations / duration) * 1000;

  console.log(`EventStream read: ${iterations} ops in ${duration.toFixed(2)}ms`);
  console.log(`  ${opsPerSecond.toFixed(0)} ops/second`);
  console.log(`  ${(duration / iterations).toFixed(4)} ms/op`);

  // Performance baseline: should be able to read at least 1000 ops/sec
  assertEquals(opsPerSecond > 1000, true, "EventStream read too slow");
});

Deno.test("ProjectionProtocol - subscription performance", async () => {
  const eventStream = new EventStream();
  const protocol = new ProjectionProtocol(eventStream);
  const sessionId = "bench-session";
  const subscriptionCount = 100;

  const startTime = performance.now();

  const subscriptions = [];
  for (let i = 0; i < subscriptionCount; i++) {
    const sub = protocol.subscribe(sessionId, () => {
      // No-op callback
    });
    subscriptions.push(sub);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;
  const opsPerSecond = (subscriptionCount / duration) * 1000;

  console.log(`ProjectionProtocol subscribe: ${subscriptionCount} ops in ${duration.toFixed(2)}ms`);
  console.log(`  ${opsPerSecond.toFixed(0)} ops/second`);
  console.log(`  ${(duration / subscriptionCount).toFixed(4)} ms/op`);

  // Performance baseline: should be able to subscribe at least 100 ops/sec
  assertEquals(opsPerSecond > 100, true, "ProjectionProtocol subscribe too slow");

  // Cleanup
  for (const sub of subscriptions) {
    protocol.unsubscribe(sub.id);
  }
});

Deno.test("ProjectionProtocol - event delivery performance", async () => {
  const eventStream = new EventStream();
  const protocol = new ProjectionProtocol(eventStream);
  const sessionId = "bench-session";
  const eventCount = 1000;

  let deliveryCount = 0;
  const subscription = protocol.subscribe(sessionId, () => {
    deliveryCount++;
  });

  const startTime = performance.now();

  // Add events
  for (let i = 0; i < eventCount; i++) {
    eventStream.append({
      session_id: sessionId,
      sequence_number: i + 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: { index: i },
      metadata: { source: "bench" },
    });
  }

  // Wait for delivery
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`ProjectionProtocol delivery: ${deliveryCount} events in ${duration.toFixed(2)}ms`);
  console.log(`  ${(duration / deliveryCount).toFixed(4)} ms/event`);

  // Verify events were delivered
  assertEquals(deliveryCount > 0, true, "No events delivered");

  // Cleanup
  protocol.unsubscribe(subscription.id);
});

Deno.test("SessionManager - session lifecycle performance", async () => {
  const eventStream = new EventStream();
  const sessionManager = new SessionManager(eventStream);
  const iterations = 1000;

  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    const session = await sessionManager.createSession({
      agent_id: "bench-agent",
      user_id: "bench-user",
    });

    await sessionManager.completeSession(session.id);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;
  const opsPerSecond = (iterations / duration) * 1000;

  console.log(`SessionManager lifecycle: ${iterations} ops in ${duration.toFixed(2)}ms`);
  console.log(`  ${opsPerSecond.toFixed(0)} ops/second`);
  console.log(`  ${(duration / iterations).toFixed(4)} ms/op`);

  // Performance baseline: should be able to complete at least 100 ops/sec
  assertEquals(opsPerSecond > 100, true, "SessionManager lifecycle too slow");
});

Deno.test("Memory usage - event stream", () => {
  const eventStream = new EventStream();
  const sessionId = "bench-session";
  const eventCount = 10000;

  const initialMemory = performance.memory?.usedJSHeapSize ?? 0;

  for (let i = 0; i < eventCount; i++) {
    eventStream.append({
      session_id: sessionId,
      sequence_number: i + 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: { index: i, data: "x".repeat(100) },
      metadata: { source: "bench" },
    });
  }

  const finalMemory = performance.memory?.usedJSHeapSize ?? 0;
  const memoryIncrease = finalMemory - initialMemory;
  const bytesPerEvent = memoryIncrease / eventCount;

  console.log(`Memory usage: ${eventCount} events`);
  console.log(`  Total increase: ${(memoryIncrease / 1024).toFixed(2)} KB`);
  console.log(`  Per event: ${bytesPerEvent.toFixed(2)} bytes`);

  // Memory baseline: should use less than 1KB per event
  // Note: This test only runs in environments that support performance.memory
  if (performance.memory) {
    assertEquals(bytesPerEvent < 1024, true, "Memory usage too high per event");
  }
});
