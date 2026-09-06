/**
 * Web browser projection.
 *
 * Provides a browser-based interface for agent interactions using
 * WebSocket for real-time event delivery. The projection logic is
 * decoupled from the DOM/UI framework for testability.
 */

import { BaseEvent, EventType } from "../types/events.ts";
import type { SessionState } from "../core/session-manager.ts";

// ============================================================================
// Web Projection Types
// ============================================================================

/** WebSocket connection state. */
export type WebSocketState = "connected" | "disconnected" | "reconnecting";

/** Session list item for the web UI. */
export interface SessionListItem {
  id: string;
  state: SessionState;
  createdAt: string;
  eventCount: number;
  description?: string;
}

/** Event item for the event log. */
export interface EventLogItem {
  sequence: number;
  type: EventType;
  timestamp: string;
  payload: unknown;
  formatted: string;
}

/** User input result. */
export interface UserInputResult {
  success: boolean;
  messageId: string;
  error?: string;
}

/** Event detail for the detail panel. */
export interface EventDetail {
  sequence: number;
  type: EventType;
  timestamp: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Web Projection Interface
// ============================================================================

/**
 * Interface for web projection operations.
 */
export interface IWebProjection {
  /** Load sessions from the REST API. */
  loadSessions(): Promise<SessionListItem[]>;

  /** Create a new session. */
  createSession(initialMessage?: string): Promise<SessionListItem>;

  /** Select a session and start receiving events. */
  selectSession(sessionId: string): void;

  /** Get events for the currently selected session. */
  getEvents(): EventLogItem[];

  /** Send a user message to the selected session. */
  sendMessage(message: string): Promise<UserInputResult>;

  /** Get the detail for a specific event. */
  getEventDetail(sequence: number): EventDetail | undefined;

  /** Subscribe to session list updates. */
  onSessionListChange(listener: (sessions: SessionListItem[]) => void): () => void;

  /** Subscribe to new events. */
  onEvent(listener: (event: BaseEvent) => void): () => void;

  /** Subscribe to connection state changes. */
  onConnectionStateChange(listener: (state: WebSocketState) => void): () => void;

  /** Disconnect and clean up. */
  dispose(): void;
}

// ============================================================================
// REST API Client
// ============================================================================

/** Configuration for the REST API client. */
export interface WebRestApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
}

/**
 * REST API client for web projection.
 */
export class WebRestApiClient {
  private config: WebRestApiConfig;

  constructor(config: WebRestApiConfig) {
    this.config = { timeoutMs: 30_000, ...config };
  }

  /** Fetch sessions from the API. */
  async getSessions(): Promise<SessionListItem[]> {
    const response = await fetch(`${this.config.baseUrl}/api/sessions`, {
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(this.config.timeoutMs!),
    });
    if (!response.ok) throw new Error(`Failed to fetch sessions: ${response.status}`);
    return response.json();
  }

  /** Create a new session. */
  async createSession(initialMessage?: string): Promise<SessionListItem> {
    const response = await fetch(`${this.config.baseUrl}/api/sessions`, {
      method: "POST",
      headers: {
        ...this.getHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ initial_message: initialMessage }),
      signal: AbortSignal.timeout(this.config.timeoutMs!),
    });
    if (!response.ok) throw new Error(`Failed to create session: ${response.status}`);
    return response.json();
  }

  /** Get events for a session. */
  async getEvents(sessionId: string, limit?: number, offset?: number): Promise<BaseEvent[]> {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    const url = `${this.config.baseUrl}/api/sessions/${sessionId}/events?${params}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(this.config.timeoutMs!),
    });
    if (!response.ok) throw new Error(`Failed to fetch events: ${response.status}`);
    return response.json();
  }

  /** Send a message to a session. */
  async sendMessage(sessionId: string, message: string): Promise<UserInputResult> {
    const response = await fetch(`${this.config.baseUrl}/api/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: {
        ...this.getHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(this.config.timeoutMs!),
    });
    if (!response.status.toString().startsWith("2")) {
      return { success: false, messageId: "", error: `Failed: ${response.status}` };
    }
    const data = await response.json();
    return { success: true, messageId: data.id || "", error: undefined };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }
    return headers;
  }
}

// ============================================================================
// WebSocket Client for Web
// ============================================================================

/** WebSocket client configuration for web projection. */
export interface WebWebSocketConfig {
  url: string;
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
}

/**
 * WebSocket client that connects to the harness WebSocket server
 * and feeds events to the web projection.
 */
export class WebWebSocketClient {
  private config: WebWebSocketConfig;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private eventListeners: Array<(event: BaseEvent) => void> = [];
  private stateListeners: Array<(state: WebSocketState) => void> = [];
  private sessionId?: string;

  constructor(config: WebWebSocketConfig) {
    this.config = {
      reconnectIntervalMs: 5000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }

  /** Connect to the WebSocket server. */
  connect(): void {
    this.ws = new WebSocket(this.config.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.notifyState("connected");
      if (this.sessionId) {
        this.send({ type: "subscribe", session_id: this.sessionId });
      }
    };

    this.ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "event") {
          this.eventListeners.forEach((l) => l(data.event));
        } else if (data.type === "error") {
          // Server error messages are reported via state listeners
          this.stateListeners.forEach((l) => l("disconnected"));
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.notifyState("disconnected");
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.notifyState("disconnected");
    };
  }

  /** Subscribe to a specific session. */
  subscribe(sessionId: string): void {
    this.sessionId = sessionId;
    this.send({ type: "subscribe", session_id: sessionId });
  }

