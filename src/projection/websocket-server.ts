/**
 * WebSocket projection server.
 *
 * Provides real-time event delivery to connected clients via WebSocket.
 * Supports subscription management, gap recovery, and backpressure.
 */

import type { BaseEvent } from "../types/events.ts";
import type { IEventStore } from "../store/event-store.ts";
import { BoundedQueue, type BoundedQueueConfig } from "../core/bounded-queue.ts";

// ============================================================================
// Types
// ============================================================================

/** Client subscription state. */
export interface Subscription {
  sessionId?: string;
  eventTypes?: string[];
  active: boolean;
}

/** Per-session delivery state for a client. */
export interface ClientSessionState {
  /** Next expected sequence number for in-order delivery. */
  nextSequence: number;
  /** Buffered events waiting for the gap to fill. */
  pendingEvents: BaseEvent[];
}

/** Client connection state. */
export interface ClientState {
  id: string;
  socket: WebSocket;
  subscription: Subscription;
  /** Timestamp of last received pong (or initial connection). */
  lastPong: number;
  /** Timestamp of last sent ping. Null if no ping outstanding. */
  lastPingSent: number | null;
  /** Per-session delivery state for ordering and backpressure. */
  sessionState: Map<string, ClientSessionState>;
  /** Bounded send queue with overflow policy. */
  sendQueue: BoundedQueue<ServerMessage>;
}

/** Welcome message. */
export interface WelcomeMessage {
  type: "welcome";
  version: string;
  capabilities: string[];
}

/** Subscription message. */
export interface SubscribeMessage {
  type: "subscribe";
  session_id?: string;
  event_types?: string[];
}

/** Unsubscribe message. */
export interface UnsubscribeMessage {
  type: "unsubscribe";
}

/** Reconnect message. */
export interface ReconnectMessage {
  type: "reconnect";
  session_id: string;
  last_event_id: string;
}

/** Server message types. */
export type ServerMessage =
  | WelcomeMessage
  | { type: "event"; event: BaseEvent }
  | { type: "error"; code: string; message: string }
  | { type: "ping" }
  | { type: "pong" }
  | { type: "close"; reason: string };

/** Client message types. */
export type ClientMessage =
  | SubscribeMessage
  | UnsubscribeMessage
  | ReconnectMessage
  | { type: "ping" }
  | { type: "pong" };

/** Backpressure configuration for WebSocket event delivery. */
export interface BackpressureConfig {
  /** Maximum events queued per client. */
  maxSize: number;
  /** Overflow policy when queue is full. */
  policy: "drop-oldest" | "drop-newest" | "reject";
}

/** Server configuration. */
export interface WebSocketServerConfig {
  port: number;
  heartbeatIntervalMs?: number;
  pongTimeoutMs?: number;
  bufferSize?: number;
  /** Backpressure configuration for client send queues. */
  backpressure?: BackpressureConfig;
}

// ============================================================================
// Ring Buffer for Gap Recovery
// ============================================================================

/**
 * Simple ring buffer for storing recent events per session.
 */
class RingBuffer<T> {
  private buffer: T[] = [];
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  push(item: T): void {
    this.buffer.push(item);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  /**
   * Get items after a given index.
   */
  getAfter(index: number): T[] {
    return this.buffer.slice(index);
  }

  /**
   * Find index of item by predicate.
   */
  findIndex(predicate: (item: T) => boolean): number {
    return this.buffer.findIndex(predicate);
  }

  get size(): number {
    return this.buffer.length;
  }
}

// ============================================================================
// WebSocket Projection Server
// ============================================================================

/**
 * WebSocket server for real-time event projection.
 */
export class WebSocketProjectionServer {
  private config: WebSocketServerConfig;
  private eventStore: IEventStore;
  private clients = new Map<string, ClientState>();
  private eventBuffers = new Map<string, RingBuffer<BaseEvent>>();
  private server?: Deno.HttpServer;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private clientIdCounter = 0;

  constructor(eventStore: IEventStore, config: WebSocketServerConfig) {
    this.eventStore = eventStore;
    this.config = {
      heartbeatIntervalMs: 30_000,
      pongTimeoutMs: 15_000,
      bufferSize: 1000,
      backpressure: { maxSize: 10_000, policy: "drop-oldest" },
      ...config,
    };
  }

  /**
   * Start the WebSocket server.
   */
  async start(): Promise<void> {
    this.server = Deno.serve(
      { port: this.config.port },
      (req) => this.handleRequest(req),
    );

    // Start heartbeat timer
    this.heartbeatTimer = setInterval(
      () => this.sendHeartbeats(),
      this.config.heartbeatIntervalMs,
    );

    await this.server.finished;
  }

