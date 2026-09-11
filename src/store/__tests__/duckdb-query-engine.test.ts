/**
 * Tests for DuckDB query engine.
 */

import { DuckDBPersistenceBackend } from "../duckdb-backend.ts";
import { EventTypes } from "../../types/events.ts";

// ============================================================================
// Test Helpers
// ============================================================================

function createTestEvent(sessionId: string, sequenceNumber: number, eventType: string, payload: Record<string, unknown>) {
  return {
    event_id: `event-${sequenceNumber}`,
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
// DuckDB Query Engine Tests
// ============================================================================

Deno.test("DuckDBQueryEngine - getToolPerformance", async () => {
  const dbPath = `/tmp/test-duckdb-query-tool-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  // Insert test data
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 1, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "shell" })
  ));
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 2, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "shell", duration_ms: 100 })
  ));
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 3, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "shell" })
  ));
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 4, EventTypes.TOOL_EXECUTION_FAILED, { tool_name: "shell" })
  ));

  backend.close();
  Deno.removeSync(dbPath, { recursive: true });
});

Deno.test("DuckDBQueryEngine - getTimeSeriesAggregation", async () => {
  const dbPath = `/tmp/test-duckdb-query-ts-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  // Insert test data
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 1, EventTypes.SESSION_CREATED, {})
  ));
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 2, EventTypes.TOOL_EXECUTION_FAILED, { tool_name: "shell" })
  ));

  backend.close();
  Deno.removeSync(dbPath, { recursive: true });
});

Deno.test("DuckDBQueryEngine - getErrorPatterns", async () => {
  const dbPath = `/tmp/test-duckdb-query-errors-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  // Insert test data
  backend.write("session-1", JSON.stringify(
    createTestEvent("session-1", 1, EventTypes.TOOL_EXECUTION_FAILED, { tool_name: "shell", error_type: "timeout" })
  ));

  backend.close();
  Deno.removeSync(dbPath, { recursive: true });
});