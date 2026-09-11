/**
 * Kayak-lab harness entry point.
 *
 * Initializes harness components (EventStream, SessionManager, Capabilities,
 * EventStore, ProjectionProtocol) and starts HTTP/WebSocket server.
 *
 * Usage:
 *   deno run -A src/main.ts --no-web --port 9001    # Headless mode
 *   deno run -A src/main.ts --port 9001              # With embedded UI (default)
 */

import { EventStream } from "./core/event-stream.ts";
import { SessionManager } from "./core/session-manager.ts";
import { CapabilityRegistry } from "./capabilities/capability.ts";
import { GitCapability } from "./capabilities/git.ts";
import { ShellCapability } from "./capabilities/shell.ts";
import { EventStore, EventStoreBridge } from "./store/event-store.ts";
import { ProjectionProtocol } from "./projection/protocol.ts";
import { loadConfig, DEFAULT_CONFIG } from "./core/config.ts";
import { SessionError } from "./core/session-manager.ts";

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CliArgs {
  web: boolean;
  port: number;
  configDir?: string;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    web: true,
    port: parseInt(Deno.env.get("PORT") ?? "9000", 10),
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--no-web") {
      result.web = false;
    } else if (arg === "--web") {
      result.web = true;
    } else if (arg === "--port" && i + 1 < args.length) {
      result.port = parseInt(args[++i], 10);
    } else if (arg === "--config" && i + 1 < args.length) {
      result.configDir = args[++i];
    }
  }

  return result;
}

// ============================================================================
// Harness Initialization
// ============================================================================

interface HarnessComponents {
  eventStream: EventStream;
  sessionManager: SessionManager;
  capabilityRegistry: CapabilityRegistry;
  eventStore: EventStore;
  eventStoreBridge: EventStoreBridge;
  projectionProtocol: ProjectionProtocol;
}

async function initializeHarness(configDir?: string): Promise<HarnessComponents> {
  // Load configuration
  const config = configDir
    ? await loadConfig(configDir)
    : DEFAULT_CONFIG;

  // Initialize core components
  const eventStream = new EventStream();
  const sessionManager = new SessionManager(eventStream);

  // Initialize capabilities
  const capabilityRegistry = new CapabilityRegistry();

  if (config.capabilities.git.enabled) {
    capabilityRegistry.register(new GitCapability());
  }
  if (config.capabilities.shell.enabled) {
    capabilityRegistry.register(new ShellCapability());
  }

  // Initialize event store and bridge
  const eventStore = new EventStore();
  const eventStoreBridge = new EventStoreBridge(eventStream, eventStore);

  // Initialize projection protocol
  const projectionProtocol = new ProjectionProtocol(eventStream);

  return {
    eventStream,
    sessionManager,
    capabilityRegistry,
    eventStore,
    eventStoreBridge,
    projectionProtocol,
  };
}

// ============================================================================
// HTTP Server
// ============================================================================

function createRouter(components: HarnessComponents) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for development
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // API Routes
    if (path === "/api/sessions" && request.method === "GET") {
      return handleGetSessions(components, corsHeaders);
    }

    if (path === "/api/sessions" && request.method === "POST") {
      return handleCreateSession(request, components, corsHeaders);
    }

    if (
      path.startsWith("/api/sessions/") && request.method === "PATCH" &&
      !path.endsWith("/events")
    ) {
      const segments = path.split("/");
      const sessionId = segments[3];
      return handlePatchSession(request, sessionId, components, corsHeaders);
    }

    if (path.startsWith("/api/sessions/") && path.endsWith("/events")) {
      const segments = path.split("/");
      const sessionId = segments[3];
      return handleGetSessionEvents(components, sessionId, url, corsHeaders);
    }

    if (path.startsWith("/api/sessions/")) {
      const segments = path.split("/");
      const sessionId = segments[3];
      return handleGetSession(components, sessionId, corsHeaders);
    }

    if (path === "/api/capabilities") {
      return handleGetCapabilities(components, corsHeaders);
    }

    if (path === "/api/health") {
      return handleGetHealth(components, corsHeaders);
    }

    // 404
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  };
}

// ============================================================================
// API Handlers
// ============================================================================

function handleGetSessions(
  components: HarnessComponents,
  headers: Record<string, string>,
): Response {
  const sessions = components.sessionManager.getSessions();
  const sessionsWithCounts = sessions.map((session) => ({
    ...session,
    event_count: components.eventStream.getEvents(session.id).length,
  }));

  return Response.json(sessionsWithCounts, { headers });
}

function handleGetSession(
  components: HarnessComponents,
  sessionId: string,
  headers: Record<string, string>,
): Response {
  const session = components.sessionManager.getSession(sessionId);
  if (!session) {
    return Response.json({ error: "Session not found" }, {
      status: 404,
      headers,
    });
  }

  const events = components.eventStream.getEvents(sessionId);
  return Response.json({ ...session, events }, { headers });
}

