import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { EventStream } from "../event-stream.ts";
import {
  SessionManager,
  InvalidStateTransitionError,
  SessionError,
} from "../session-manager.ts";

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

  await t.step("emits session.created event", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    const events = stream.getEvents(session.id);

    assertEquals(events.length, 1);
    assertEquals(events[0].event_type, "session.created");
  });

  await t.step("pauses an active session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    const paused = manager.pauseSession(session.id);

    assertEquals(paused.state, "paused");
  });

  await t.step("resumes a paused session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    manager.pauseSession(session.id);
    const resumed = manager.resumeSession(session.id);

    assertEquals(resumed.state, "active");
  });

  await t.step("completes an active session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    const completed = manager.completeSession(session.id);

    assertEquals(completed.state, "completed");
  });

  await t.step("fails an active session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    const failed = manager.failSession(session.id, "Something went wrong");

    assertEquals(failed.state, "failed");
  });

  await t.step("cancels an active session", () => {
    const stream = new EventStream();
    const manager = new SessionManager(stream);

    const session = manager.createSession();
    const cancelled = manager.cancelSession(session.id);

    assertEquals(cancelled.state, "cancelled");
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
    assertEquals(events[0].event_type, "session.created");
    assertEquals(events[1].event_type, "session.paused");
    assertEquals(events[2].event_type, "session.resumed");
    assertEquals(events[3].event_type, "session.completed");
  });
});
