/**
 * REST API projection.
 *
 * Provides HTTP endpoints for programmatic access to agent sessions and events.
 * Supports session CRUD, event access, message sending, and API key authentication.
 */

import { BaseEvent, EventTypes } from "../types/events.ts";
import type { SessionState, ISessionManager } from "../core/session-manager.ts";
import type { IEventStore } from "../store/event-store.ts";

// ============================================================================
// REST API Types
// ============================================================================

/** API error response. */
export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

/** Session response shape. */
export interface SessionResponse {
  id: string;
  state: SessionState;
  created_at: string;
  updated_at: string;
  description?: string;
  event_count: number;
  last_event?: BaseEvent;
}

/** Event list response with pagination. */
export interface EventListResponse {
  events: BaseEvent[];
  total: number;
  limit: number;
  offset: number;
}

/** Message request body. */
export interface MessageRequest {
  message: string;
  async?: boolean;
}

/** Message response. */
export interface MessageResponse {
  id: string;
  status: "accepted" | "completed";
  polling_url?: string;
  events?: BaseEvent[];
}

/** REST API route handler. */
export type RouteHandler = (
  request: Request,
  params: Record<string, string>,
) => Promise<Response> | Response;

/** Route definition. */
export interface ApiRoute {
  method: string;
  path: string;
  handler: RouteHandler;
  requiresAuth?: boolean;
}

/** REST API configuration. */
export interface RestApiConfig {
  basePath?: string;
  apiKey?: string;
  enableAuth?: boolean;
}

// ============================================================================
// API Key Authentication Middleware
// ============================================================================

/**
 * Authentication middleware that validates API keys.
 */
export class ApiKeyAuth {
  private apiKey: string;
  private enabled: boolean;

  constructor(apiKey: string, enabled = true) {
    this.apiKey = apiKey;
    this.enabled = enabled;
  }

  /** Check if the request is authorized. */
  authorize(request: Request): boolean {
    if (!this.enabled) return true;

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return false;

    // Support "Bearer <key>" format
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
    return token === this.apiKey;
  }

