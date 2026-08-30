/**
 * Integration tests for projection protocol.
 */

import { assertEquals, assertExists } from "@std/assert";
import { EventStream } from "../../core/event-stream.ts";
import { BaseEvent } from "../../types/events.ts";
import { ProjectionProtocol } from "../protocol.ts";
import { EventTypes } from "../../types/events.ts";

Deno.test("ProjectionProtocol - subscribe and receive events", async () => {
  const eventStream = new EventStream();
  const protocol = new ProjectionProtocol(eventStream);

  // Create a session
  const sessionId = "test-session";
  eventStream.append({
    session_id: sessionId,
    sequence_number: 1,
    event_type: EventTypes.SESSION_CREATED,
    payload: { session_id: sessionId },
    metadata: { source: "test" },
  });

  // Subscribe to events
  const receivedEvents: BaseEvent[] = [];
  const subscription = protocol.subscribe(sessionId, (event) => {
    receivedEvents.push(event);
  });

  // Verify subscription was created
  assertExists(subscription);
  assertEquals(subscription.session_id, sessionId);
  assertEquals(subscription.state, "active");

  // Wait for event delivery
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify events were received
  assertEquals(receivedEvents.length, 1);
  assertEquals(receivedEvents[0].event_type, EventTypes.SESSION_CREATED);

  // Cleanup
  protocol.unsubscribe(subscription.id);
});

Deno.test("ProjectionProtocol - unsubscribe stops delivery", async () => {
  const eventStream = new EventStream();
  const protocol = new ProjectionProtocol(eventStream);

  const sessionId = "test-session";
  const receivedEvents: BaseEvent[] = [];

  const subscription = protocol.subscribe(sessionId, (event) => {
    receivedEvents.push(event);
  });

  // Unsubscribe
  protocol.unsubscribe(subscription.id);

  // Add event after unsubscribe
  eventStream.append({
    session_id: sessionId,
    sequence_number: 1,
    event_type: EventTypes.SESSION_CREATED,
    payload: { session_id: sessionId },
    metadata: { source: "test" },
  });

  // Wait
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify no events received after unsubscribe
  assertEquals(receivedEvents.length, 0);
});

Deno.test("ProjectionProtocol - pause and resume", async () => {
  const eventStream = new EventStream();
  const protocol = new ProjectionProtocol(eventStream);

  const sessionId = "test-session";
  const receivedEvents: BaseEvent[] = [];

  const subscription = protocol.subscribe(sessionId, (event) => {
    receivedEvents.push(event);
  });

  // Pause subscription
  protocol.pause(subscription.id);
  assertEquals(protocol.getSubscription(subscription.id)?.state, "paused");

  // Add event while paused
  eventStream.append({
    session_id: sessionId,
    sequence_number: 1,
    event_type: EventTypes.SESSION_CREATED,
    payload: { session_id: sessionId },
    metadata: { source: "test" },
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify no events received while paused
  assertEquals(receivedEvents.length, 0);

  // Resume subscription
  protocol.resume(subscription.id);
  assertEquals(protocol.getSubscription(subscription.id)?.state, "active");

  // Wait for event delivery
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify events received after resume
  assertEquals(receivedEvents.length, 1);

  // Cleanup
  protocol.unsubscribe(subscription.id);
});

Deno.test("ProjectionProtocol - event filtering", async () => {
  const eventStream = new EventStream();
  const protocol = new ProjectionProtocol(eventStream);

  const sessionId = "test-session";
  const receivedEvents: BaseEvent[] = [];

  // Subscribe with filter - only session events
  const subscription = protocol.subscribe(
    sessionId,
    (event) => {
      receivedEvents.push(event);
    },
    {
      filter: {
        event_types: [EventTypes.SESSION_CREATED, EventTypes.SESSION_COMPLETED],
      },
    },
  );

  // Add session event
  eventStream.append({
    session_id: sessionId,
    sequence_number: 1,
    event_type: EventTypes.SESSION_CREATED,
    payload: { session_id: sessionId },
    metadata: { source: "test" },
  });

  // Add tool event (should be filtered out)
  eventStream.append({
    session_id: sessionId,
    sequence_number: 2,
    event_type: EventTypes.TOOL_EXECUTION_STARTED,
    payload: { tool: "test" },
    metadata: { source: "test" },
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify only session event was received
  assertEquals(receivedEvents.length, 1);
  assertEquals(receivedEvents[0].event_type, EventTypes.SESSION_CREATED);

  // Cleanup
  protocol.unsubscribe(subscription.id);
});

Deno.test("ProjectionProtocol - multiple subscriptions", async () => {
  const eventStream = new EventStream();
  const protocol = new ProjectionProtocol(eventStream);

  const sessionId = "test-session";
  const receivedEvents1: unknown[] = [];
  const receivedEvents2: unknown[] = [];

  const sub1 = protocol.subscribe(sessionId, (event) => {
    receivedEvents1.push(event);
  });

  const sub2 = protocol.subscribe(sessionId, (event) => {
    receivedEvents2.push(event);
  });

  // Add event
  eventStream.append({
    session_id: sessionId,
    sequence_number: 1,
    event_type: EventTypes.SESSION_CREATED,
    payload: { session_id: sessionId },
    metadata: { source: "test" },
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify both subscriptions received the event
  assertEquals(receivedEvents1.length, 1);
  assertEquals(receivedEvents2.length, 1);

  // Verify getSubscriptionsForSession works
  const subs = protocol.getSubscriptionsForSession(sessionId);
  assertEquals(subs.length, 2);

  // Cleanup
  protocol.unsubscribe(sub1.id);
  protocol.unsubscribe(sub2.id);
});

Deno.test("ProjectionProtocol - error handling", async () => {
  const eventStream = new EventStream();
  const protocol = new ProjectionProtocol(eventStream);

  const sessionId = "test-session";
  const errors: Error[] = [];

  protocol.onError((error) => {
    errors.push(error);
  });

  const subscription = protocol.subscribe(sessionId, () => {
    throw new Error("Test error");
  });

  // Add event to trigger error
  eventStream.append({
    session_id: sessionId,
    sequence_number: 1,
    event_type: EventTypes.SESSION_CREATED,
    payload: { session_id: sessionId },
    metadata: { source: "test" },
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify error was captured
  assertEquals(errors.length, 1);
  assertEquals(errors[0].message, "Test error");

  // Cleanup
  protocol.unsubscribe(subscription.id);
});

Deno.test("ProjectionProtocol - from_sequence filter", async () => {
  const eventStream = new EventStream();
  const protocol = new ProjectionProtocol(eventStream);

  const sessionId = "test-session";

  // Add some events first
  for (let i = 1; i <= 5; i++) {
    eventStream.append({
      session_id: sessionId,
      sequence_number: i,
      event_type: EventTypes.SESSION_CREATED,
      payload: { session_id: sessionId, sequence: i },
      metadata: { source: "test" },
    });
  }

  const receivedEvents: BaseEvent[] = [];

  // Subscribe starting from sequence 3
  const subscription = protocol.subscribe(
    sessionId,
    (event) => {
      receivedEvents.push(event);
    },
    {
      filter: {
        from_sequence: 3,
      },
    },
  );

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify only events from sequence 3 onwards were received
  assertEquals(receivedEvents.length, 3);
  assertEquals(receivedEvents[0].sequence_number, 3);
  assertEquals(receivedEvents[2].sequence_number, 5);

  // Cleanup
  protocol.unsubscribe(subscription.id);
});