  /** Unsubscribe from current subscription. */
  unsubscribe(): void {
    this.sessionId = undefined;
    this.send({ type: "unsubscribe" });
  }

  /** Register an event listener. */
  onEvent(listener: (event: BaseEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  /** Register a connection state listener. */
  onStateChange(listener: (state: WebSocketState) => void): () => void {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  /** Disconnect and clean up. */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyState("disconnected");
  }

  private send(msg: { type: string; session_id?: string; event_types?: string[] }): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      return;
    }
    this.reconnectAttempts++;
    this.notifyState("reconnecting");
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.config.reconnectIntervalMs! * Math.min(this.reconnectAttempts, 5));
  }

  private notifyState(state: WebSocketState): void {
    this.stateListeners.forEach((l) => l(state));
  }
}

// ============================================================================
// Event Formatter for Web
// ============================================================================

/**
 * Formats events for display in the web UI.
 */
export class WebEventFormatter {
  format(event: BaseEvent): string {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    const type = event.event_type;
    return `[${timestamp}] ${type}: ${JSON.stringify(event.payload)}`;
  }

  formatDetail(event: BaseEvent): EventDetail {
    return {
      sequence: event.sequence_number,
      type: event.event_type,
      timestamp: event.timestamp,
      payload: event.payload,
      metadata: event.metadata as Record<string, unknown>,
    };
  }
}

// ============================================================================
// Web Projection Implementation
// ============================================================================

/**
 * Web projection that renders agent events in a browser-based UI.
 */
export class WebProjection implements IWebProjection {
  private restClient: WebRestApiClient;
  private wsClient: WebWebSocketClient;
  private eventFormatter: WebEventFormatter;
  private events: BaseEvent[] = [];
  private selectedSessionId?: string;
  private sessionListListeners: Array<(sessions: SessionListItem[]) => void> = [];
  private eventListeners: Array<(event: BaseEvent) => void> = [];
  private stateListeners: Array<(state: WebSocketState) => void> = [];
  private currentSessions: SessionListItem[] = [];
  private started = false;

  constructor(restClient: WebRestApiClient, wsClient: WebWebSocketClient) {
    this.restClient = restClient;
    this.wsClient = wsClient;
    this.eventFormatter = new WebEventFormatter();
  }

  /** Load sessions from the REST API. */
  async loadSessions(): Promise<SessionListItem[]> {
    const sessions = await this.restClient.getSessions();
    this.currentSessions = sessions;
    this.notifySessionList();
    return sessions;
  }

  /** Create a new session. */
  async createSession(initialMessage?: string): Promise<SessionListItem> {
    const session = await this.restClient.createSession(initialMessage);
    await this.loadSessions();
    return session;
  }

  /** Select a session and start receiving events. */
  selectSession(sessionId: string): void {
    this.selectedSessionId = sessionId;
    this.events = [];
    this.wsClient.subscribe(sessionId);
  }

  /** Get events for the currently selected session. */
  getEvents(): EventLogItem[] {
    return this.events.map((event) => ({
      sequence: event.sequence_number,
      type: event.event_type,
      timestamp: event.timestamp,
      payload: event.payload,
      formatted: this.eventFormatter.format(event),
    }));
  }

  /** Send a user message to the selected session. */
  async sendMessage(message: string): Promise<UserInputResult> {
    if (!this.selectedSessionId) {
      return { success: false, messageId: "", error: "No session selected" };
    }
    return this.restClient.sendMessage(this.selectedSessionId, message);
  }

  /** Get the detail for a specific event. */
  getEventDetail(sequence: number): EventDetail | undefined {
    const event = this.events.find((e) => e.sequence_number === sequence);
    return event ? this.eventFormatter.formatDetail(event) : undefined;
  }

  /** Subscribe to session list updates. */
  onSessionListChange(listener: (sessions: SessionListItem[]) => void): () => void {
    this.sessionListListeners.push(listener);
    return () => {
      this.sessionListListeners = this.sessionListListeners.filter((l) => l !== listener);
    };
  }

  /** Subscribe to new events. */
  onEvent(listener: (event: BaseEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  /** Subscribe to connection state changes. */
  onConnectionStateChange(listener: (state: WebSocketState) => void): () => void {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  /** Disconnect and clean up. */
  dispose(): void {
    this.wsClient.disconnect();
    this.sessionListListeners = [];
    this.eventListeners = [];
    this.stateListeners = [];
  }

  /** Wire up WebSocket events to the projection. */
  start(): void {
    if (this.started) return;
    this.started = true;

    this.wsClient.onEvent((event) => {
      this.events.push(event);
      this.eventListeners.forEach((l) => l(event));
    });

    this.wsClient.onStateChange((state) => {
      this.stateListeners.forEach((l) => l(state));
    });

    this.wsClient.connect();
  }

  private notifySessionList(): void {
    this.sessionListListeners.forEach((l) => l(this.currentSessions));
  }
}

// ============================================================================
// Web Projection Factory
// ============================================================================

/** Return type for the web projection factory. */
export interface WebProjectionBundle {
  projection: WebProjection;
  restClient: WebRestApiClient;
  wsClient: WebWebSocketClient;
}

/**
 * Creates a fully wired web projection with REST API and WebSocket clients.
 */
export function createWebProjection(
  restConfig: WebRestApiConfig,
  wsConfig: WebWebSocketConfig,
): WebProjectionBundle {
  const restClient = new WebRestApiClient(restConfig);
  const wsClient = new WebWebSocketClient(wsConfig);
  const projection = new WebProjection(restClient, wsClient);
  return { projection, restClient, wsClient };
}