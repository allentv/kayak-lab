import { assertEquals } from "@std/assert";
import { EventStream } from "../core/event-stream.ts";
import { SessionManager } from "../core/session-manager.ts";
import { EventStore } from "../store/event-store.ts";
import { EventTypes } from "../types/events.ts";

Deno.test("End-to-end session lifecycle", async (t) => {
  await t.step("complete session lifecycle with event store", () => {
    const eventStream = new EventStream();
    const eventStore = new EventStore();
    const sessionManager = new SessionManager(eventStream);

    // Create a session
    const session = sessionManager.createSession({
      description: "E2E test session",
    });

    // Store the creation event
    const createEvent = eventStream.getLastEvent(session.id);
    if (createEvent) {
      eventStore.store(createEvent);
    }

    assertEquals(session.state, "active");
    assertEquals(session.description, "E2E test session");

    // Pause the session
    const paused = sessionManager.pauseSession(session.id);
    const pauseEvent = eventStream.getLastEvent(session.id);
    if (pauseEvent) {
      eventStore.store(pauseEvent);
    }

    assertEquals(paused.state, "paused");

    // Resume the session
    const resumed = sessionManager.resumeSession(session.id);
    const resumeEvent = eventStream.getLastEvent(session.id);
    if (resumeEvent) {
      eventStore.store(resumeEvent);
    }

    assertEquals(resumed.state, "active");

    // Complete the session
    const completed = sessionManager.completeSession(session.id);
    const completeEvent = eventStream.getLastEvent(session.id);
    if (completeEvent) {
      eventStore.store(completeEvent);
    }

    assertEquals(completed.state, "completed");

    // Verify event store has all events
    const storedEvents = eventStore.getEvents(session.id);
    assertEquals(storedEvents.length, 4);

    // Verify event types
    assertEquals(storedEvents[0].event_type, EventTypes.SESSION_CREATED);
    assertEquals(storedEvents[1].event_type, EventTypes.SESSION_PAUSED);
    assertEquals(storedEvents[2].event_type, EventTypes.SESSION_RESUMED);
    assertEquals(storedEvents[3].event_type, EventTypes.SESSION_COMPLETED);

    // Verify sequence numbers
    assertEquals(storedEvents[0].sequence_number, 1);
    assertEquals(storedEvents[1].sequence_number, 2);
    assertEquals(storedEvents[2].sequence_number, 3);
    assertEquals(storedEvents[3].sequence_number, 4);
  });

  await t.step("session replay from event store", () => {
    const eventStream = new EventStream();
    const eventStore = new EventStore();
    const sessionManager = new SessionManager(eventStream);

    // Create and complete a session
    const session = sessionManager.createSession();
    sessionManager.pauseSession(session.id);
    sessionManager.resumeSession(session.id);
    sessionManager.completeSession(session.id);

    // Store all events
    const allEvents = eventStream.getEvents(session.id);
    for (const event of allEvents) {
      eventStore.store(event);
    }

    // Verify we can replay from the store
    const replayedEvents = eventStore.getEvents(session.id);
    assertEquals(replayedEvents.length, 4);

    // Verify partial replay
    const partialEvents = eventStore.getEventsInRange(session.id, 2, 3);
    assertEquals(partialEvents.length, 2);
    assertEquals(partialEvents[0].event_type, EventTypes.SESSION_PAUSED);
    assertEquals(partialEvents[1].event_type, EventTypes.SESSION_RESUMED);
  });

  await t.step("snapshot and replay", () => {
    const eventStream = new EventStream();
    const eventStore = new EventStore();
    const sessionManager = new SessionManager(eventStream);

    // Create a session with some events
    const session = sessionManager.createSession();
    sessionManager.pauseSession(session.id);
    sessionManager.resumeSession(session.id);

    // Store events
    const allEvents = eventStream.getEvents(session.id);
    for (const event of allEvents) {
      eventStore.store(event);
    }

    // Create a snapshot after 3 events (create, pause, resume)
    const snapshot = eventStore.createSnapshot(session.id, {
      state: "active",
      event_count: 3,
    });

    assertEquals(snapshot.sequence_number, 3);

    // Complete the session
    sessionManager.completeSession(session.id);
    const completeEvent = eventStream.getLastEvent(session.id);
    if (completeEvent) {
      eventStore.store(completeEvent);
    }

    // Get events after snapshot
    const eventsAfterSnapshot = eventStore.getEventsAfterSnapshot(
      session.id,
      snapshot,
    );

    assertEquals(eventsAfterSnapshot.length, 1);
    assertEquals(eventsAfterSnapshot[0].event_type, EventTypes.SESSION_COMPLETED);
  });

  await t.step("concurrent sessions isolation", () => {
    const eventStream = new EventStream();
    const eventStore = new EventStore();
    const sessionManager = new SessionManager(eventStream);

    // Create two sessions
    const session1 = sessionManager.createSession({ description: "Session 1" });
    const session2 = sessionManager.createSession({ description: "Session 2" });

    // Interleave operations
    sessionManager.pauseSession(session1.id);
    sessionManager.completeSession(session2.id);
    sessionManager.resumeSession(session1.id);

    // Store all events
    for (const event of eventStream.getEvents(session1.id)) {
      eventStore.store(event);
    }
    for (const event of eventStream.getEvents(session2.id)) {
      eventStore.store(event);
    }

    // Verify isolation
    const events1 = eventStore.getEvents(session1.id);
    const events2 = eventStore.getEvents(session2.id);

    assertEquals(events1.length, 3);
    assertEquals(events2.length, 2);

    // Verify session 1 events
    assertEquals(events1[0].event_type, EventTypes.SESSION_CREATED);
    assertEquals(events1[1].event_type, EventTypes.SESSION_PAUSED);
    assertEquals(events1[2].event_type, EventTypes.SESSION_RESUMED);

    // Verify session 2 events
    assertEquals(events2[0].event_type, EventTypes.SESSION_CREATED);
    assertEquals(events2[1].event_type, EventTypes.SESSION_COMPLETED);
  });
});
