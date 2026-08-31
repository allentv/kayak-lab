/**
 * WebSocket projection server.
 *
 * Provides real-time event delivery to connected clients via WebSocket.
 * Supports subscription management, gap recovery, and backpressure.
 */

import type { BaseEvent } from "../types/events.ts";
import type { IEventStore } from "../store/event-store.ts";

// ============================================================================
// Types
// ============================================================================

/** Client subscription state. */
export interface Subscription {
  sessionId?: string;
  eventTypes?: string[];
  active: boolean;
}

/** Client connection state. */
export interface ClientState {
  id: string;
  socket: WebSocket;
  subscription: Subscription;
  lastPing: number;
  connected: boolean;
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

/** Server configuration. */
export interface WebSocketServerConfig {
  port: number;
  heartbeatIntervalMs?: number;
  pongTimeoutMs?: number;
  bufferSize?: number;
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
    const clientState: ClientState = {
      id: clientId,
      socket,
      subscription: { active: false },
      lastPing: Date.now(),
      connected: true,
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
          client.lastPing = Date.now();
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

      this.sendToClient(client, { type: "event", event });
    }
  }

  /**
   * Send heartbeat pings to idle clients.
   */
  private sendHeartbeats(): void {
    const now = Date.now();
    const timeout = this.config.pongTimeoutMs!;

    for (const client of this.clients.values()) {
      if (now - client.lastPing > timeout) {
        // Client hasn't responded — disconnect
        client.socket.close(1001, "Heartbeat timeout");
        this.clients.delete(client.id);
        continue;
      }

      // Send ping
      this.sendToClient(client, { type: "ping" });
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
