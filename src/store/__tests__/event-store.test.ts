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

  // ========================================================================
  // Causal Graph Tests
  // ========================================================================

  await t.step("buildCausalGraph constructs adjacency list from events", () => {
    const store = new EventStore();
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();
    const id3 = crypto.randomUUID();

    const e1: BaseEvent = {
      ...createTestEvent("s1", 1),
      event_id: id1,
      causal_parents: [],
    };
    const e2: BaseEvent = {
      ...createTestEvent("s1", 2),
      event_id: id2,
      causal_parents: [id1],
    };
    const e3: BaseEvent = {
      ...createTestEvent("s1", 3),
      event_id: id3,
      causal_parents: [id1, id2],
    };

    store.store(e1);
    store.store(e2);
    store.store(e3);

    const graph = store.buildCausalGraph("s1");
    assertEquals(graph.size, 3);

    const node1 = graph.get(id1)!;
    assertEquals(node1.children.length, 2);
    assertEquals(node1.children.includes(id2), true);
    assertEquals(node1.children.includes(id3), true);

    const node2 = graph.get(id2)!;
    assertEquals(node2.children.length, 1);
    assertEquals(node2.children[0], id3);

    const node3 = graph.get(id3)!;
    assertEquals(node3.children.length, 0);
  });

  await t.step("buildCausalGraph treats events without causal_parents as roots", () => {
    const store = new EventStore();
    // Events loaded from disk without causal_parents field
    const e1Raw = createTestEvent("s1", 1);
    const e2Raw = createTestEvent("s1", 2);
    // Simulate events loaded from disk without causal_parents field
    const e1 = { ...e1Raw } as BaseEvent & { causal_parents?: string[] };
    const e2 = { ...e2Raw } as BaseEvent & { causal_parents?: string[] };
    delete e1.causal_parents;
    delete e2.causal_parents;

    store.store(e1);
    store.store(e2);

    const graph = store.buildCausalGraph("s1");
    const node1 = graph.get(e1.event_id)!;
    assertEquals(node1.children.length, 0); // No parents referenced, so no edges
    assertEquals(node1.event.causal_parents, undefined);
  });

  await t.step("findDownstream returns transitive closure", () => {
    const store = new EventStore();
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();
    const id3 = crypto.randomUUID();
    const id4 = crypto.randomUUID();

    // Chain: id1 -> id2 -> id3, id1 -> id4
    store.store({ ...createTestEvent("s1", 1), event_id: id1, causal_parents: [] });
    store.store({ ...createTestEvent("s1", 2), event_id: id2, causal_parents: [id1] });
    store.store({ ...createTestEvent("s1", 3), event_id: id3, causal_parents: [id2] });
    store.store({ ...createTestEvent("s1", 4), event_id: id4, causal_parents: [id1] });

    const downstream = store.findDownstream(id1);
    assertEquals(downstream.length, 3);
    const downstreamIds = downstream.map((e) => e.event_id);
    assertEquals(downstreamIds.includes(id2), true);
    assertEquals(downstreamIds.includes(id3), true);
    assertEquals(downstreamIds.includes(id4), true);
  });

  await t.step("findDownstream returns empty for leaf event", () => {
    const store = new EventStore();
    const id1 = crypto.randomUUID();
    store.store({ ...createTestEvent("s1", 1), event_id: id1, causal_parents: [] });

    const downstream = store.findDownstream(id1);
    assertEquals(downstream.length, 0);
  });

  await t.step("findIndependentChains identifies disconnected chains", () => {
    const store = new EventStore();
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();
    const id3 = crypto.randomUUID();
    const id4 = crypto.randomUUID();

    // Two independent chains: id1->id2 and id3->id4
    store.store({ ...createTestEvent("s1", 1), event_id: id1, causal_parents: [] });
    store.store({ ...createTestEvent("s1", 2), event_id: id2, causal_parents: [id1] });
    store.store({ ...createTestEvent("s1", 3), event_id: id3, causal_parents: [] });
    store.store({ ...createTestEvent("s1", 4), event_id: id4, causal_parents: [id3] });

    const chains = store.findIndependentChains("s1");
    assertEquals(chains.length, 2);
    // Each chain should have 2 events
    const chainLengths = chains.map((c) => c.length).sort();
    assertEquals(chainLengths, [2, 2]);
  });

  await t.step("findIndependentChains returns empty for empty session", () => {
    const store = new EventStore();
    const chains = store.findIndependentChains("non-existent");
    assertEquals(chains.length, 0);
  });
});
