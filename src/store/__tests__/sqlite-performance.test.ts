/**
 * Performance benchmark tests for SQLite backend.
 */

import { assertEquals } from "@std/assert";
import { SQLitePersistenceBackend } from "../sqlite-backend.ts";
import { EventTypes } from "../../types/events.ts";

// ============================================================================
// Test Helpers
// ============================================================================

function createTestEvent(sessionId: string, sequenceNumber: number) {
  return {
    event_id: `${sessionId}-event-${sequenceNumber}`,
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

Deno.test("Performance - bulk insert rate (target: 10k+ events/sec)", () => {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });

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

  // SQLite target: 10k+ events/sec (lower than DuckDB's 20k due to WAL overhead)
  assertEquals(eventsPerSecond >= 10000, true, `Insert rate ${eventsPerSecond.toFixed(0)} events/sec below target of 10k`);

  backend.close();
});

Deno.test("Performance - aggregation query latency (target: <100ms)", () => {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });

  // Insert test data
  const eventCount = 1000;
  for (let i = 0; i < eventCount; i++) {
    backend.write("session-perf", JSON.stringify(createTestEvent("session-perf", i)));
  }

  const startTime = performance.now();

  // Run aggregation query
  const db = backend.getDatabase();
  const _row = db.prepare(`SELECT COUNT(*) as cnt FROM events`).get();
  void _row;

  const endTime = performance.now();
  const durationMs = endTime - startTime;

  console.log(`Aggregation query took ${durationMs.toFixed(2)}ms`);

  assertEquals(durationMs < 100, true, `Query latency ${durationMs.toFixed(2)}ms exceeds target of 100ms`);

  backend.close();
});
