/**
 * Integration tests for REST API projection.
 */

import { assertEquals } from "@std/assert";
import { BaseEvent, EventTypes } from "../../types/events.ts";
import type { ISessionManager } from "../../core/session-manager.ts";
import type { IEventStore } from "../../store/event-store.ts";
import {
  RestApiProjection,
  RestApiRouter,
  ApiKeyAuth,
} from "../rest-api.ts";

// ============================================================================
// Mock Implementations
// ============================================================================

class MockSessionManager {
  sessions: Map<string, { id: string; state: string; created_at: string; updated_at: string; description?: string }> = new Map();

  getSessions() {
    return Array.from(this.sessions.values());
  }

  getSession(id: string) {
    return this.sessions.get(id) || null;
  }

  createSession(options?: { description?: string; config?: Record<string, unknown> }) {
    const id = `session-${Date.now()}`;
    const session = {
      id,
      state: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: options?.description,
    };
    this.sessions.set(id, session);
    return session;
  }

  cancelSession(id: string) {
    const session = this.sessions.get(id);
    if (session) {
      session.state = "cancelled";
    }
  }
}

class MockEventStore {
  events: Map<string, BaseEvent[]> = new Map();

  store(event: BaseEvent): void {
    const sessionEvents = this.events.get(event.session_id) || [];
    sessionEvents.push(event);
    this.events.set(event.session_id, sessionEvents);
  }

  getEvents(sessionId: string): readonly BaseEvent[] {
    return this.events.get(sessionId) || [];
  }

  getEventsInRange(sessionId: string, from: number, to: number): readonly BaseEvent[] {
    return this.getEvents(sessionId).filter(
      (e) => e.sequence_number >= from && e.sequence_number <= to,
    );
  }

  getLastEvent(sessionId: string): BaseEvent | undefined {
    const events = this.getEvents(sessionId);
    return events[events.length - 1];
  }

  hasSession(sessionId: string): boolean {
    return this.events.has(sessionId);
  }

  getSessionIds(): string[] {
    return Array.from(this.events.keys());
  }

  createSnapshot(sessionId: string, state: Record<string, unknown>) {
    return { session_id: sessionId, sequence_number: 0, timestamp: "", state };
  }

  getLatestSnapshot(_sessionId: string) {
    return undefined;
  }

  getEventsAfterSnapshot(_sessionId: string, _snapshot: unknown) {
    return [];
  }

  flush(): void {}
}

// ============================================================================
// Test Helpers
// ============================================================================

function createTestEvent(
  type: string = EventTypes.SESSION_CREATED,
  sessionId = "test-session",
  seq = 1,
): BaseEvent {
  return {
    event_id: crypto.randomUUID(),
    session_id: sessionId,
    sequence_number: seq,
    event_type: type as BaseEvent["event_type"],
    timestamp: new Date().toISOString(),
    schema_version: 1,
    payload: { message: "test" },
    metadata: { source: "test" },
  };
}

