/**
 * Tests for DuckDB persistence backend.
 */

import { assertEquals, assertExists } from "@std/assert";
import { DuckDBPersistenceBackend } from "../duckdb-backend.ts";
import { BaseEvent, EventTypes } from "../../types/events.ts";

// ============================================================================
// Test Helpers
// ============================================================================

function createTestEvent(sessionId: string, sequenceNumber: number): BaseEvent {
  return {
    event_id: `event-${sequenceNumber}`,
    session_id: sessionId,
    sequence_number: sequenceNumber,
    timestamp: new Date().toISOString(),
    event_type: EventTypes.SESSION_CREATED,
    schema_version: 1,
    payload: { test: true },
    metadata: { source: "test" },
  };
}

function createTestSnapshot(sessionId: string, sequenceNumber: number) {
  return {
    session_id: sessionId,
    sequence_number: sequenceNumber,
    timestamp: new Date().toISOString(),
    state: { test: true },
  };
}

// ============================================================================
// DuckDB Backend Tests
// ============================================================================

Deno.test("DuckDBPersistenceBackend - write and read events", async () => {
  const dbPath = `/tmp/test-duckdb-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  const sessionId = "session-1";
  const event1 = createTestEvent(sessionId, 1);
  const event2 = createTestEvent(sessionId, 2);

  backend.write(sessionId, JSON.stringify(event1));
  backend.write(sessionId, JSON.stringify(event2));

  const lines = backend.readLines(sessionId);
  assertEquals(lines.length, 2);

  const parsed1 = JSON.parse(lines[0]);
  const parsed2 = JSON.parse(lines[1]);
  assertEquals(parsed1.event_id, "event-1");
  assertEquals(parsed2.event_id, "event-2");

  backend.close();
  Deno.removeSync(dbPath, { recursive: true });
});

Deno.test("DuckDBPersistenceBackend - writeSnapshot and readSnapshot", () => {
  const dbPath = `/tmp/test-duckdb-snapshot-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  const sessionId = "session-1";
  const snapshot = createTestSnapshot(sessionId, 5);

  backend.writeSnapshot(sessionId, snapshot);

  const readSnapshot = backend.readSnapshot(sessionId);
  assertExists(readSnapshot);
  assertEquals(readSnapshot.session_id, sessionId);
  assertEquals(readSnapshot.sequence_number, 5);

  backend.close();
  Deno.removeSync(dbPath, { recursive: true });
});

Deno.test("DuckDBPersistenceBackend - listSessions and exists", () => {
  const dbPath = `/tmp/test-duckdb-sessions-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  const sessionId1 = "session-1";
  const sessionId2 = "session-2";

  backend.write(sessionId1, JSON.stringify(createTestEvent(sessionId1, 1)));
  backend.write(sessionId2, JSON.stringify(createTestEvent(sessionId2, 1)));

  const sessions = backend.listSessions();
  assertEquals(sessions.length, 2);
  assertEquals(sessions.includes(sessionId1), true);
  assertEquals(sessions.includes(sessionId2), true);

  assertEquals(backend.exists(sessionId1), true);
  assertEquals(backend.exists(sessionId2), true);
  assertEquals(backend.exists("nonexistent"), false);

  backend.close();
  Deno.removeSync(dbPath, { recursive: true });
});

Deno.test("DuckDBPersistenceBackend - readLines returns empty for non-existent session", () => {
  const dbPath = `/tmp/test-duckdb-empty-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  const lines = backend.readLines("nonexistent");
  assertEquals(lines.length, 0);

  backend.close();
  Deno.removeSync(dbPath, { recursive: true });
});

Deno.test("DuckDBPersistenceBackend - memory storage CRUD", async () => {
  const dbPath = `/tmp/test-duckdb-memory-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  const memory = {
    id: "memory-1",
    type: "short_term" as const,
    content: "test memory",
    session_id: "session-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "active" as const,
    metadata: {},
    expires_at: new Date().toISOString(),
  };

  await backend.store(memory);

  const retrieved = await backend.retrieve("memory-1");
  assertExists(retrieved);
  assertEquals(retrieved.id, "memory-1");
  assertEquals(retrieved.type, "short_term");

  const deleted = await backend.delete("memory-1");
  assertEquals(deleted, true);

  const notFound = await backend.retrieve("memory-1");
  assertEquals(notFound, null);

  backend.close();
  Deno.removeSync(dbPath, { recursive: true });
});

Deno.test("DuckDBPersistenceBackend - isAvailable", async () => {
  const dbPath = `/tmp/test-duckdb-available-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  assertEquals(await backend.isAvailable(), true);

  backend.close();
  assertEquals(await backend.isAvailable(), false);

  Deno.removeSync(dbPath, { recursive: true });
});

Deno.test("DuckDBPersistenceBackend - close is idempotent", () => {
  const dbPath = `/tmp/test-duckdb-close-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  backend.close();
  backend.close(); // Should not throw

  Deno.removeSync(dbPath, { recursive: true });
});

Deno.test("DuckDBPersistenceBackend - throws after close", () => {
  const dbPath = `/tmp/test-duckdb-throws-${Date.now()}.db`;
  const backend = new DuckDBPersistenceBackend({ dbPath });

  backend.close();

  let threw = false;
  try {
    backend.write("session", "data");
  } catch {
    threw = true;
  }
  assertEquals(threw, true);

  Deno.removeSync(dbPath, { recursive: true });
});