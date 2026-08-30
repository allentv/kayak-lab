import {
  assertEquals,
  assertExists,
} from "@std/assert";
import { EventStore } from "../event-store.ts";
import { BaseEvent, EventTypes } from "../../types/events.ts";

function createTestEvent(
  sessionId: string,
  sequenceNumber: number,
  eventType: (typeof EventTypes)[keyof typeof EventTypes] = EventTypes.SESSION_CREATED,
): BaseEvent {
  return {
    event_id: crypto.randomUUID(),
    session_id: sessionId,
    sequence_number: sequenceNumber,
    timestamp: new Date().toISOString(),
    event_type: eventType,
    schema_version: 1,
    payload: {},
    metadata: { source: "test" },
  };
}

Deno.test("EventStore", async (t) => {
  await t.step("stores and retrieves events", () => {
    const store = new EventStore();
    const event = createTestEvent("session-1", 1);

    store.store(event);
    const events = store.getEvents("session-1");

    assertEquals(events.length, 1);
    assertEquals(events[0].event_id, event.event_id);
  });

  await t.step("returns empty array for non-existent session", () => {
    const store = new EventStore();
    const events = store.getEvents("non-existent");

    assertEquals(events.length, 0);
  });

  await t.step("retrieves events by range", () => {
    const store = new EventStore();

    store.store(createTestEvent("session-1", 1));
    store.store(createTestEvent("session-1", 2));
    store.store(createTestEvent("session-1", 3));

    const events = store.getEventsInRange("session-1", 2, 3);
    assertEquals(events.length, 2);
    assertEquals(events[0].sequence_number, 2);
    assertEquals(events[1].sequence_number, 3);
  });

  await t.step("returns empty range for invalid bounds", () => {
    const store = new EventStore();

    store.store(createTestEvent("session-1", 1));
    store.store(createTestEvent("session-1", 2));

    const events = store.getEventsInRange("session-1", 5, 10);
    assertEquals(events.length, 0);
  });

  await t.step("gets last event", () => {
    const store = new EventStore();

    store.store(createTestEvent("session-1", 1));
    store.store(createTestEvent("session-1", 2));

    const last = store.getLastEvent("session-1");
    assertExists(last);
    assertEquals(last.sequence_number, 2);
  });

  await t.step("returns undefined for last event of non-existent session", () => {
    const store = new EventStore();
    const last = store.getLastEvent("non-existent");

    assertEquals(last, undefined);
  });

  await t.step("checks session existence", () => {
    const store = new EventStore();

    assertEquals(store.hasSession("session-1"), false);

    store.store(createTestEvent("session-1", 1));

    assertEquals(store.hasSession("session-1"), true);
  });

  await t.step("gets session IDs", () => {
    const store = new EventStore();

    store.store(createTestEvent("session-1", 1));
    store.store(createTestEvent("session-2", 1));

    const ids = store.getSessionIds();
    assertEquals(ids.length, 2);
    assertEquals(ids.includes("session-1"), true);
    assertEquals(ids.includes("session-2"), true);
  });

  await t.step("creates and retrieves snapshots", () => {
    const store = new EventStore();

    store.store(createTestEvent("session-1", 1));
    store.store(createTestEvent("session-1", 2));

    const snapshot = store.createSnapshot("session-1", { state: "active" });

    assertEquals(snapshot.session_id, "session-1");
    assertEquals(snapshot.sequence_number, 2);
    assertEquals(snapshot.state, { state: "active" });

    const latest = store.getLatestSnapshot("session-1");
    assertExists(latest);
    assertEquals(latest.sequence_number, 2);
  });

  await t.step("creates snapshot with zero events", () => {
    const store = new EventStore();

    const snapshot = store.createSnapshot("session-1", { state: "empty" });

    assertEquals(snapshot.sequence_number, 0);
  });

  await t.step("gets events after snapshot", () => {
    const store = new EventStore();

    store.store(createTestEvent("session-1", 1));
    store.store(createTestEvent("session-1", 2));

    const snapshot = store.createSnapshot("session-1", { state: "active" });

    store.store(createTestEvent("session-1", 3));

    const eventsAfter = store.getEventsAfterSnapshot("session-1", snapshot);
    assertEquals(eventsAfter.length, 1);
    assertEquals(eventsAfter[0].sequence_number, 3);
  });

  await t.step("tracks total events", () => {
    const store = new EventStore();

    assertEquals(store.totalEvents, 0);

    store.store(createTestEvent("session-1", 1));
    store.store(createTestEvent("session-2", 1));

    assertEquals(store.totalEvents, 2);
  });

  await t.step("tracks session count", () => {
    const store = new EventStore();

    assertEquals(store.sessionCount, 0);

    store.store(createTestEvent("session-1", 1));
    store.store(createTestEvent("session-2", 1));

    assertEquals(store.sessionCount, 2);
  });

  await t.step("returns readonly copies of events", () => {
    const store = new EventStore();
    store.store(createTestEvent("session-1", 1));

    const events = store.getEvents("session-1");
    assertEquals(Object.isFrozen(events), true);
  });
});
