/**
 * Tests for persistence layer.
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { FilePersistenceBackend, PersistentEventStore } from "../persistence.ts";
import { BaseEvent, EventTypes } from "../../types/events.ts";
import { Snapshot } from "../event-store.ts";

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

function createTempDir(): string {
  return `/tmp/persistence-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ============================================================================
// FilePersistenceBackend Tests
// ============================================================================

Deno.test("FilePersistenceBackend - write and read lines", () => {
  const dataDir = createTempDir();
  const backend = new FilePersistenceBackend(dataDir);

  const sessionId = "session-1";
  const line1 = JSON.stringify({ test: 1 });
  const line2 = JSON.stringify({ test: 2 });

  backend.write(sessionId, line1);
  backend.write(sessionId, line2);

  const lines = backend.readLines(sessionId);
  assertEquals(lines.length, 2);
  assertEquals(lines[0], line1);
  assertEquals(lines[1], line2);

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

Deno.test("FilePersistenceBackend - readLines returns empty array for missing file", () => {
  const dataDir = createTempDir();
  const backend = new FilePersistenceBackend(dataDir);

  const lines = backend.readLines("nonexistent-session");
  assertEquals(lines.length, 0);

  // Cleanup - directory may not exist if no writes occurred
  try {
    Deno.removeSync(dataDir, { recursive: true });
  } catch {
    // Ignore if directory doesn't exist
  }
});

Deno.test("FilePersistenceBackend - writeSnapshot and readSnapshot", () => {
  const dataDir = createTempDir();
  const backend = new FilePersistenceBackend(dataDir);

  const sessionId = "session-1";
  const snapshot: Snapshot = {
    session_id: sessionId,
    sequence_number: 5,
    timestamp: new Date().toISOString(),
    state: { count: 10 },
  };

  backend.writeSnapshot(sessionId, snapshot);
  const readSnapshot = backend.readSnapshot(sessionId);

  assertExists(readSnapshot);
  assertEquals(readSnapshot.session_id, sessionId);
  assertEquals(readSnapshot.sequence_number, 5);
  assertEquals(readSnapshot.state, { count: 10 });

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

Deno.test("FilePersistenceBackend - readSnapshot returns undefined for missing file", () => {
  const dataDir = createTempDir();
  const backend = new FilePersistenceBackend(dataDir);

  const snapshot = backend.readSnapshot("nonexistent-session");
  assertEquals(snapshot, undefined);

  // Cleanup - directory may not exist if no writes occurred
  try {
    Deno.removeSync(dataDir, { recursive: true });
  } catch {
    // Ignore if directory doesn't exist
  }
});

Deno.test("FilePersistenceBackend - listSessions", () => {
  const dataDir = createTempDir();
  const backend = new FilePersistenceBackend(dataDir);

  // Write events for 3 sessions
  backend.write("session-1", JSON.stringify({ test: 1 }));
  backend.write("session-2", JSON.stringify({ test: 2 }));
  backend.write("session-3", JSON.stringify({ test: 3 }));

  const sessions = backend.listSessions();
  assertEquals(sessions.length, 3);
  assertEquals(sessions.includes("session-1"), true);
  assertEquals(sessions.includes("session-2"), true);
  assertEquals(sessions.includes("session-3"), true);

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

Deno.test("FilePersistenceBackend - exists", () => {
  const dataDir = createTempDir();
  const backend = new FilePersistenceBackend(dataDir);

  assertEquals(backend.exists("session-1"), false);

  backend.write("session-1", JSON.stringify({ test: 1 }));

  assertEquals(backend.exists("session-1"), true);
  assertEquals(backend.exists("session-2"), false);

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

// ============================================================================
// PersistentEventStore Tests
// ============================================================================

Deno.test("PersistentEventStore - store and getEvents", () => {
  const dataDir = createTempDir();
  const store = new PersistentEventStore({ dataDir });

  const sessionId = "session-1";
  const event1 = createTestEvent(sessionId, 1);
  const event2 = createTestEvent(sessionId, 2);

  store.store(event1);
  store.store(event2);

  const events = store.getEvents(sessionId);
  assertEquals(events.length, 2);
  assertEquals(events[0].sequence_number, 1);
  assertEquals(events[1].sequence_number, 2);

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

Deno.test("PersistentEventStore - getEventsInRange", () => {
  const dataDir = createTempDir();
  const store = new PersistentEventStore({ dataDir });

  const sessionId = "session-1";
  for (let i = 1; i <= 10; i++) {
    store.store(createTestEvent(sessionId, i));
  }

  const events = store.getEventsInRange(sessionId, 3, 7);
  assertEquals(events.length, 5);
  assertEquals(events[0].sequence_number, 3);
  assertEquals(events[4].sequence_number, 7);

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

Deno.test("PersistentEventStore - hasSession", () => {
  const dataDir = createTempDir();
  const store = new PersistentEventStore({ dataDir });

  assertEquals(store.hasSession("session-1"), false);

  store.store(createTestEvent("session-1", 1));

  assertEquals(store.hasSession("session-1"), true);
  assertEquals(store.hasSession("session-2"), false);

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

Deno.test("PersistentEventStore - createSnapshot and getLatestSnapshot", () => {
  const dataDir = createTempDir();
  const store = new PersistentEventStore({ dataDir });

  const sessionId = "session-1";
  for (let i = 1; i <= 5; i++) {
    store.store(createTestEvent(sessionId, i));
  }

  store.createSnapshot(sessionId, { count: 5 });
  const snapshot2 = store.createSnapshot(sessionId, { count: 10 });

  const latest = store.getLatestSnapshot(sessionId);
  assertExists(latest);
  assertEquals(latest.sequence_number, snapshot2.sequence_number);
  assertEquals(latest.state, { count: 10 });

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

Deno.test("PersistentEventStore - getEventsAfterSnapshot", () => {
  const dataDir = createTempDir();
  const store = new PersistentEventStore({ dataDir });

  const sessionId = "session-1";
  for (let i = 1; i <= 10; i++) {
    store.store(createTestEvent(sessionId, i));
  }

  const snapshot: Snapshot = {
    session_id: sessionId,
    sequence_number: 5,
    timestamp: new Date().toISOString(),
    state: {},
  };

  const events = store.getEventsAfterSnapshot(sessionId, snapshot);
  assertEquals(events.length, 5);
  assertEquals(events[0].sequence_number, 6);
  assertEquals(events[4].sequence_number, 10);

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

// ============================================================================
// Recovery Tests
// ============================================================================

Deno.test("PersistentEventStore - recover on startup", () => {
  const dataDir = createTempDir();

  // Create store and store events
  const store1 = new PersistentEventStore({ dataDir });
  const sessionId = "session-1";
  for (let i = 1; i <= 5; i++) {
    store1.store(createTestEvent(sessionId, i));
  }

  // Create new store with same dataDir - should recover
  const store2 = new PersistentEventStore({ dataDir });
  const events = store2.getEvents(sessionId);
  assertEquals(events.length, 5);
  assertEquals(events[0].sequence_number, 1);
  assertEquals(events[4].sequence_number, 5);

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

Deno.test("PersistentEventStore - recover with snapshot", () => {
  const dataDir = createTempDir();

  // Create store, store events, create snapshot
  const store1 = new PersistentEventStore({ dataDir });
  const sessionId = "session-1";
  for (let i = 1; i <= 10; i++) {
    store1.store(createTestEvent(sessionId, i));
  }
  store1.createSnapshot(sessionId, { count: 10 });

  // Create new store - should recover from snapshot
  const store2 = new PersistentEventStore({ dataDir });
  const events = store2.getEvents(sessionId);
  // After snapshot at seq 10, no events should be in cache
  assertEquals(events.length, 0);

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

Deno.test("PersistentEventStore - recover handles corrupted lines", () => {
  const dataDir = createTempDir();
  const backend = new FilePersistenceBackend(dataDir);

  const sessionId = "session-1";
  // Write valid events
  const event1 = createTestEvent(sessionId, 1);
  const event2 = createTestEvent(sessionId, 2);
  backend.write(sessionId, JSON.stringify(event1));
  // Write corrupted line
  backend.write(sessionId, "invalid json{");
  // Write another valid event
  backend.write(sessionId, JSON.stringify(event2));

  // Create store - should recover valid events and skip corrupted
  const store = new PersistentEventStore({ dataDir });
  const events = store.getEvents(sessionId);
  assertEquals(events.length, 2);
  assertEquals(events[0].sequence_number, 1);
  assertEquals(events[1].sequence_number, 2);

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

// ============================================================================
// Integration Test
// ============================================================================

Deno.test("PersistentEventStore - full integration test", () => {
  const dataDir = createTempDir();

  // Create store
  const store1 = new PersistentEventStore({ dataDir });
  const sessionId = "session-1";

  // Store 10 events
  for (let i = 1; i <= 10; i++) {
    store1.store(createTestEvent(sessionId, i));
  }

  // Create snapshot at event 10
  store1.createSnapshot(sessionId, { count: 10 });

  // Store 10 more events
  for (let i = 11; i <= 20; i++) {
    store1.store(createTestEvent(sessionId, i));
  }

  // Verify all 20 events are accessible
  const events1 = store1.getEvents(sessionId);
  assertEquals(events1.length, 20);

  // Create new store - should recover
  const store2 = new PersistentEventStore({ dataDir });

  // After snapshot at seq 10, only events 11-20 should be in cache
  const events2 = store2.getEvents(sessionId);
  assertEquals(events2.length, 10);
  assertEquals(events2[0].sequence_number, 11);
  assertEquals(events2[9].sequence_number, 20);

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});

// ============================================================================
// Flush Tests
// ============================================================================

Deno.test("PersistentEventStore - flush does not throw", () => {
  const dataDir = createTempDir();
  const store = new PersistentEventStore({ dataDir });

  // Should not throw
  store.flush();

  // Cleanup
  Deno.removeSync(dataDir, { recursive: true });
});