function handleGetSessionEvents(
  components: HarnessComponents,
  sessionId: string,
  url: URL,
  headers: Record<string, string>,
): Response {
  const typeFilter = url.searchParams.get("type");
  const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);

  let events = components.eventStream.getEvents(sessionId);

  // Apply type filter
  if (typeFilter) {
    events = events.filter((e) => e.event_type === typeFilter);
  }

  // Apply limit
  events = events.slice(-limit);

  return Response.json(events, { headers });
}

async function handleCreateSession(
  request: Request,
  components: HarnessComponents,
  headers: Record<string, string>,
): Promise<Response> {
  try {
    const body = await request.json() as { description?: string };
    const session = components.sessionManager.createSession({
      description: body.description,
    });
    return Response.json(session, { status: 201, headers });
  } catch {
    return Response.json({ error: "Invalid JSON body" }, {
      status: 400,
      headers,
    });
  }
}

async function handlePatchSession(
  request: Request,
  sessionId: string,
  components: HarnessComponents,
  headers: Record<string, string>,
): Promise<Response> {
  try {
    const body = await request.json() as { action: string; error?: string };

    if (!sessionId) {
      return Response.json({ error: "Session ID required" }, {
        status: 400,
        headers,
      });
    }

    let session;
    switch (body.action) {
      case "pause":
        session = components.sessionManager.pauseSession(sessionId);
        break;
      case "resume":
        session = components.sessionManager.resumeSession(sessionId);
        break;
      case "complete":
        session = components.sessionManager.completeSession(sessionId);
        break;
      case "fail":
        session = components.sessionManager.failSession(sessionId, body.error);
        break;
      case "cancel":
        session = components.sessionManager.cancelSession(sessionId);
        break;
      default:
        return Response.json(
          { error: `Unknown action: ${body.action}` },
          { status: 400, headers },
        );
    }
    return Response.json(session, { headers });
  } catch (error) {
    const status = error instanceof SessionError &&
        error.code === "SESSION_NOT_FOUND"
      ? 404
      : 400;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status, headers },
    );
  }
}

function handleGetCapabilities(
  components: HarnessComponents,
  headers: Record<string, string>,
): Response {
  const capabilities = components.capabilityRegistry.getAll().map((cap) => ({
    name: cap.definition.name,
    version: cap.definition.version,
    initialized: components.capabilityRegistry.isInitialized(cap.definition.name),
  }));

  return Response.json(capabilities, { headers });
}

function handleGetHealth(
  components: HarnessComponents,
  headers: Record<string, string>,
): Response {
  return Response.json({
    status: "ok",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    session_count: components.sessionManager.getSessions().length,
    event_count: components.eventStream.totalEvents,
  }, { headers });
}

// ============================================================================
// WebSocket Server
// ============================================================================

interface WebSocketClient {
  id: string;
  socket: WebSocket;
  sessionId?: string;
  eventTypes?: string[];
  lastPong: number;
  lastSequence: number;
  unsubscribe?: () => void;
}

const wsClients = new Map<string, WebSocketClient>();
let clientIdCounter = 0;