function makeRequest(
  method: string,
  path: string,
  options?: { body?: unknown; headers?: Record<string, string> },
): Request {
  const url = `http://localhost${path}`;
  return new Request(url, {
    method,
    headers: options?.headers || {},
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}

// ============================================================================
// ApiKeyAuth Tests
// ============================================================================

Deno.test("ApiKeyAuth - authorize accepts valid key", () => {
  const auth = new ApiKeyAuth("test-key", true);
  const request = makeRequest("GET", "/api/sessions", {
    headers: { Authorization: "Bearer test-key" },
  });
  assertEquals(auth.authorize(request), true);
});

Deno.test("ApiKeyAuth - authorize rejects invalid key", () => {
  const auth = new ApiKeyAuth("test-key", true);
  const request = makeRequest("GET", "/api/sessions", {
    headers: { Authorization: "Bearer wrong-key" },
  });
  assertEquals(auth.authorize(request), false);
});

Deno.test("ApiKeyAuth - authorize rejects missing key", () => {
  const auth = new ApiKeyAuth("test-key", true);
  const request = makeRequest("GET", "/api/sessions");
  assertEquals(auth.authorize(request), false);
});

Deno.test("ApiKeyAuth - unauthorized response has correct status", () => {
  const auth = new ApiKeyAuth("test-key", true);
  const response = auth.unauthorizedResponse();
  assertEquals(response.status, 401);
});

// ============================================================================
// RestApiRouter Tests
// ============================================================================

Deno.test("RestApiRouter - handles unknown route", async () => {
  const router = new RestApiRouter({ basePath: "" });
  const request = makeRequest("GET", "/api/unknown");
  const response = await router.handle(request);
  assertEquals(response.status, 404);
});

Deno.test("RestApiRouter - matches route with parameters", async () => {
  const router = new RestApiRouter({ basePath: "" });
  let params: Record<string, string> = {};
  router.route("GET", "/api/sessions/:id", (_req, p) => {
    params = p;
    return Response.json({ id: p.id });
  });

  const request = makeRequest("GET", "/api/sessions/abc123");
  const response = await router.handle(request);
  assertEquals(response.status, 200);
  assertEquals(params.id, "abc123");
});

Deno.test("RestApiRouter - handles auth", async () => {
  const router = new RestApiRouter({ basePath: "", apiKey: "test-key", enableAuth: true });
  router.route("GET", "/api/sessions", () => Response.json([]), true);

  // No auth header
  const request1 = makeRequest("GET", "/api/sessions");
  const response1 = await router.handle(request1);
  assertEquals(response1.status, 401);

  // Valid auth header
  const request2 = makeRequest("GET", "/api/sessions", {
    headers: { Authorization: "Bearer test-key" },
  });
  const response2 = await router.handle(request2);
  assertEquals(response2.status, 200);
});

// ============================================================================
// RestApiProjection Tests
// ============================================================================

Deno.test("RestApiProjection - list sessions returns sessions", async () => {
  const sessionManager = new MockSessionManager();
  const eventStore = new MockEventStore();
  const projection = new RestApiProjection(
    sessionManager as unknown as ISessionManager,
    eventStore as unknown as IEventStore,
    { enableAuth: false },
  );

  sessionManager.createSession({ description: "Test Session" });

  const request = makeRequest("GET", "/api/sessions");
  const response = await projection.handleRequest(request);
  assertEquals(response.status, 200);
});

Deno.test("RestApiProjection - create session returns 201", async () => {
  const sessionManager = new MockSessionManager();
  const eventStore = new MockEventStore();
  const projection = new RestApiProjection(
    sessionManager as unknown as ISessionManager,
    eventStore as unknown as IEventStore,
    { enableAuth: false },
  );

  const request = makeRequest("POST", "/api/sessions", {
    body: { description: "New Session" },
  });
  const response = await projection.handleRequest(request);
  assertEquals(response.status, 201);
});

Deno.test("RestApiProjection - get session returns 200", async () => {
  const sessionManager = new MockSessionManager();
  const eventStore = new MockEventStore();
  const projection = new RestApiProjection(
    sessionManager as unknown as ISessionManager,
    eventStore as unknown as IEventStore,
    { enableAuth: false },
  );

  const session = sessionManager.createSession();
  const request = makeRequest("GET", `/api/sessions/${session.id}`);
  const response = await projection.handleRequest(request);
  assertEquals(response.status, 200);
});

Deno.test("RestApiProjection - delete session returns 204", async () => {
  const sessionManager = new MockSessionManager();
  const eventStore = new MockEventStore();
  const projection = new RestApiProjection(
    sessionManager as unknown as ISessionManager,
    eventStore as unknown as IEventStore,
    { enableAuth: false },
  );

  const session = sessionManager.createSession();
  const request = makeRequest("DELETE", `/api/sessions/${session.id}`);
  const response = await projection.handleRequest(request);
  assertEquals(response.status, 204);
});

Deno.test("RestApiProjection - list events returns events", async () => {
  const sessionManager = new MockSessionManager();
  const eventStore = new MockEventStore();
  const projection = new RestApiProjection(
    sessionManager as unknown as ISessionManager,
    eventStore as unknown as IEventStore,
    { enableAuth: false },
  );

  const session = sessionManager.createSession();
  eventStore.store(createTestEvent(EventTypes.SESSION_CREATED, session.id, 1));

  const request = makeRequest("GET", `/api/sessions/${session.id}/events`);
  const response = await projection.handleRequest(request);
  assertEquals(response.status, 200);
});

Deno.test("RestApiProjection - get event returns event", async () => {
  const sessionManager = new MockSessionManager();
  const eventStore = new MockEventStore();
  const projection = new RestApiProjection(
    sessionManager as unknown as ISessionManager,
    eventStore as unknown as IEventStore,
    { enableAuth: false },
  );

  const session = sessionManager.createSession();
  eventStore.store(createTestEvent(EventTypes.SESSION_CREATED, session.id, 1));

  const request = makeRequest("GET", `/api/sessions/${session.id}/events/1`);
  const response = await projection.handleRequest(request);
  assertEquals(response.status, 200);
});

Deno.test("RestApiProjection - send message returns 200", async () => {
  const sessionManager = new MockSessionManager();
  const eventStore = new MockEventStore();
  const projection = new RestApiProjection(
    sessionManager as unknown as ISessionManager,
    eventStore as unknown as IEventStore,
    { enableAuth: false },
  );

  const session = sessionManager.createSession();
  // Ensure the event store has a session entry so hasSession returns true
  eventStore.store(createTestEvent(EventTypes.SESSION_CREATED, session.id, 0));

  const request = makeRequest("POST", `/api/sessions/${session.id}/messages`, {
    body: { message: "Hello" },
  });
  const response = await projection.handleRequest(request);
  assertEquals(response.status, 200);
});

Deno.test("RestApiProjection - send message async returns 202", async () => {
  const sessionManager = new MockSessionManager();
  const eventStore = new MockEventStore();
  const projection = new RestApiProjection(
    sessionManager as unknown as ISessionManager,
    eventStore as unknown as IEventStore,
    { enableAuth: false },
  );

  const session = sessionManager.createSession();
  // Ensure the event store has a session entry so hasSession returns true
  eventStore.store(createTestEvent(EventTypes.SESSION_CREATED, session.id, 0));

  const request = makeRequest("POST", `/api/sessions/${session.id}/messages`, {
    body: { message: "Hello", async: true },
  });
  const response = await projection.handleRequest(request);
  assertEquals(response.status, 202);
});