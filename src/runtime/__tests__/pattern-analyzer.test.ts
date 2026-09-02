import {
  assertEquals,
  assertExists,
} from "@std/assert";
import { PatternAnalyzer } from "../pattern-analyzer.ts";
import { EventQueryEngine } from "../../store/query-engine.ts";
import { EventStore } from "../../store/event-store.ts";
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

Deno.test("PatternAnalyzer", async (t) => {
  await t.step("analyzeToolTrends detects stable trend", () => {
    const store = new EventStore();
    const queryEngine = new EventQueryEngine(store);
    const analyzer = new PatternAnalyzer(queryEngine);

    // Add consistent tool events (all successful)
    for (let i = 0; i < 5; i++) {
      store.store(createTestEvent("s1", i * 2 + 1, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "bash" }));
      store.store(createTestEvent("s1", i * 2 + 2, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "bash" }));
    }

    const trends = analyzer.analyzeToolTrends();
    assertEquals(trends.length, 1);
    assertEquals(trends[0].toolName, "bash");
    assertEquals(trends[0].direction, "stable");
    assertEquals(trends[0].currentSuccessRate, 1);
  });

  await t.step("analyzeToolTrends detects degrading trend", () => {
    const store = new EventStore();
    const queryEngine = new EventQueryEngine(store);
    const analyzer = new PatternAnalyzer(queryEngine);

    // Add tool events with low success rate
    for (let i = 0; i < 5; i++) {
      store.store(createTestEvent("s1", i * 2 + 1, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "bash" }));
      if (i < 1) {
        store.store(createTestEvent("s1", i * 2 + 2, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "bash" }));
      } else {
        store.store(createTestEvent("s1", i * 2 + 2, EventTypes.TOOL_EXECUTION_FAILED, { tool_name: "bash", error: "timeout" }));
      }
    }

    const trends = analyzer.analyzeToolTrends();
    assertEquals(trends.length, 1);
    assertEquals(trends[0].direction, "degrading");
  });

  await t.step("analyzeSessionEfficiency calculates scores", () => {
    const store = new EventStore();
    const queryEngine = new EventQueryEngine(store);
    const analyzer = new PatternAnalyzer(queryEngine);

    // Session with good efficiency: 2 tool completions, 1 model call
    store.store(createTestEvent("s1", 1, EventTypes.MODEL_REQUEST));
    store.store(createTestEvent("s1", 2, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "bash" }));
    store.store(createTestEvent("s1", 3, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "read" }));

    const efficiency = analyzer.analyzeSessionEfficiency(["s1"]);
    assertEquals(efficiency.length, 1);
    assertEquals(efficiency[0].sessionId, "s1");
    assertEquals(efficiency[0].toolCompletions, 2);
    assertEquals(efficiency[0].modelInvocations, 1);
    // Score = 2 / (2 + 1) = 0.666...
    assertEquals(efficiency[0].score > 0.6, true);
  });

  await t.step("analyzeModelUsage tracks invocations", () => {
    const store = new EventStore();
    const queryEngine = new EventQueryEngine(store);
    const analyzer = new PatternAnalyzer(queryEngine);

    // Add sessions with model invocations
    store.store(createTestEvent("s1", 1, EventTypes.MODEL_REQUEST));
    store.store(createTestEvent("s1", 2, EventTypes.MODEL_REQUEST));
    store.store(createTestEvent("s2", 1, EventTypes.MODEL_REQUEST));

    const usage = analyzer.analyzeModelUsage();
    assertExists(usage);
    assertEquals(typeof usage.totalTokens, "number");
    assertEquals(typeof usage.averagePerResponse, "number");
  });

  await t.step("clusterErrors groups errors by tool", () => {
    const store = new EventStore();
    const queryEngine = new EventQueryEngine(store);
    const analyzer = new PatternAnalyzer(queryEngine);

    // Add error events
    for (let i = 0; i < 3; i++) {
      store.store(createTestEvent("s1", i + 1, EventTypes.TOOL_EXECUTION_FAILED, {
        tool_name: "bash",
        error: "timeout",
      }));
    }
    store.store(createTestEvent("s1", 4, EventTypes.TOOL_EXECUTION_FAILED, {
      tool_name: "read",
      error: "not found",
    }));

    const clusters = analyzer.clusterErrors();
    assertEquals(clusters.length, 2);
    assertEquals(clusters[0].count, 3);
    assertEquals(clusters[1].count, 1);
  });

  await t.step("generateReport produces complete report", () => {
    const store = new EventStore();
    const queryEngine = new EventQueryEngine(store);
    const analyzer = new PatternAnalyzer(queryEngine);

    // Add some events
    store.store(createTestEvent("s1", 1, EventTypes.SESSION_CREATED));
    store.store(createTestEvent("s1", 2, EventTypes.MODEL_REQUEST));
    store.store(createTestEvent("s1", 3, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "bash" }));

    const report = analyzer.generateReport();
    assertExists(report);
    assertExists(report.toolTrends);
    assertExists(report.sessionEfficiency);
    assertExists(report.modelUsage);
    assertExists(report.errorClusters);
    assertExists(report.generatedAt);
  });
});