  /** Create a 401 Unauthorized response. */
  unauthorizedResponse(): Response {
    return Response.json(
      { error: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }
}

// ============================================================================
// REST API Router
// ============================================================================

/**
 * Simple HTTP router for REST API endpoints.
 */
export class RestApiRouter {
  private routes: ApiRoute[] = [];
  private basePath: string;
  private auth: ApiKeyAuth | null;

  constructor(config: RestApiConfig) {
    this.basePath = config.basePath || "";
    this.auth = config.enableAuth && config.apiKey
      ? new ApiKeyAuth(config.apiKey, config.enableAuth)
      : null;
  }

  /** Register a route. */
  route(method: string, path: string, handler: RouteHandler, requiresAuth = true): void {
    this.routes.push({ method, path, handler, requiresAuth });
  }

  /** Handle an HTTP request. */
  async handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.slice(this.basePath.length);

    // Find matching route
    const route = this.routes.find((r) => {
      if (r.method !== request.method) return false;
      return this.matchPath(r.path, path);
    });

    if (!route) {
      return Response.json(
        { error: "Not Found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Check authentication
    if (route.requiresAuth && this.auth && !this.auth.authorize(request)) {
      return this.auth.unauthorizedResponse();
    }

    // Extract path parameters
    const params = this.extractParams(route.path, path);

    try {
      return await route.handler(request, params);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return Response.json(
        { error: message, code: "INTERNAL_ERROR" },
        { status: 500 },
      );
    }
  }

  /** Match a route path against a request path. */
  private matchPath(routePath: string, requestPath: string): boolean {
    const routeParts = routePath.split("/").filter(Boolean);
    const requestParts = requestPath.split("/").filter(Boolean);

    if (routeParts.length !== requestParts.length) return false;

    return routeParts.every((part, i) => {
      if (part.startsWith(":")) return true; // Parameter
      return part === requestParts[i];
    });
  }

  /** Extract path parameters. */
  private extractParams(routePath: string, requestPath: string): Record<string, string> {
    const params: Record<string, string> = {};
    const routeParts = routePath.split("/").filter(Boolean);
    const requestParts = requestPath.split("/").filter(Boolean);

    routeParts.forEach((part, i) => {
      if (part.startsWith(":")) {
        params[part.slice(1)] = requestParts[i];
      }
    });

    return params;
  }
}

// ============================================================================
// REST API Projection Implementation
// ============================================================================

/**
 * REST API projection that provides HTTP endpoints for programmatic access.
 */
export class RestApiProjection {
  private router: RestApiRouter;
  private sessionManager: ISessionManager;
  private eventStore: IEventStore;

  constructor(
    sessionManager: ISessionManager,
    eventStore: IEventStore,
    config: RestApiConfig,
  ) {
    this.sessionManager = sessionManager;
    this.eventStore = eventStore;
    this.router = new RestApiRouter(config);
    this.registerRoutes();
  }

  /** Handle an HTTP request. */
  async handleRequest(request: Request): Promise<Response> {
    return this.router.handle(request);
  }

  private registerRoutes(): void {
    // Session CRUD
    this.router.route("GET", "/api/sessions", this.listSessions.bind(this));
    this.router.route("POST", "/api/sessions", this.createSession.bind(this));
    this.router.route("GET", "/api/sessions/:id", this.getSession.bind(this));
    this.router.route("DELETE", "/api/sessions/:id", this.deleteSession.bind(this));

    // Events
    this.router.route("GET", "/api/sessions/:id/events", this.listEvents.bind(this));
    this.router.route("GET", "/api/sessions/:id/events/:seq", this.getEvent.bind(this));

    // Messages
    this.router.route("POST", "/api/sessions/:id/messages", this.sendMessage.bind(this));
  }

  /** List all sessions. */
  private listSessions(_request: Request, _params: Record<string, string>): Response {
    const sessions = this.sessionManager.getSessions();
    const response: SessionResponse[] = sessions.map((s) => ({
      id: s.id,
      state: s.state,
      created_at: s.created_at,
      updated_at: s.updated_at,
      description: s.description,
      event_count: this.eventStore.getEvents(s.id).length,
      last_event: this.eventStore.getLastEvent(s.id),
    }));
    return Response.json(response);
  }

  /** Create a new session. */
  private async createSession(request: Request, _params: Record<string, string>): Promise<Response> {
    try {
      const body = await request.json().catch(() => ({}));
      const session = this.sessionManager.createSession({
        description: body.description || undefined,
        config: body.config || undefined,
      });
      const response: SessionResponse = {
        id: session.id,
        state: session.state,
        created_at: session.created_at,
        updated_at: session.updated_at,
        description: session.description,
        event_count: 0,
      };
      return Response.json(response, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create session";
      return Response.json({ error: message, code: "CREATE_FAILED" }, { status: 400 });
    }
  }

  /** Get a specific session. */
  private getSession(_request: Request, params: Record<string, string>): Response {
    const session = this.sessionManager.getSession(params.id);
    if (!session) {
      return Response.json({ error: "Session not found", code: "NOT_FOUND" }, { status: 404 });
    }
    const response: SessionResponse = {
      id: session.id,
      state: session.state,
      created_at: session.created_at,
      updated_at: session.updated_at,
      description: session.description,
      event_count: this.eventStore.getEvents(session.id).length,
      last_event: this.eventStore.getLastEvent(session.id),
    };
    return Response.json(response);
  }

  /** Delete a session. */
  private deleteSession(_request: Request, params: Record<string, string>): Response {
    const session = this.sessionManager.getSession(params.id);
    if (!session) {
      return Response.json({ error: "Session not found", code: "NOT_FOUND" }, { status: 404 });
    }
    try {
      this.sessionManager.cancelSession(params.id);
      return new Response(null, { status: 204 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete session";
      return Response.json({ error: message, code: "DELETE_FAILED" }, { status: 400 });
    }
  }

  /** List events for a session with pagination. */
  private listEvents(request: Request, params: Record<string, string>): Response {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    if (!this.eventStore.hasSession(params.id)) {
      return Response.json({ error: "Session not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const allEvents = this.eventStore.getEvents(params.id);
    const paginatedEvents = allEvents.slice(offset, offset + limit);

    const response: EventListResponse = {
      events: paginatedEvents,
      total: allEvents.length,
      limit,
      offset,
    };
    return Response.json(response);
  }

  /** Get a specific event by sequence number. */
  private getEvent(_request: Request, params: Record<string, string>): Response {
    if (!this.eventStore.hasSession(params.id)) {
      return Response.json({ error: "Session not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const seq = parseInt(params.seq, 10);
    const events = this.eventStore.getEvents(params.id);
    const event = events.find((e) => e.sequence_number === seq);

    if (!event) {
      return Response.json({ error: "Event not found", code: "NOT_FOUND" }, { status: 404 });
    }
    return Response.json(event);
  }

  /** Send a message to a session. */
  private async sendMessage(request: Request, params: Record<string, string>): Promise<Response> {
    if (!this.eventStore.hasSession(params.id)) {
      return Response.json({ error: "Session not found", code: "NOT_FOUND" }, { status: 404 });
    }

    try {
      const body: MessageRequest = await request.json();
      if (!body.message) {
        return Response.json({ error: "Message is required", code: "INVALID_REQUEST" }, { status: 400 });
      }

      // Emit a user input event
      const userEvent: BaseEvent = {
        event_id: crypto.randomUUID(),
        session_id: params.id,
        sequence_number: this.eventStore.getEvents(params.id).length + 1,
        event_type: EventTypes.UI_USER_INPUT,
        timestamp: new Date().toISOString(),
        schema_version: 1,
        payload: { message: body.message },
        metadata: { source: "rest-api" },
      };
      this.eventStore.store(userEvent);

      if (body.async) {
        const response: MessageResponse = {
          id: userEvent.event_id,
          status: "accepted",
          polling_url: `/api/sessions/${params.id}/events?from=${userEvent.sequence_number}`,
        };
        return Response.json(response, { status: 202 });
      }

      // Sync response - return the event
      const response: MessageResponse = {
        id: userEvent.event_id,
        status: "completed",
        events: [userEvent],
      };
      return Response.json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message";
      return Response.json({ error: message, code: "MESSAGE_FAILED" }, { status: 400 });
    }
  }
}