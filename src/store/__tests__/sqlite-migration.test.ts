/**
 * Integration test for JSONL → SQLite migration.
 */

import { assertEquals } from "@std/assert";
import { SQLitePersistenceBackend } from "../sqlite-backend.ts";
import { FilePersistenceBackend } from "../persistence.ts";
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
// Migration Integration Test
// ============================================================================

Deno.test("Migration - JSONL to SQLite", () => {
  const tempDir = `/tmp/test-migration-${Date.now()}`;
  const dbPath = `:memory:`;

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

  // Create SQLite backend and migrate
  const sqliteBackend = new SQLitePersistenceBackend({ dbPath });

  // Migrate events from file to SQLite
  for (const line of fileLines) {
    sqliteBackend.write(sessionId, line);
  }

  // Verify migration
  const sqliteLines = sqliteBackend.readLines(sessionId);
  assertEquals(sqliteLines.length, 3);

  // Verify events are in correct order
  const events = sqliteLines.map((line) => JSON.parse(line));
  assertEquals(events[0].sequence_number, 1);
  assertEquals(events[1].sequence_number, 2);
  assertEquals(events[2].sequence_number, 3);

  // Cleanup
  sqliteBackend.close();
  Deno.removeSync(tempDir, { recursive: true });
});

Deno.test("Migration - idempotent migration", () => {
  const dbPath = `:memory:`;
  const backend = new SQLitePersistenceBackend({ dbPath });

  const sessionId = "session-1";
  const event = createTestEvent(sessionId, 1, EventTypes.SESSION_CREATED, {});

  // Migrate same event twice
  backend.write(sessionId, JSON.stringify(event));
  backend.write(sessionId, JSON.stringify(event));

  // INSERT OR REPLACE deduplicates on event_id — idempotent behavior
  const lines = backend.readLines(sessionId);
  assertEquals(lines.length, 1);

  backend.close();
});

Deno.test("Migration - verification step", () => {
  const dbPath = `:memory:`;
  const backend = new SQLitePersistenceBackend({ dbPath });

  // Insert some events
  backend.write("session-1", JSON.stringify(createTestEvent("session-1", 1, EventTypes.SESSION_CREATED, {})));
  backend.write("session-1", JSON.stringify(createTestEvent("session-1", 2, EventTypes.TOOL_EXECUTION_COMPLETED, { tool_name: "shell" })));

  // Verify
  const lines = backend.readLines("session-1");
  assertEquals(lines.length, 2);

  const events = lines.map((line) => JSON.parse(line));
  assertEquals(events[0].event_type, EventTypes.SESSION_CREATED);
  assertEquals(events[1].event_type, EventTypes.TOOL_EXECUTION_COMPLETED);

  backend.close();
});
