import {
  assertEquals,
  assertExists,
} from "@std/assert";
import { SelfObservation } from "../self-observation.ts";
import { EventQueryEngine } from "../../store/query-engine.ts";
import { EventStore } from "../../store/event-store.ts";
import { EventStream } from "../../core/event-stream.ts";
import { BaseEvent, EventTypes } from "../../types/events.ts";

function createTestEvent(
  sessionId: string,
  sequenceNumber: number,
  eventType: (typeof EventTypes)[keyof typeof EventTypes] = EventTypes.SESSION_CREATED,
  payload: Record<string, unknown> = {},
): BaseEvent {
  return {
    event_id: crypto.randomUUID(),
    session_id: sessionId,
    sequence_number: sequenceNumber,
    timestamp: new Date().toISOString(),
    event_type: eventType,
    schema_version: 1,
    payload,
    metadata: { source: "test" },
  };
}

Deno.test("SelfObservation", async (t) => {
  await t.step("preTurn returns observation context", async () => {
    const store = new EventStore();
    const queryEngine = new EventQueryEngine(store);
    const eventStream = new EventStream();
    const obs = new SelfObservation(queryEngine, eventStream);

    // Add some tool events
    store.store(createTestEvent("s1", 1, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "bash" }));
    store.store(createTestEvent("s1", 2, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "bash", duration_ms: 100 }));

    const context = await obs.preTurn("s1");
    assertExists(context);
    assertEquals(context.toolPerformance.length, 1);
    assertEquals(context.toolPerformance[0].toolName, "bash");
    assertExists(context.observedAt);
  });

  await t.step("postTurn records observation event", async () => {
    const store = new EventStore();
    const queryEngine = new EventQueryEngine(store);
    const eventStream = new EventStream();
    const obs = new SelfObservation(queryEngine, eventStream);

    // Create session in event stream
    eventStream.append({
      session_id: "s1",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: { initial_state: "active" },
      metadata: { source: "test" },
    });

    const context = await obs.preTurn("s1");
    await obs.postTurn("s1", context);

    const events = eventStream.getEvents("s1");
    const selfObserved = events.filter((e) => e.event_type === "agent.self_observed");
    assertEquals(selfObserved.length, 1);
    assertEquals(selfObserved[0].payload.observation_type, "post_turn");
  });

  await t.step("detectPatterns identifies repeated failures", async () => {
    const store = new EventStore();
    const queryEngine = new EventQueryEngine(store);
    const eventStream = new EventStream();
    const obs = new SelfObservation(queryEngine, eventStream);

    // Add 3 failed tool executions
    for (let i = 0; i < 3; i++) {
      store.store(createTestEvent("s1", i + 1, EventTypes.TOOL_EXECUTION_FAILED, {
        tool_name: "bash",
        error: "timeout",
      }));
    }

    const patterns = await obs.detectPatterns("s1");
    assertEquals(patterns.length, 1);
    assertEquals(patterns[0].patternId, "repeated_failure_bash");
    assertEquals(patterns[0].confidence, 0.3);
  });

  await t.step("detectPatterns identifies low success rate", async () => {
    const store = new EventStore();
    const queryEngine = new EventQueryEngine(store);
    const eventStream = new EventStream();
    const obs = new SelfObservation(queryEngine, eventStream);

    // Add 5 tool executions: 1 success, 4 failures (with started events)
    for (let i = 0; i < 5; i++) {
      store.store(createTestEvent("s1", i * 2 + 1, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "read" }));
      if (i === 0) {
        store.store(createTestEvent("s1", i * 2 + 2, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "read" }));
      } else {
        store.store(createTestEvent("s1", i * 2 + 2, EventTypes.TOOL_EXECUTION_FAILED, {
          tool_name: "read",
          error: "not found",
        }));
      }
    }

    const patterns = await obs.detectPatterns("s1");
    // Both repeated_failure and low_success_rate are detected
    const lowSuccessRate = patterns.find((p) => p.patternId === "low_success_rate_read");
    assertExists(lowSuccessRate);
    assertEquals(lowSuccessRate.confidence, 0.8);
  });

  await t.step("detectPatterns returns empty for no issues", async () => {
    const store = new EventStore();
    const queryEngine = new EventQueryEngine(store);
    const eventStream = new EventStream();
    const obs = new SelfObservation(queryEngine, eventStream);

    // Add successful tool executions
    for (let i = 0; i < 5; i++) {
      store.store(createTestEvent("s1", i + 1, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "bash" }));
    }

    const patterns = await obs.detectPatterns("s1");
    assertEquals(patterns.length, 0);
  });
});
