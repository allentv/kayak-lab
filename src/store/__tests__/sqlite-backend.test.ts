/**
 * Tests for SQLite persistence backend.
 */

import { assertEquals, assertExists } from "@std/assert";
import { SQLitePersistenceBackend } from "../sqlite-backend.ts";
import { BaseEvent, EventTypes } from "../../types/events.ts";

// ============================================================================
// Test Helpers
// ============================================================================

function createTestEvent(sessionId: string, sequenceNumber: number): BaseEvent {
  return {
    event_id: `${sessionId}-event-${sequenceNumber}`,
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
// SQLite Backend Tests
// ============================================================================

Deno.test("SQLitePersistenceBackend - write and read events", () => {
  const dbPath = `:memory:`;
  const backend = new SQLitePersistenceBackend({ dbPath });

  const sessionId = "session-1";
  const event1 = createTestEvent(sessionId, 1);
  const event2 = createTestEvent(sessionId, 2);

  backend.write(sessionId, JSON.stringify(event1));
  backend.write(sessionId, JSON.stringify(event2));

  const lines = backend.readLines(sessionId);
  assertEquals(lines.length, 2);

  const parsed1 = JSON.parse(lines[0]);
  const parsed2 = JSON.parse(lines[1]);
  assertEquals(parsed1.event_id, "session-1-event-1");
  assertEquals(parsed2.event_id, "session-1-event-2");

  backend.close();
});

Deno.test("SQLitePersistenceBackend - writeSnapshot and readSnapshot", () => {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });

  const sessionId = "session-1";
  const snapshot = createTestSnapshot(sessionId, 5);

  backend.writeSnapshot(sessionId, snapshot);

  const readSnapshot = backend.readSnapshot(sessionId);
  assertExists(readSnapshot);
  assertEquals(readSnapshot.session_id, sessionId);
  assertEquals(readSnapshot.sequence_number, 5);

  backend.close();
});

Deno.test("SQLitePersistenceBackend - listSessions and exists", () => {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });

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
});

Deno.test("SQLitePersistenceBackend - readLines returns empty for non-existent session", () => {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });

  const lines = backend.readLines("nonexistent");
  assertEquals(lines.length, 0);

  backend.close();
});

Deno.test("SQLitePersistenceBackend - memory storage CRUD", async () => {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });

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
});

Deno.test("SQLitePersistenceBackend - isAvailable", async () => {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });

  assertEquals(await backend.isAvailable(), true);

  backend.close();
  assertEquals(await backend.isAvailable(), false);
});

Deno.test("SQLitePersistenceBackend - close is idempotent", () => {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });

  backend.close();
  backend.close(); // Should not throw
});

Deno.test("SQLitePersistenceBackend - throws after close", () => {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });

  backend.close();

  let threw = false;
  try {
    backend.write("session", "data");
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});
