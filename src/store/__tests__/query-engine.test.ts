import {
  assertEquals,
  assertExists,
} from "@std/assert";
import { EventQueryEngine } from "../query-engine.ts";
import { EventStore } from "../event-store.ts";
import { BaseEvent, EventTypes } from "../../types/events.ts";

function createTestEvent(
  sessionId: string,
  sequenceNumber: number,
  eventType: (typeof EventTypes)[keyof typeof EventTypes] = EventTypes.SESSION_CREATED,
  payload: Record<string, unknown> = {},
  timestamp?: string,
): BaseEvent {
  return {
    event_id: crypto.randomUUID(),
    session_id: sessionId,
    sequence_number: sequenceNumber,
    timestamp: timestamp ?? new Date().toISOString(),
    event_type: eventType,
    schema_version: 1,
    payload,
    metadata: { source: "test" },
  };
}

Deno.test("EventQueryEngine", async (t) => {
  await t.step("tool performance metrics", () => {
    const store = new EventStore();
    const engine = new EventQueryEngine(store);

    // Store tool events
    store.store(createTestEvent("s1", 1, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "bash", parameters: {} }));
    store.store(createTestEvent("s1", 2, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "bash", duration_ms: 100 }));
    store.store(createTestEvent("s1", 3, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "bash", parameters: {} }));
    store.store(createTestEvent("s1", 4, EventTypes.TOOL_EXECUTION_FAILED, { tool_name: "bash", error: "timeout", duration_ms: 5000 }));
    store.store(createTestEvent("s1", 5, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "read", parameters: {} }));
    store.store(createTestEvent("s1", 6, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "read", duration_ms: 50 }));

    const metrics = engine.getToolPerformance();
    assertEquals(metrics.length, 2);

    const bashMetrics = metrics.find((m) => m.toolName === "bash");
    assertExists(bashMetrics);
    assertEquals(bashMetrics.totalInvocations, 2);
    assertEquals(bashMetrics.successCount, 1);
    assertEquals(bashMetrics.failureCount, 1);
    assertEquals(bashMetrics.successRate, 0.5);
    assertEquals(bashMetrics.averageDurationMs, 2550);

    const readMetrics = metrics.find((m) => m.toolName === "read");
    assertExists(readMetrics);
    assertEquals(readMetrics.totalInvocations, 1);
    assertEquals(readMetrics.successCount, 1);
    assertEquals(readMetrics.failureCount, 0);
    assertEquals(readMetrics.successRate, 1);
  });

  await t.step("tool performance with filter", () => {
    const store = new EventStore();
    const engine = new EventQueryEngine(store);

    store.store(createTestEvent("s1", 1, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "bash" }));
    store.store(createTestEvent("s1", 2, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "bash" }));
    store.store(createTestEvent("s1", 3, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "read" }));
    store.store(createTestEvent("s1", 4, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "read" }));

    const bashOnly = engine.getToolPerformance("bash");
    assertEquals(bashOnly.length, 1);
    assertEquals(bashOnly[0].toolName, "bash");
  });

  await t.step("error patterns", () => {
    const store = new EventStore();
    const engine = new EventQueryEngine(store);

    store.store(createTestEvent("s1", 1, EventTypes.TOOL_EXECUTION_FAILED, { tool_name: "bash", error: "timeout" }));
    store.store(createTestEvent("s1", 2, EventTypes.TOOL_EXECUTION_FAILED, { tool_name: "bash", error: "timeout" }));
    store.store(createTestEvent("s1", 3, EventTypes.TOOL_EXECUTION_FAILED, { tool_name: "read", error: "not found" }));

    const patterns = engine.getErrorPatterns();
    assertEquals(patterns.length, 2);
    assertEquals(patterns[0].count, 2);
    assertEquals(patterns[1].count, 1);
  });

  await t.step("session summary", () => {
    const store = new EventStore();
    const engine = new EventQueryEngine(store);

    store.store(createTestEvent("s1", 1, EventTypes.SESSION_CREATED));
    store.store(createTestEvent("s1", 2, EventTypes.MODEL_REQUEST));
    store.store(createTestEvent("s1", 3, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "bash" }));
    store.store(createTestEvent("s1", 4, EventTypes.SESSION_COMPLETED));

    const summary = engine.getSessionSummary("s1");
    assertExists(summary);
    assertEquals(summary.sessionId, "s1");
    assertEquals(summary.totalEvents, 4);
    assertEquals(summary.toolCallCount, 1);
    assertEquals(summary.modelInvocationCount, 1);
    assertEquals(summary.completionStatus, "completed");
  });

  await t.step("session summary returns undefined for non-existent session", () => {
    const store = new EventStore();
    const engine = new EventQueryEngine(store);

    const summary = engine.getSessionSummary("nonexistent");
    assertEquals(summary, undefined);
  });

  await t.step("recent sessions", () => {
    const store = new EventStore();
    const engine = new EventQueryEngine(store);

    store.store(createTestEvent("s1", 1, EventTypes.SESSION_CREATED, {}, "2026-01-01T00:00:00Z"));
    store.store(createTestEvent("s2", 1, EventTypes.SESSION_CREATED, {}, "2026-01-02T00:00:00Z"));
    store.store(createTestEvent("s3", 1, EventTypes.SESSION_CREATED, {}, "2026-01-03T00:00:00Z"));

    const recent = engine.getRecentSessions(2);
    assertEquals(recent.length, 2);
    assertEquals(recent[0].sessionId, "s3");
    assertEquals(recent[1].sessionId, "s2");
  });

  await t.step("event type distribution", () => {
    const store = new EventStore();
    const engine = new EventQueryEngine(store);

    store.store(createTestEvent("s1", 1, EventTypes.SESSION_CREATED));
    store.store(createTestEvent("s1", 2, EventTypes.TOOL_EXECUTION_STARTED));
    store.store(createTestEvent("s1", 3, EventTypes.TOOL_EXECUTION_COMPLETED));
    store.store(createTestEvent("s1", 4, EventTypes.MODEL_REQUEST));

    const dist = engine.getEventTypeDistribution();
    assertEquals(dist.length, 4);
    assertEquals(dist[0].count, 1);
    assertEquals(dist[0].percentage, 0.25);
  });

  await t.step("aggregate tool usage", () => {
    const store = new EventStore();
    const engine = new EventQueryEngine(store);

    store.store(createTestEvent("s1", 1, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "bash" }));
    store.store(createTestEvent("s1", 2, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "bash" }));
    store.store(createTestEvent("s1", 3, EventTypes.TOOL_EXECUTION_FAILED, { tool_name: "read" }));

    const usage = engine.getAggregateToolUsage();
    assertEquals(usage.totalInvocations, 3);
    assertEquals(usage.uniqueTools, 2);
    assertEquals(usage.toolBreakdown["bash"], 2);
    assertEquals(usage.toolBreakdown["read"], 1);
  });

  await t.step("session duration trends", () => {
    const store = new EventStore();
    const engine = new EventQueryEngine(store);

    store.store(createTestEvent("s1", 1, EventTypes.SESSION_CREATED, {}, "2026-01-01T00:00:00Z"));
    store.store(createTestEvent("s1", 2, EventTypes.SESSION_COMPLETED, {}, "2026-01-01T00:01:00Z"));
    store.store(createTestEvent("s2", 1, EventTypes.SESSION_CREATED, {}, "2026-01-01T00:00:00Z"));
    store.store(createTestEvent("s2", 2, EventTypes.SESSION_COMPLETED, {}, "2026-01-01T00:02:00Z"));

    const trends = engine.getSessionDurationTrends();
    assertEquals(trends.sessionCount, 2);
    assertEquals(trends.minMs, 60000);
    assertEquals(trends.maxMs, 120000);
    assertEquals(trends.averageMs, 90000);
  });

  await t.step("empty store returns zero trends", () => {
    const store = new EventStore();
    const engine = new EventQueryEngine(store);

    const trends = engine.getSessionDurationTrends();
    assertEquals(trends.sessionCount, 0);
    assertEquals(trends.averageMs, 0);
    assertEquals(trends.minMs, 0);
    assertEquals(trends.maxMs, 0);
  });
});
