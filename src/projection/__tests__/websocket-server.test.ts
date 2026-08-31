/**
 * Tests for WebSocket projection server.
 */

import { assertEquals } from "@std/assert";
import { WebSocketProjectionServer } from "../websocket-server.ts";
import { MockEventStore } from "../../__test-utils__/mocks/mock-event-store.ts";
import { generateSessionEvent } from "../../__test-utils__/helpers/event-generators.ts";

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
    await new Promise((r) => setTimeout(r, 100));

    // Connect a client
    const ws = new WebSocket("ws://localhost:8082");
    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
    });

    // Wait for welcome message
    const welcome = await new Promise<Record<string, unknown>>((resolve) => {
      ws.onmessage = (event) => {
        resolve(JSON.parse(event.data as string));
      };
    });

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
    await new Promise((r) => setTimeout(r, 100));

    // Connect and subscribe
    const ws = new WebSocket("ws://localhost:8083");
    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
    });

    // Skip welcome message
    await new Promise<unknown>((resolve) => {
      ws.onmessage = (event) => resolve(JSON.parse(event.data as string));
    });

    // Subscribe
    ws.send(JSON.stringify({
      type: "subscribe",
      session_id: "test-session",
    }));

    await new Promise((r) => setTimeout(r, 50));

    // Deliver an event
    const event = generateSessionEvent("test-session", 1);
    server.deliverEvent(event);

    // Receive event
    const received = await new Promise<Record<string, unknown>>((resolve) => {
      ws.onmessage = (event) => {
        resolve(JSON.parse(event.data as string));
      };
    });

    assertEquals(received.type, "event");
    assertEquals((received.event as Record<string, unknown>).session_id, "test-session");

    ws.close();
    await server.shutdown();
  });

  await t.step("filters events by session_id", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8084 });

    server.start();
    await new Promise((r) => setTimeout(r, 100));

    const ws = new WebSocket("ws://localhost:8084");
    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
    });

    // Skip welcome
    await new Promise<unknown>((resolve) => {
      ws.onmessage = (event) => resolve(JSON.parse(event.data as string));
    });

    // Subscribe to specific session
    ws.send(JSON.stringify({
      type: "subscribe",
      session_id: "session-a",
    }));

    await new Promise((r) => setTimeout(r, 50));

    // Deliver events to different sessions
    server.deliverEvent(generateSessionEvent("session-a", 1));
    server.deliverEvent(generateSessionEvent("session-b", 1));

    // Should only receive session-a event
    const received = await new Promise<Record<string, unknown>>((resolve) => {
      ws.onmessage = (event) => {
        resolve(JSON.parse(event.data as string));
      };
    });

    assertEquals(received.type, "event");
    assertEquals((received.event as Record<string, unknown>).session_id, "session-a");

    ws.close();
    await server.shutdown();
  });

  await t.step("handles unsubscribe", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8085 });

    server.start();
    await new Promise((r) => setTimeout(r, 100));

    const ws = new WebSocket("ws://localhost:8085");
    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
    });

    // Skip welcome
    await new Promise<unknown>((resolve) => {
      ws.onmessage = (event) => resolve(JSON.parse(event.data as string));
    });

    // Subscribe then unsubscribe
    ws.send(JSON.stringify({ type: "subscribe", session_id: "test" }));
    await new Promise((r) => setTimeout(r, 50));
    ws.send(JSON.stringify({ type: "unsubscribe" }));
    await new Promise((r) => setTimeout(r, 50));

    // Deliver event — should not receive it
    let received = false;
    ws.onmessage = () => { received = true; };

    server.deliverEvent(generateSessionEvent("test", 1));
    await new Promise((r) => setTimeout(r, 100));

    assertEquals(received, false);

    ws.close();
    await server.shutdown();
  });

  await t.step("graceful shutdown closes connections", async () => {
    const store = new MockEventStore();
    const server = new WebSocketProjectionServer(store, { port: 8086 });

    server.start();
    await new Promise((r) => setTimeout(r, 100));

    const ws = new WebSocket("ws://localhost:8086");
    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
    });

    assertEquals(server.clientCount, 1);

    const closePromise = new Promise<void>((resolve) => {
      ws.onclose = () => resolve();
    });

    await server.shutdown();
    await closePromise;

    assertEquals(server.clientCount, 0);
  });
});
