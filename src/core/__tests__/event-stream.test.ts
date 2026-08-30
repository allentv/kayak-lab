import {
  assertEquals,
  assertThrows,
} from "@std/assert";
import {
  EventStream,
  SequenceError,
  ValidationError,
} from "../event-stream.ts";
import { EventTypes, EventType } from "../../types/events.ts";

Deno.test("EventStream", async (t) => {
  await t.step("appends events with valid sequence numbers", () => {
    const stream = new EventStream();
    const sessionId = "session-1";

    const event1 = stream.append({
      session_id: sessionId,
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: { initial_state: "active" },
      metadata: { source: "test" },
    });

    assertEquals(event1.session_id, sessionId);
    assertEquals(event1.sequence_number, 1);
    assertEquals(event1.event_type, EventTypes.SESSION_CREATED);
    assertEquals(event1.event_id.length > 0, true);
    assertEquals(event1.timestamp.length > 0, true);
  });

  await t.step("rejects out-of-order sequence numbers", () => {
    const stream = new EventStream();
    const sessionId = "session-2";

    stream.append({
      session_id: sessionId,
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    assertThrows(
      () => {
        stream.append({
          session_id: sessionId,
          sequence_number: 3,
          event_type: EventTypes.SESSION_PAUSED,
          payload: {},
          metadata: { source: "test" },
        });
      },
      SequenceError,
    );
  });

  await t.step("rejects invalid event types", () => {
    const stream = new EventStream();
    const invalidType = "invalid.type" as EventType;

    assertThrows(
      () => {
        stream.append({
          session_id: "session-3",
          sequence_number: 1,
          event_type: invalidType,
          payload: {},
          metadata: { source: "test" },
        });
      },
      ValidationError,
    );
  });

  await t.step("maintains session isolation", () => {
    const stream = new EventStream();

    stream.append({
      session_id: "session-a",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    stream.append({
      session_id: "session-b",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    assertEquals(stream.getEvents("session-a").length, 1);
    assertEquals(stream.getEvents("session-b").length, 1);
    assertEquals(stream.getSessionIds().length, 2);
  });

  await t.step("returns readonly copies of events", () => {
    const stream = new EventStream();

    stream.append({
      session_id: "session-4",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    const events = stream.getEvents("session-4");
    assertEquals(Object.isFrozen(events), true);
  });

  await t.step("tracks sequence numbers correctly", () => {
    const stream = new EventStream();
    const sessionId = "session-5";

    assertEquals(stream.getCurrentSequence(sessionId), 0);

    stream.append({
      session_id: sessionId,
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    assertEquals(stream.getCurrentSequence(sessionId), 1);

    stream.append({
      session_id: sessionId,
      sequence_number: 2,
      event_type: EventTypes.SESSION_PAUSED,
      payload: {},
      metadata: { source: "test" },
    });

    assertEquals(stream.getCurrentSequence(sessionId), 2);
  });

  await t.step("returns empty array for non-existent session", () => {
    const stream = new EventStream();
    const events = stream.getEvents("non-existent");
    assertEquals(events.length, 0);
  });

  await t.step("gets events in range", () => {
    const stream = new EventStream();
    const sessionId = "session-6";

    stream.append({
      session_id: sessionId,
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    stream.append({
      session_id: sessionId,
      sequence_number: 2,
      event_type: EventTypes.SESSION_PAUSED,
      payload: {},
      metadata: { source: "test" },
    });

    stream.append({
      session_id: sessionId,
      sequence_number: 3,
      event_type: EventTypes.SESSION_RESUMED,
      payload: {},
      metadata: { source: "test" },
    });

    const events = stream.getEventsInRange(sessionId, 2, 3);
    assertEquals(events.length, 2);
    assertEquals(events[0].sequence_number, 2);
    assertEquals(events[1].sequence_number, 3);
  });

  await t.step("returns empty range for from > to", () => {
    const stream = new EventStream();
    const sessionId = "session-7";

    stream.append({
      session_id: sessionId,
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    const events = stream.getEventsInRange(sessionId, 5, 2);
    assertEquals(events.length, 0);
  });

  await t.step("gets last event", () => {
    const stream = new EventStream();
    const sessionId = "session-8";

    stream.append({
      session_id: sessionId,
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    stream.append({
      session_id: sessionId,
      sequence_number: 2,
      event_type: EventTypes.SESSION_PAUSED,
      payload: {},
      metadata: { source: "test" },
    });

    const last = stream.getLastEvent(sessionId);
    assertEquals(last?.sequence_number, 2);
  });

  await t.step("returns undefined for last event of non-existent session", () => {
    const stream = new EventStream();
    const last = stream.getLastEvent("non-existent");
    assertEquals(last, undefined);
  });

  await t.step("checks session existence", () => {
    const stream = new EventStream();

    assertEquals(stream.hasSession("session-9"), false);

    stream.append({
      session_id: "session-9",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    assertEquals(stream.hasSession("session-9"), true);
  });

  await t.step("gets session IDs", () => {
    const stream = new EventStream();

    stream.append({
      session_id: "session-a",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    stream.append({
      session_id: "session-b",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    const ids = stream.getSessionIds();
    assertEquals(ids.length, 2);
    assertEquals(ids.includes("session-a"), true);
    assertEquals(ids.includes("session-b"), true);
  });

  await t.step("tracks total events", () => {
    const stream = new EventStream();

    assertEquals(stream.totalEvents, 0);

    stream.append({
      session_id: "session-1",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    stream.append({
      session_id: "session-2",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    assertEquals(stream.totalEvents, 2);
  });

  await t.step("tracks session count", () => {
    const stream = new EventStream();

    assertEquals(stream.sessionCount, 0);

    stream.append({
      session_id: "session-1",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    stream.append({
      session_id: "session-2",
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload: {},
      metadata: { source: "test" },
    });

    assertEquals(stream.sessionCount, 2);
  });
});
