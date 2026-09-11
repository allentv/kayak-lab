/**
 * Integration test for JSONL → DuckDB migration.
 */

import { assertEquals } from "@std/assert";
import { DuckDBPersistenceBackend } from "../duckdb-backend.ts";
import { FilePersistenceBackend } from "../persistence.ts";
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
// Migration Integration Test
// ============================================================================

Deno.test("Migration - JSONL to DuckDB", async () => {
  const tempDir = `/tmp/test-migration-${Date.now()}`;
  const dbPath = `/tmp/test-migration-${Date.now()}.db`;

  // Create a file-based backend with test data
  const fileBackend = new FilePersistenceBackend(tempDir);
  const sessionId = "session-1";

  // Write test events to JSONL
  fileBackend.write(sessionId, JSON.stringify(createTestEvent(sessionId, 1, EventTypes.SESSION_CREATED, {})));
  fileBackend.write(sessionId, JSON.stringify(createTestEvent(sessionId, 2, EventTypes.TOOL_EXECUTION_STARTED, { tool_name: "shell" })));
  fileBackend.write(sessionId, JSON.stringify(createTestEvent(sessionId, 3, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "shell", duration_ms: 100 })));

  // Read from file backend
  const fileLines = fileBackend.readLines(sessionId);
  assertEquals(fileLines.length, 3);

  // Create DuckDB backend and migrate
  const duckdbBackend = new DuckDBPersistenceBackend({ dbPath });

  // Migrate events from file to DuckDB
  for (const line of fileLines) {
    duckdbBackend.write(sessionId, line);
  }

  // Verify migration
  const duckdbLines = duckdbBackend.readLines(sessionId);
  assertEquals(duckdbLines.length, 3);

  // Verify events are in correct order
  const events = duckdbLines.map((line) => JSON.parse(line));
  assertEquals(events[0].sequence_number, 1);
  assertEquals(events[1].sequence_number, 2);
  assertEquals(events[2].sequence_number, 3);

  // Cleanup
  duckdbBackend.close();
  Deno.removeSync(tempDir, { recursive: true });
  Deno.removeSync(dbPath, { recursive: true });
});

Deno.test("Migration - idempotent migration", async () => {
  const dbPath = `/tmp/test-migration-idempotent-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  const sessionId = "session-1";
  const event = createTestEvent(sessionId, 1, EventTypes.SESSION_CREATED, {});

  // Write same event twice
  backend.write(sessionId, JSON.stringify(event));
  backend.write(sessionId, JSON.stringify(event));

  // Verify only one event exists
  const lines = backend.readLines(sessionId);
  assertEquals(lines.length, 1);

  backend.close();
  Deno.removeSync(dbPath, { recursive: true });
});

Deno.test("Migration - verification step", async () => {
  const dbPath = `/tmp/test-migration-verify-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  // Insert some events
  backend.write("session-1", JSON.stringify(createTestEvent("session-1", 1, EventTypes.SESSION_CREATED, {})));
  backend.write("session-2", JSON.stringify(createTestEvent("session-2", 1, EventTypes.SESSION_CREATED, {})));

  // Verify session list
  const sessions = backend.listSessions();
  assertEquals(sessions.length, 2);
  assertEquals(sessions.includes("session-1"), true);
  assertEquals(sessions.includes("session-2"), true);

  // Verify event counts
  const lines1 = backend.readLines("session-1");
  const lines2 = backend.readLines("session-2");
  assertEquals(lines1.length, 1);
  assertEquals(lines2.length, 1);

  backend.close();
  Deno.removeSync(dbPath, { recursive: true });
});