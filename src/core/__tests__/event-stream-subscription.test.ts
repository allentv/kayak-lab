/**
 * EventStream subscription tests.
 *
 * Tests for onAppend callback functionality.
 */

import { assertEquals } from "@std/assert";
import { EventStream } from "../event-stream.ts";
import { EventTypes } from "../../types/events.ts";
import type { BaseEvent } from "../../types/events.ts";

const testMetadata = { source: "test" };

Deno.test("EventStream - onAppend subscription", async (t) => {
  await t.step("global onAppend fires on every append", () => {
    const stream = new EventStream();
    const events: BaseEvent[] = [];

    const unsubscribe = stream.onAppend((event) => {
      events.push(event);
    });

    // Append events
    stream.append({
      session_id: "session-1",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: testMetadata,
    });

    stream.append({
      session_id: "session-1",
      sequence_number: 2,
      event_type: EventTypes.AGENT_THINKING,
      payload: { thought: "test" },
      metadata: testMetadata,
    });

    assertEquals(events.length, 2);
    assertEquals(events[0].event_type, EventTypes.SESSION_CREATED);
    assertEquals(events[1].event_type, EventTypes.AGENT_THINKING);

    unsubscribe();
  });

  await t.step("unsubscribe stops callbacks", () => {
    const stream = new EventStream();
    const events: BaseEvent[] = [];

    const unsubscribe = stream.onAppend((event) => {
      events.push(event);
    });

    stream.append({
      session_id: "session-1",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: testMetadata,
    });

    assertEquals(events.length, 1);

    unsubscribe();

    stream.append({
      session_id: "session-1",
      sequence_number: 2,
      event_type: EventTypes.AGENT_THINKING,
      payload: {},
      metadata: testMetadata,
    });

    // Should still be 1 after unsubscribe
    assertEquals(events.length, 1);
  });

  await t.step("session-scoped onAppend fires only for matching session", () => {
    const stream = new EventStream();
    const session1Events: BaseEvent[] = [];
    const session2Events: BaseEvent[] = [];

    const unsub1 = stream.onAppend("session-1", (event) => {
      session1Events.push(event);
    });

    const unsub2 = stream.onAppend("session-2", (event) => {
      session2Events.push(event);
    });

    // Append to session 1
    stream.append({
      session_id: "session-1",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: testMetadata,
    });

    assertEquals(session1Events.length, 1);
    assertEquals(session2Events.length, 0);

    // Append to session 2
    stream.append({
      session_id: "session-2",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: testMetadata,
    });

    assertEquals(session1Events.length, 1);
    assertEquals(session2Events.length, 1);

    unsub1();
    unsub2();
  });

  await t.step("multiple subscribers receive same event", () => {
    const stream = new EventStream();
    const events1: BaseEvent[] = [];
    const events2: BaseEvent[] = [];

    const unsub1 = stream.onAppend((event) => {
      events1.push(event);
    });

    const unsub2 = stream.onAppend((event) => {
      events2.push(event);
    });

    stream.append({
      session_id: "session-1",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: testMetadata,
    });

    assertEquals(events1.length, 1);
    assertEquals(events2.length, 1);

    unsub1();
    unsub2();
  });

  await t.step("unsubscribing one subscriber does not affect others", () => {
    const stream = new EventStream();
    const events1: BaseEvent[] = [];
    const events2: BaseEvent[] = [];

    const unsub1 = stream.onAppend((event) => {
      events1.push(event);
    });

    const unsub2 = stream.onAppend((event) => {
      events2.push(event);
    });

    unsub1();

    stream.append({
      session_id: "session-1",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: testMetadata,
    });

    assertEquals(events1.length, 0);
    assertEquals(events2.length, 1);

    unsub2();
  });
});