  /**
   * Gracefully shut down the server.
   */
  async shutdown(): Promise<void> {
    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      client.socket.close(1000, "Server shutting down");
    }
    this.clients.clear();

    // Shutdown HTTP server
    if (this.server) {
      this.server.shutdown();
    }
  }

  /**
   * Handle HTTP requests (WebSocket upgrade).
   */
  private handleRequest(req: Request): Response {
    if (req.headers.get("upgrade") === "websocket") {
      return this.handleWebSocketUpgrade(req);
    }

    return new Response("WebSocket Projection Server", { status: 200 });
  }

  /**
   * Handle WebSocket upgrade request.
   */
  private handleWebSocketUpgrade(req: Request): Response {
    const { socket, response } = Deno.upgradeWebSocket(req);

    const clientId = `client-${++this.clientIdCounter}`;
    const bp = this.config.backpressure!;
    const queueConfig: BoundedQueueConfig = {
      maxSize: bp.maxSize,
      policy: bp.policy === "reject" ? "reject" : bp.policy === "drop-newest" ? "drop-newest" : "drop-oldest",
    };

    const clientState: ClientState = {
      id: clientId,
      socket,
      subscription: { active: false },
      lastPong: Date.now(),
      lastPingSent: null,
      sessionState: new Map(),
      sendQueue: new BoundedQueue(queueConfig),
    };

    this.clients.set(clientId, clientState);

    socket.onopen = () => {
      this.sendWelcome(clientState);
    };

    socket.onmessage = (event) => {
      this.handleMessage(clientId, event.data);
    };

    socket.onclose = () => {
      this.clients.delete(clientId);
    };

    socket.onerror = () => {
      this.clients.delete(clientId);
    };

    return response;
  }

  /**
   * Send welcome message to newly connected client.
   */
  private sendWelcome(client: ClientState): void {
    const welcome: WelcomeMessage = {
      type: "welcome",
      version: "1.0.0",
      capabilities: ["subscribe", "unsubscribe", "reconnect"],
    };
    this.sendToClient(client, welcome);
  }

