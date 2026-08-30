import {
  assertEquals,
  assertExists,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { EventStream } from "../event-stream.ts";
import {
  SessionManager,
  InvalidStateTransitionError,
  SessionError,
} from "../session-manager.ts";
import { EventTypes } from "../../types/events.ts";

Deno.test("SessionManager", async (t) => {
  await t.step("creates a new session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession({
      description: "Test session",
    });

    assertEquals(session.state, "active");
    assertEquals(session.description, "Test session");
    assertEquals(session.id.length > 0, true);
  });

  await t.step("emits session.created event with correct payload", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    const events = stream.getEvents(session.id);

    assertEquals(events.length, 1);
    assertEquals(events[0].event_type, EventTypes.SESSION_CREATED);
    assertEquals(events[0].payload.initial_state, "active");
  });

  await t.step("pauses an active session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    const paused = manager.pauseSession(session.id);

    assertEquals(paused.state, "paused");
  });

  await t.step("emits session.paused event with correct payload", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    manager.pauseSession(session.id);

    const events = stream.getEvents(session.id);
    assertEquals(events[1].event_type, EventTypes.SESSION_PAUSED);
    assertEquals(events[1].payload.previous_state, "active");
    assertEquals(events[1].payload.new_state, "paused");
  });

  await t.step("resumes a paused session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    manager.pauseSession(session.id);
    const resumed = manager.resumeSession(session.id);

    assertEquals(resumed.state, "active");
  });

  await t.step("emits session.resumed event with correct payload", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    manager.pauseSession(session.id);
    manager.resumeSession(session.id);

    const events = stream.getEvents(session.id);
    assertEquals(events[2].event_type, EventTypes.SESSION_RESUMED);
    assertEquals(events[2].payload.previous_state, "paused");
    assertEquals(events[2].payload.new_state, "active");
  });

  await t.step("completes an active session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    const completed = manager.completeSession(session.id);

    assertEquals(completed.state, "completed");
  });

  await t.step("emits session.completed event with correct payload", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    manager.completeSession(session.id);

    const events = stream.getEvents(session.id);
    assertEquals(events[1].event_type, EventTypes.SESSION_COMPLETED);
    assertEquals(events[1].payload.previous_state, "active");
    assertEquals(events[1].payload.new_state, "completed");
  });

  await t.step("fails an active session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    const failed = manager.failSession(session.id, "Something went wrong");

    assertEquals(failed.state, "failed");
  });

  await t.step("emits session.failed event with error payload", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    manager.failSession(session.id, "Something went wrong");

    const events = stream.getEvents(session.id);
    assertEquals(events[1].event_type, EventTypes.SESSION_FAILED);
    assertEquals(events[1].payload.previous_state, "active");
    assertEquals(events[1].payload.new_state, "failed");
    assertEquals(events[1].payload.error, "Something went wrong");
  });

  await t.step("cancels an active session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    const cancelled = manager.cancelSession(session.id);

    assertEquals(cancelled.state, "cancelled");
  });

  await t.step("emits session.cancelled event with correct payload", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    manager.cancelSession(session.id);

    const events = stream.getEvents(session.id);
    assertEquals(events[1].event_type, EventTypes.SESSION_CANCELLED);
    assertEquals(events[1].payload.previous_state, "active");
    assertEquals(events[1].payload.new_state, "cancelled");
  });

  await t.step("rejects invalid state transitions", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    manager.completeSession(session.id);

    assertThrows(
      () => {
        manager.pauseSession(session.id);
      },
      InvalidStateTransitionError,
    );
  });

  await t.step("throws for non-existent session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    assertThrows(
      () => {
        manager.pauseSession("non-existent");
      },
      SessionError,
    );
  });

  await t.step("emits events for all state transitions", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    manager.pauseSession(session.id);
    manager.resumeSession(session.id);
    manager.completeSession(session.id);

    const events = stream.getEvents(session.id);

    assertEquals(events.length, 4);
    assertEquals(events[0].event_type, EventTypes.SESSION_CREATED);
    assertEquals(events[1].event_type, EventTypes.SESSION_PAUSED);
    assertEquals(events[2].event_type, EventTypes.SESSION_RESUMED);
    assertEquals(events[3].event_type, EventTypes.SESSION_COMPLETED);
  });

  await t.step("returns immutable copies of sessions", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session1 = manager.createSession();
    const session2 = manager.pauseSession(session1.id);

    // Mutating session1 should not affect session2
    assertEquals(session1.state, "active");
    assertEquals(session2.state, "paused");
  });

  await t.step("rejects transition from completed state", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    manager.completeSession(session.id);

    assertThrows(
      () => manager.pauseSession(session.id),
      InvalidStateTransitionError,
    );

    assertThrows(
      () => manager.resumeSession(session.id),
      InvalidStateTransitionError,
    );

    assertThrows(
      () => manager.cancelSession(session.id),
      InvalidStateTransitionError,
    );
  });

  await t.step("rejects transition from failed state", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    manager.failSession(session.id);

    assertThrows(
      () => manager.pauseSession(session.id),
      InvalidStateTransitionError,
    );

    assertThrows(
      () => manager.resumeSession(session.id),
      InvalidStateTransitionError,
    );

    assertThrows(
      () => manager.completeSession(session.id),
      InvalidStateTransitionError,
    );

    assertThrows(
      () => manager.cancelSession(session.id),
      InvalidStateTransitionError,
    );
  });

  await t.step("rejects transition from cancelled state", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    manager.cancelSession(session.id);

    assertThrows(
      () => manager.pauseSession(session.id),
      InvalidStateTransitionError,
    );

    assertThrows(
      () => manager.resumeSession(session.id),
      InvalidStateTransitionError,
    );

    assertThrows(
      () => manager.completeSession(session.id),
      InvalidStateTransitionError,
    );

    assertThrows(
      () => manager.failSession(session.id),
      InvalidStateTransitionError,
    );
  });

  await t.step("gets session by ID", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    const retrieved = manager.getSession(session.id);

    assertExists(retrieved);
    assertEquals(retrieved.id, session.id);
    assertEquals(retrieved.state, "active");
  });

  await t.step("returns undefined for non-existent session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const retrieved = manager.getSession("non-existent");
    assertEquals(retrieved, undefined);
  });

  await t.step("gets all sessions", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    manager.createSession({ description: "Session 1" });
    manager.createSession({ description: "Session 2" });

    const sessions = manager.getSessions();
    assertEquals(sessions.length, 2);
  });
});