function handleWebSocketUpgrade(
  request: Request,
  components: HarnessComponents,
): Response {
  const { socket, response } = Deno.upgradeWebSocket(request);

  const clientId = `client-${++clientIdCounter}`;
  const client: WebSocketClient = {
    id: clientId,
    socket,
    lastPong: Date.now(),
    lastSequence: 0,
  };

  socket.onopen = () => {
    console.log(`[WS] Client connected: ${clientId}`);
    wsClients.set(clientId, client);

    // Send welcome message
    socket.send(JSON.stringify({
      type: "welcome",
      version: "1.0.0",
      capabilities: ["subscribe", "reconnect"],
      lastSequence: client.lastSequence,
    }));

    // Subscribe to event stream and store unsubscribe function
    client.unsubscribe = components.eventStream.onAppend((event) => {
      // Check if client is interested in this event
      if (client.sessionId && event.session_id !== client.sessionId) {
        return;
      }
      if (client.eventTypes && !client.eventTypes.includes(event.event_type)) {
        return;
      }

      // Send event to client
      try {
        socket.send(JSON.stringify({ type: "event", event }));
        // Update last sequence after successful send
        if (event.sequence_number > client.lastSequence) {
          client.lastSequence = event.sequence_number;
        }
      } catch {
        // Client disconnected
      }
    });
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === "subscribe") {
        client.sessionId = msg.session_id;
        client.eventTypes = msg.event_types;
        console.log(`[WS] Client ${clientId} subscribed:`, {
          sessionId: client.sessionId,
          eventTypes: client.eventTypes,
        });
      } else if (msg.type === "unsubscribe") {
        client.sessionId = undefined;
        client.eventTypes = undefined;
      } else if (msg.type === "pong") {
        client.lastPong = Date.now();
      } else if (msg.type === "from_sequence") {
        // Reconnection: replay events from the given sequence
        const fromSequence = msg.from_sequence as number;
        console.log(`[WS] Client ${clientId} reconnecting from sequence ${fromSequence}`);

        // Only replay if client has a session subscription
        if (client.sessionId) {
          let events = components.eventStream.getEvents(client.sessionId);

          // Apply type filter if subscribed
          if (client.eventTypes) {
            events = events.filter((e) => client.eventTypes!.includes(e.event_type));
          }

          // Filter events after the given sequence
          const missedEvents = events.filter((e) => e.sequence_number > fromSequence);

          // Send missed events
          for (const missedEvent of missedEvents) {
            try {
              socket.send(JSON.stringify({ type: "event", event: missedEvent }));
              // Update last sequence
              if (missedEvent.sequence_number > client.lastSequence) {
                client.lastSequence = missedEvent.sequence_number;
              }
            } catch {
              // Client disconnected during replay
              break;
            }
          }

          console.log(`[WS] Replayed ${missedEvents.length} events for client ${clientId}`);
        } else {
          console.log(`[WS] Client ${clientId} has no session subscription, skipping replay`);
        }
      }
    } catch {
      // Ignore malformed messages
    }
  };

  socket.onclose = () => {
    console.log(`[WS] Client disconnected: ${clientId}`);
    // Unsubscribe from event stream to prevent memory leak
    client.unsubscribe?.();
    wsClients.delete(clientId);
  };

  socket.onerror = (error) => {
    console.error(`[WS] Client error: ${clientId}`, error);
    // Unsubscribe from event stream to prevent memory leak
    client.unsubscribe?.();
    wsClients.delete(clientId);
  };

  return response;
}

// Heartbeat timer - ping idle clients every 30s
setInterval(() => {
  const now = Date.now();
  for (const [id, client] of wsClients) {
    if (now - client.lastPong > 35000) {
      // Client hasn't ponged in 35s, disconnect
      console.log(`[WS] Client ${id} timed out`);
      client.socket.close();
      wsClients.delete(id);
    } else {
      // Send ping
      try {
        client.socket.send(JSON.stringify({ type: "ping" }));
      } catch {
        wsClients.delete(id);
      }
    }
  }
}, 30000);

// ============================================================================
// Main
// ============================================================================

const startTime = Date.now();

async function main() {
  const args = parseArgs(Deno.args);

  console.log("Starting kayak-lab harness...");
  console.log(`  Port: ${args.port}`);
  console.log(`  Mode: ${args.web ? "embedded" : "headless"}`);

  // Initialize harness components
  const components = await initializeHarness(args.configDir);

  // Connect event store bridge
  components.eventStoreBridge.connect((_event) => {
    // Events are now auto-propagated to EventStore
  });

  console.log("  EventStream: initialized");
  console.log("  SessionManager: initialized");
  console.log(`  Capabilities: ${components.capabilityRegistry.getAll().length} registered`);

  // Start HTTP server
  const router = createRouter(components);

  // Store harness URLs in environment for Fresh routes to access
  Deno.env.set("HARNESS_URLS", JSON.stringify([`localhost:${args.port}`]));

  // Cache Fresh handler for embedded mode
  let freshHandler: ((request: Request) => Response | Promise<Response>) | null = null;

  Deno.serve({
    port: args.port,
    hostname: "0.0.0.0",
  }, async (request) => {
    const url = new URL(request.url);

    // Check for WebSocket upgrade
    if (url.pathname === "/ws/events" && request.headers.get("upgrade") === "websocket") {
      return handleWebSocketUpgrade(request, components);
    }

    // API routes
    if (url.pathname.startsWith("/api/")) {
      return router(request);
    }

    // If web mode is enabled, serve Fresh UI for non-API routes
    // Dynamic import: Fresh is optional and may not be available in all environments
    if (args.web) {
      try {
        // Cache handler after first import
        if (!freshHandler) {
          const { createFreshHandler } = await import("../web/main.ts");
          freshHandler = createFreshHandler();
        }
        return freshHandler(request);
      } catch (error) {
        console.error("Failed to load Fresh UI:", error);
        return new Response("Web UI not available", { status: 503 });
      }
    }

    return router(request);
  });

  console.log(`\nHarness running on http://localhost:${args.port}`);
  console.log(`  API: http://localhost:${args.port}/api/`);
  console.log(`  WebSocket: ws://localhost:${args.port}/ws/events`);
  if (args.web) {
    console.log(`  Web UI: http://localhost:${args.port}/`);
  }
  console.log("\nPress Ctrl+C to stop.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  Deno.exit(1);
});