  /**
   * Handle incoming client message.
   */
  private handleMessage(clientId: string, data: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const msg = JSON.parse(data) as ClientMessage;

      switch (msg.type) {
        case "subscribe":
          this.handleSubscribe(client, msg);
          break;
        case "unsubscribe":
          this.handleUnsubscribe(client);
          break;
        case "reconnect":
          this.handleReconnect(client, msg);
          break;
        case "pong":
          client.lastPong = Date.now();
          client.lastPingSent = null;
          this.flushClient(client);
          break;
      }
    } catch {
      this.sendError(client, "INVALID_MESSAGE", "Invalid message format");
    }
  }

  /**
   * Handle subscribe message.
   */
  private handleSubscribe(client: ClientState, msg: SubscribeMessage): void {
    // Clear old session state if switching sessions
    if (
      client.subscription.sessionId &&
      client.subscription.sessionId !== msg.session_id
    ) {
      client.sessionState.delete(client.subscription.sessionId);
    }

    client.subscription = {
      sessionId: msg.session_id,
      eventTypes: msg.event_types,
      active: true,
    };

    // Create event buffer for this session
    if (msg.session_id && !this.eventBuffers.has(msg.session_id)) {
      this.eventBuffers.set(
        msg.session_id,
        new RingBuffer(this.config.bufferSize!),
      );
    }

    // Initialize per-session delivery state
    if (msg.session_id) {
      if (!client.sessionState.has(msg.session_id)) {
        client.sessionState.set(msg.session_id, {
          nextSequence: 1,
          pendingEvents: [],
        });
      }
    }
  }

  /**
   * Handle unsubscribe message.
   */
  private handleUnsubscribe(client: ClientState): void {
    client.subscription.active = false;
  }

  /**
   * Handle reconnect message with gap recovery.
   */
  private handleReconnect(client: ClientState, msg: ReconnectMessage): void {
    const buffer = this.eventBuffers.get(msg.session_id);

    if (buffer) {
      // Find the last event index
      const idx = buffer.findIndex(
        (e) => e.event_id === msg.last_event_id,
      );

      if (idx >= 0) {
        // Replay events from buffer
        const events = buffer.getAfter(idx + 1);
        for (const event of events) {
          this.sendToClient(client, { type: "event", event });
        }
        return;
      }
    }

    // Try to replay from event store
    const storeEvents = this.eventStore.getEvents(msg.session_id);
    const lastIdx = storeEvents.findIndex(
      (e) => e.event_id === msg.last_event_id,
    );

    if (lastIdx >= 0) {
      const events = storeEvents.slice(lastIdx + 1);
      for (const event of events) {
        this.sendToClient(client, { type: "event", event });
      }
    } else {
      this.sendError(client, "GAP_TOO_LARGE", "Could not find last event for replay");
    }
  }

  /**
   * Deliver an event to all subscribed clients.
   * Events are buffered per-client per-session to guarantee sequence order.
   * Slow clients receive events when they catch up (backpressure).
   */
  deliverEvent(event: BaseEvent): void {
    // Store in ring buffer
    const buffer = this.eventBuffers.get(event.session_id);
    if (buffer) {
      buffer.push(event);
    }

    // Fan out to subscribed clients
    for (const client of this.clients.values()) {
      if (!client.subscription.active) continue;

      // Check session filter
      if (
        client.subscription.sessionId &&
        client.subscription.sessionId !== event.session_id
      ) {
        continue;
      }

      // Check event type filter
      if (
        client.subscription.eventTypes &&
        !client.subscription.eventTypes.includes(event.event_type)
      ) {
        continue;
      }

      // Buffer event for in-order delivery
      let session = client.sessionState.get(event.session_id);
      if (!session) {
        session = { nextSequence: 1, pendingEvents: [] };
        client.sessionState.set(event.session_id, session);
      }

      // Binary search insertion point for mostly-in-order events
      const pending = session.pendingEvents;
      let lo = 0, hi = pending.length;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (pending[mid].sequence_number < event.sequence_number) lo = mid + 1;
        else hi = mid;
      }
      pending.splice(lo, 0, event);

      // Flush ready events
      this.flushClientSession(client, event.session_id);
    }
  }

  /**
   * Flush buffered events for a specific session on a client.
   * Delivers events in sequence order, stopping at the first gap.
   */
  private flushClientSession(client: ClientState, sessionId: string): void {
    const session = client.sessionState.get(sessionId);
    if (!session) return;

    while (session.pendingEvents.length > 0) {
      const next = session.pendingEvents[0];
      if (next.sequence_number !== session.nextSequence) break;

      session.pendingEvents.shift();
      this.enqueueEvent(client, next);
      session.nextSequence++;
    }

    this.flushClient(client);
  }

  /**
   * Enqueue an event for a client (backpressure buffer).
   * Uses BoundedQueue with configured overflow policy.
   */
  private enqueueEvent(client: ClientState, event: BaseEvent): void {
    client.sendQueue.push({ type: "event", event });
  }

  /**
   * Flush the send queue for a client.
   * Stops on backpressure (socket buffer full).
   */
  private flushClient(client: ClientState): void {
    while (client.sendQueue.size > 0) {
      if (client.socket.readyState !== WebSocket.OPEN) {
        client.sendQueue.clear();
        return;
      }

      const msg = client.sendQueue.peek();
      if (!msg) break;

      try {
        client.socket.send(JSON.stringify(msg));
        client.sendQueue.shift();
      } catch {
        // Backpressure — socket buffer full, retry on next pong
        return;
      }
    }
  }

  /**
   * Send heartbeat pings to idle clients.
   * - Clients that haven't ponged within pongTimeoutMs are disconnected.
   * - Idle clients (no pong for heartbeatIntervalMs) receive a ping.
   * - Clients with an outstanding ping that didn't pong within pongTimeoutMs are disconnected.
   */
  private sendHeartbeats(): void {
    const now = Date.now();
    const heartbeatMs = this.config.heartbeatIntervalMs!;
    const pongTimeoutMs = this.config.pongTimeoutMs!;

    for (const client of this.clients.values()) {
      // Disconnect if pong timeout exceeded (sent ping but no response)
      if (
        client.lastPingSent !== null &&
        now - client.lastPingSent > pongTimeoutMs
      ) {
        client.socket.close(1001, "Heartbeat timeout");
        this.clients.delete(client.id);
        continue;
      }

      // Send ping if idle and no ping outstanding
      if (client.lastPingSent === null && now - client.lastPong > heartbeatMs) {
        client.lastPingSent = now;
        this.sendToClient(client, { type: "ping" });
      }
    }
  }

  /**
   * Send a message to a client.
   */
  private sendToClient(client: ClientState, msg: ServerMessage): void {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(msg));
    }
  }

  /**
   * Send error message to client.
   */
  private sendError(
    client: ClientState,
    code: string,
    message: string,
  ): void {
    this.sendToClient(client, { type: "error", code, message });
  }

  /**
   * Get connected client count.
   */
  get clientCount(): number {
    return this.clients.size;
  }
}
