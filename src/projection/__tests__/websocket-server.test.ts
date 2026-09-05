/**
 * Tests for WebSocket projection server.
 */

import { assertEquals } from "@std/assert";
import { WebSocketProjectionServer } from "../websocket-server.ts";
import { MockEventStore } from "../../__test-utils__/mocks/mock-event-store.ts";
import { generateSessionEvent } from "../../__test-utils__/helpers/event-generators.ts";

/** Wait for a WebSocket message, returning parsed JSON. */
function waitForMessage(ws: WebSocket): Promise<Record<string, unknown>> {
  const { promise, resolve } = Promise.withResolvers<Record<string, unknown>>();
  ws.onmessage = (event) => resolve(JSON.parse(event.data as string));
  return promise;
}

Deno.test("WebSocketProjectionServer", async (t) => {
  await t.step("creates server with config", () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8080 });

    assertEquals(server.clientCount, 0);
  });

  await t.step("start and shutdown", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8081 });

    // Start server in background
    server.start();

    // Wait for server to be ready
    await new Promise((r) => setTimeout(r, 100));

    // Shutdown
    await server.shutdown();
    assertEquals(server.clientCount, 0);
  });

  await t.step("accepts WebSocket connections", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8082 });

    server.start();
    await new Promise((r) => setTimeout(r, 100)); // real timer: server startup

    // Connect a client
    const ws = new WebSocket("ws://localhost:8082");
    const { promise: opened, resolve: onOpen } = Promise.withResolvers<void>();
    ws.onopen = () => onOpen();
    await opened;

    const welcome = await waitForMessage(ws);

    assertEquals(welcome.type, "welcome");
    assertEquals(welcome.version, "1.0.0");
    assertEquals(server.clientCount, 1);

    ws.close();
    await server.shutdown();
  });

  await t.step("delivers events to subscribed clients", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8083 });

    server.start();
    await new Promise((r) => setTimeout(r, 100)); // real timer: server startup

    const ws = new WebSocket("ws://localhost:8083");
    const { promise: opened, resolve: onOpen } = Promise.withResolvers<void>();
    ws.onopen = () => onOpen();
    await opened;

    // Skip welcome message
    await waitForMessage(ws);

    // Subscribe
    ws.send(JSON.stringify({
      type: "subscribe",
      session_id: "test-session",
    }));

    await new Promise((r) => setTimeout(r, 50)); // real timer: subscribe propagation

    // Deliver an event
    const event = generateSessionEvent("test-session", 1);
    server.deliverEvent(event);

    const received = await waitForMessage(ws);

    assertEquals(received.type, "event");
    assertEquals((received.event as Record<string, unknown>).session_id, "test-session");

    ws.close();
    await server.shutdown();
  });

  await t.step("filters events by session_id", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8084 });

    server.start();
    await new Promise((r) => setTimeout(r, 100)); // real timer: server startup

    const ws = new WebSocket("ws://localhost:8084");
    const { promise: opened, resolve: onOpen } = Promise.withResolvers<void>();
    ws.onopen = () => onOpen();
    await opened;

    // Skip welcome
    await waitForMessage(ws);

    // Subscribe to specific session
    ws.send(JSON.stringify({
      type: "subscribe",
      session_id: "session-a",
    }));

    await new Promise((r) => setTimeout(r, 50)); // real timer: subscribe propagation

    // Deliver events to different sessions
    server.deliverEvent(generateSessionEvent("session-a", 1));
    server.deliverEvent(generateSessionEvent("session-b", 1));

    // Should only receive session-a event
    const received = await waitForMessage(ws);

    assertEquals(received.type, "event");
    assertEquals((received.event as Record<string, unknown>).session_id, "session-a");

    ws.close();
    await server.shutdown();
  });

  await t.step("handles unsubscribe", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8085 });

    server.start();
    await new Promise((r) => setTimeout(r, 100)); // real timer: server startup

    const ws = new WebSocket("ws://localhost:8085");
    const { promise: opened, resolve: onOpen } = Promise.withResolvers<void>();
    ws.onopen = () => onOpen();
    await opened;

    // Skip welcome
    await waitForMessage(ws);

    // Subscribe then unsubscribe
    ws.send(JSON.stringify({ type: "subscribe", session_id: "test" }));
    await new Promise((r) => setTimeout(r, 50)); // real timer: subscribe propagation
    ws.send(JSON.stringify({ type: "unsubscribe" }));
    await new Promise((r) => setTimeout(r, 50)); // real timer: unsubscribe propagation

    // Deliver event — should not receive it
    let received = false;
    ws.onmessage = () => { received = true; };

    server.deliverEvent(generateSessionEvent("test", 1));
    await new Promise((r) => setTimeout(r, 100)); // real timer: delivery wait

    assertEquals(received, false);

    ws.close();
    await server.shutdown();
  });

  await t.step("graceful shutdown closes connections", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8086 });

    server.start();
    await new Promise((r) => setTimeout(r, 100)); // real timer: server startup

    const ws = new WebSocket("ws://localhost:8086");
    const { promise: opened, resolve: onOpen } = Promise.withResolvers<void>();
    ws.onopen = () => onOpen();
    await opened;

    assertEquals(server.clientCount, 1);

    const { promise: closed, resolve: onClose } = Promise.withResolvers<void>();
    ws.onclose = () => onClose();

    await server.shutdown();
    await closed;

    assertEquals(server.clientCount, 0);
  });

  // ========================================================================
  // Event Ordering (Task 3.2)
  // ========================================================================

  await t.step("delivers events in sequence order within a session", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8090 });

    server.start();
    await new Promise((r) => setTimeout(r, 100)); // real timer: server startup

    const ws = new WebSocket("ws://localhost:8090");
    const { promise: opened, resolve: onOpen } = Promise.withResolvers<void>();
    ws.onopen = () => onOpen();
    await opened;

    // Skip welcome
    await waitForMessage(ws);

    // Subscribe
    ws.send(JSON.stringify({ type: "subscribe", session_id: "order-test" }));
    await new Promise((r) => setTimeout(r, 50)); // real timer: subscribe propagation

    // Deliver 10 events in order
    const received: number[] = [];
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string);
      if (msg.type === "event") {
        received.push(msg.event.sequence_number);
      }
    };

    for (let i = 1; i <= 10; i++) {
      server.deliverEvent(generateSessionEvent("order-test", i));
    }

    await new Promise((r) => setTimeout(r, 100)); // real timer: delivery wait

    assertEquals(received.length, 10);
    assertEquals(received, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    ws.close();
    await server.shutdown();
  });

  await t.step("orders events when delivered out of sequence", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8091 });

    server.start();
    await new Promise((r) => setTimeout(r, 100)); // real timer: server startup

    const ws = new WebSocket("ws://localhost:8091");
    const { promise: opened, resolve: onOpen } = Promise.withResolvers<void>();
    ws.onopen = () => onOpen();
    await opened;

    // Skip welcome
    await waitForMessage(ws);

    ws.send(JSON.stringify({ type: "subscribe", session_id: "oos-test" }));
    await new Promise((r) => setTimeout(r, 50)); // real timer: subscribe propagation

    const received: number[] = [];
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string);
      if (msg.type === "event") {
        received.push(msg.event.sequence_number);
      }
    };

    // Deliver out of order: 3, 1, 2, 5, 4
    server.deliverEvent(generateSessionEvent("oos-test", 3));
    server.deliverEvent(generateSessionEvent("oos-test", 1));
    server.deliverEvent(generateSessionEvent("oos-test", 2));
    server.deliverEvent(generateSessionEvent("oos-test", 5));
    server.deliverEvent(generateSessionEvent("oos-test", 4));

    await new Promise((r) => setTimeout(r, 100)); // real timer: delivery wait

    // Should receive in order: 1, 2, 3, 4, 5
    assertEquals(received, [1, 2, 3, 4, 5]);

    ws.close();
    await server.shutdown();
  });

  // ========================================================================
  // Backpressure (Task 3.3)
  // ========================================================================

  await t.step("buffers events for slow clients and delivers all", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8092 });

    server.start();
    await new Promise((r) => setTimeout(r, 100)); // real timer: server startup

    const ws = new WebSocket("ws://localhost:8092");
    const { promise: opened, resolve: onOpen } = Promise.withResolvers<void>();
    ws.onopen = () => onOpen();
    await opened;

    // Skip welcome
    await waitForMessage(ws);

    ws.send(JSON.stringify({ type: "subscribe", session_id: "bp-test" }));
    await new Promise((r) => setTimeout(r, 50)); // real timer: subscribe propagation

    // Rapidly deliver 50 events
    for (let i = 1; i <= 50; i++) {
      server.deliverEvent(generateSessionEvent("bp-test", i));
    }

    // Collect all received events
    const received: number[] = [];
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string);
      if (msg.type === "event") {
        received.push(msg.event.sequence_number);
      }
    };

    // Wait for delivery to complete
    await new Promise((r) => setTimeout(r, 200)); // real timer: delivery wait

    // All 50 events should be received in order
    assertEquals(received.length, 50);
    assertEquals(received[0], 1);
    assertEquals(received[49], 50);

    ws.close();
    await server.shutdown();
  });

  // ========================================================================
  // Integration Test (Task 6.4)
  // ========================================================================

  await t.step("integration: store → subscribe → real-time delivery", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8093 });

    server.start();
    await new Promise((r) => setTimeout(r, 100)); // real timer: server startup

    // Connect client
    const ws = new WebSocket("ws://localhost:8093");
    const { promise: opened, resolve: onOpen } = Promise.withResolvers<void>();
    ws.onopen = () => onOpen();
    await opened;

    // Skip welcome
    await waitForMessage(ws);

    // Subscribe to session
    ws.send(JSON.stringify({
      type: "subscribe",
      session_id: "integration-session",
    }));
    await new Promise((r) => setTimeout(r, 50)); // real timer: subscribe propagation

    // Track received events
    const received: Array<{ seq: number; type: string }> = [];
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string);
      if (msg.type === "event") {
        received.push({
          seq: msg.event.sequence_number,
          type: msg.event.event_type,
        });
      }
    };

    // Append events to the store and deliver via the server
    const events = [
      generateSessionEvent("integration-session", 1, "session.created"),
      generateSessionEvent("integration-session", 2, "ui.user.input"),
      generateSessionEvent("integration-session", 3, "agent.thinking"),
      generateSessionEvent("integration-session", 4, "agent.tool_invocation"),
      generateSessionEvent("integration-session", 5, "session.completed"),
    ];

    for (const event of events) {
      store.store(event);
      server.deliverEvent(event);
    }

    await new Promise((r) => setTimeout(r, 200)); // real timer: delivery wait

    // Verify all events received in order
    assertEquals(received.length, 5);
    assertEquals(received[0], { seq: 1, type: "session.created" });
    assertEquals(received[1], { seq: 2, type: "ui.user.input" });
    assertEquals(received[2], { seq: 3, type: "agent.thinking" });
    assertEquals(received[3], { seq: 4, type: "agent.tool_invocation" });
    assertEquals(received[4], { seq: 5, type: "session.completed" });

    // Verify events are in the store
    const stored = store.getEvents("integration-session");
    assertEquals(stored.length, 5);

    ws.close();
    await server.shutdown();
  });
});
