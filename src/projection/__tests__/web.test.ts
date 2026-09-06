/**
 * Unit tests for Web projection.
 */

import { assertEquals } from "@std/assert";
import { BaseEvent, EventTypes } from "../../types/events.ts";
import {
  WebProjection,
  WebWebSocketClient,
  WebEventFormatter,
} from "../web.ts";

// ============================================================================
// Mock Implementations
// ============================================================================

class MockRestApiClient {
  sessions: Array<{ id: string; state: string; created_at: string; event_count: number }> = [];
  events: BaseEvent[] = [];
  messages: Array<{ sessionId: string; message: string }> = [];

  async getSessions() {
    return this.sessions;
  }

  async createSession(_initialMessage?: string) {
    const session = {
      id: `session-${Date.now()}`,
      state: "active",
      created_at: new Date().toISOString(),
      event_count: 0,
    };
    this.sessions.push(session);
    return session;
  }

  async getEvents(_sessionId: string, limit?: number, offset?: number) {
    return this.events.slice(offset || 0, (offset || 0) + (limit || 100));
  }

  async sendMessage(sessionId: string, message: string) {
    this.messages.push({ sessionId, message });
    return { success: true, messageId: `msg-${Date.now()}` };
  }
}

// ============================================================================
// Test Helpers
// ============================================================================

function createTestEvent(
  type: string = EventTypes.SESSION_CREATED,
  sessionId = "test-session",
): BaseEvent {
  return {
    event_id: crypto.randomUUID(),
    session_id: sessionId,
    sequence_number: 1,
    event_type: type as BaseEvent["event_type"],
    timestamp: new Date().toISOString(),
    schema_version: 1,
    payload: { message: "test" },
    metadata: { source: "test" },
  };
}

// ============================================================================
// WebProjection Tests
// ============================================================================

Deno.test("WebProjection - loadSessions returns sessions", async () => {
  const restClient = new MockRestApiClient();
  const wsClient = new WebWebSocketClient({ url: "ws://localhost:8080" });
  const projection = new WebProjection(
    restClient as unknown as import("../web.ts").WebRestApiClient,
    wsClient,
  );

  restClient.sessions = [
    { id: "s1", state: "active", created_at: "2024-01-01", event_count: 5 },
  ];

  const sessions = await projection.loadSessions();
  assertEquals(sessions.length, 1);
  assertEquals(sessions[0].id, "s1");
});

Deno.test("WebProjection - sendMessage sends message", async () => {
  const restClient = new MockRestApiClient();
  const wsClient = new WebWebSocketClient({ url: "ws://localhost:8080" });
  const projection = new WebProjection(
    restClient as unknown as import("../web.ts").WebRestApiClient,
    wsClient,
  );

  projection.selectSession("s1");
  const result = await projection.sendMessage("Hello");
  assertEquals(result.success, true);
});

Deno.test("WebProjection - sendMessage fails without session", async () => {
  const restClient = new MockRestApiClient();
  const wsClient = new WebWebSocketClient({ url: "ws://localhost:8080" });
  const projection = new WebProjection(
    restClient as unknown as import("../web.ts").WebRestApiClient,
    wsClient,
  );

  const result = await projection.sendMessage("Hello");
  assertEquals(result.success, false);
});

// ============================================================================
// WebEventFormatter Tests
// ============================================================================

Deno.test("WebEventFormatter - format event correctly", () => {
  const formatter = new WebEventFormatter();
  const event = createTestEvent();
  const formatted = formatter.format(event);
  assertEquals(formatted.includes("session.created"), true);
});

Deno.test("WebEventFormatter - formatDetail returns detail", () => {
  const formatter = new WebEventFormatter();
  const event = createTestEvent();
  const detail = formatter.formatDetail(event);
  assertEquals(detail.type, EventTypes.SESSION_CREATED);
  assertEquals(detail.sequence, 1);
});