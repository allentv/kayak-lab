/**
 * Tests for SQLite query engine.
 */

import { SQLitePersistenceBackend } from "../sqlite-backend.ts";
import { SQLiteQueryEngine } from "../sqlite-query-engine.ts";
import { EventTypes } from "../../types/events.ts";

// ============================================================================
// Test Helpers
// ============================================================================

function createTestEvent(sessionId: string, sequenceNumber: number, eventType: string, payload: Record<string, unknown>) {
  return {
    event_id: `${sessionId}-event-${sequenceNumber}`,
    session_id: sessionId,
    sequence_number: sequenceNumber,
    timestamp: new Date().toISOString(),
    event_type: eventType,
    schema_version: 1,
    payload,
    metadata: {},
  };
}

// ============================================================================
// SQLite Query Engine Tests
// ============================================================================

Deno.test("SQLiteQueryEngine - getToolPerformance", () => {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });
  const engine = new SQLiteQueryEngine(backend.getDatabase());

  // Insert test data
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 1, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "shell" }),
  ));
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 2, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "shell", duration_ms: 100 }),
  ));
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 3, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "shell" }),
  ));
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 4, EventTypes.TOOL_EXECUTION_FAILED, { tool_name: "shell" }),
  ));

  const metrics = engine.getToolPerformance("shell");
  console.log("tool performance:", metrics);

  backend.close();
});

Deno.test("SQLiteQueryEngine - getTimeSeriesAggregation", () => {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });
  const engine = new SQLiteQueryEngine(backend.getDatabase());

  // Insert test data
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 1, EventTypes.SESSION_CREATED, {}),
  ));
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 2, EventTypes.TOOL_EXECUTION_FAILED, { tool_name: "shell" }),
  ));

  const timeSeries = engine.getTimeSeriesAggregation("hour");
  console.log("time series:", timeSeries);

  backend.close();
});

Deno.test("SQLiteQueryEngine - getErrorPatterns", () => {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });
  const engine = new SQLiteQueryEngine(backend.getDatabase());

  // Insert test data
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 1, EventTypes.TOOL_EXECUTION_FAILED, { tool_name: "shell", error_type: "timeout" }),
  ));

  const patterns = engine.getErrorPatterns("shell");
  console.log("error patterns:", patterns);

  backend.close();
});
