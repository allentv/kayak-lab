/**
 * Performance benchmark tests for DuckDB backend.
 */

import { assertEquals } from "@std/assert";
import { DuckDBPersistenceBackend } from "../duckdb-backend.ts";
import { EventTypes } from "../../types/events.ts";

// ============================================================================
// Test Helpers
// ============================================================================

function createTestEvent(sessionId: string, sequenceNumber: number) {
  return {
    event_id: `event-${sequenceNumber}`,
    session_id: sessionId,
    sequence_number: sequenceNumber,
    timestamp: new Date().toISOString(),
    event_type: EventTypes.TOOL_EXECUTION_COMPLETED,
    schema_version: 1,
    payload: { tool_name: "shell", duration_ms: Math.random() * 1000 },
    metadata: { source: "benchmark" },
  };
}

// ============================================================================
// Performance Benchmarks
// ============================================================================

Deno.test("Performance - bulk insert rate (target: 20k+ events/sec)", async () => {
  const dbPath = `/tmp/test-duckdb-perf-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  const eventCount = 1000;
  const startTime = performance.now();

  for (let i = 0; i < eventCount; i++) {
    backend.write("session-bench", JSON.stringify(createTestEvent("session-bench", i)));
  }

  const endTime = performance.now();
  const durationMs = endTime - startTime;
  const eventsPerSecond = (eventCount / durationMs) * 1000;

  console.log(`Inserted ${eventCount} events in ${durationMs.toFixed(2)}ms`);
  console.log(`Rate: ${eventsPerSecond.toFixed(0)} events/sec`);

  // Verify insert rate
  assertEquals(eventsPerSecond >= 20000, true, `Insert rate ${eventsPerSecond.toFixed(0)} events/sec below target of 20k`);

  backend.close();
  Deno.removeSync(dbPath, { recursive: true });
});

Deno.test("Performance - aggregation query latency (target: <100ms)", async () => {
  const dbPath = `/tmp/test-duckdb-perf-agg-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  // Insert test data
  const eventCount = 1000;
  for (let i = 0; i < eventCount; i++) {
    backend.write("session-perf", JSON.stringify(createTestEvent("session-perf", i)));
  }

  const startTime = performance.now();

  // Run aggregation query
  const conn = (backend as unknown as { conn: { all: (sql: string) => unknown[] } }).conn;
  const _rows = conn.all(`SELECT COUNT(*) as cnt FROM events`);
  void _rows;

  const endTime = performance.now();
  const durationMs = endTime - startTime;

  console.log(`Aggregation query took ${durationMs.toFixed(2)}ms`);

  // Verify query latency
  assertEquals(durationMs < 100, true, `Query latency ${durationMs.toFixed(2)}ms exceeds target of 100ms`);

  backend.close();
  Deno.removeSync(dbPath, { recursive: true });
});