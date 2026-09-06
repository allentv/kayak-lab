/**
 * Harness Connection Manager
 *
 * Connects to multiple harness instances via WebSocket
 * and tracks their connection status.
 */

export interface HarnessConnection {
  url: string;
  ws: WebSocket | null;
  status: "connected" | "disconnected" | "connecting";
  lastEvent: unknown | null;
  reconnectAttempts: number;
}

export interface HarnessState {
  harnesses: Map<string, HarnessConnection>;
  listeners: Set<(harnesses: Map<string, HarnessConnection>) => void>;
}

const state: HarnessState = {
  harnesses: new Map(),
  listeners: new Set(),
};

/**
 * Connect to a harness instance.
 */
export function connectToHarness(url: string): HarnessConnection {
  if (state.harnesses.has(url)) {
    return state.harnesses.get(url)!;
  }

  const connection: HarnessConnection = {
    url,
    ws: null,
    status: "disconnected",
    lastEvent: null,
    reconnectAttempts: 0,
  };

  state.harnesses.set(url, connection);
  connectWebSocket(connection);

  return connection;
}

/**
 * Connect WebSocket to a harness.
 */
function connectWebSocket(connection: HarnessConnection): void {
  const wsUrl = connection.url.replace(/^http/, "ws");
  connection.status = "connecting";
  notifyListeners();

  try {
    const ws = new WebSocket(`${wsUrl}/ws/events`);

    ws.onopen = () => {
      console.log(`[Harness] Connected to ${connection.url}`);
      connection.ws = ws;
      connection.status = "connected";
      connection.reconnectAttempts = 0;
      notifyListeners();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        connection.lastEvent = msg;

        // Forward to aggregation layer
        if (msg.type === "event") {
          handleHarnessEvent(connection.url, msg.event);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      console.log(`[Harness] Disconnected from ${connection.url}`);
      connection.ws = null;
      connection.status = "disconnected";
      notifyListeners();

      // Reconnect with backoff
      scheduleReconnect(connection);
    };

    ws.onerror = (error) => {
      console.error(`[Harness] Error connecting to ${connection.url}:`, error);
      connection.status = "disconnected";
      notifyListeners();
    };
  } catch (error) {
    console.error(`[Harness] Failed to connect to ${connection.url}:`, error);
    connection.status = "disconnected";
    notifyListeners();
    scheduleReconnect(connection);
  }
}

/**
 * Schedule reconnection with exponential backoff.
 */
function scheduleReconnect(connection: HarnessConnection): void {
  connection.reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, connection.reconnectAttempts - 1), 30000);

  console.log(`[Harness] Reconnecting to ${connection.url} in ${delay}ms (attempt ${connection.reconnectAttempts})`);

  setTimeout(() => {
    if (connection.status === "disconnected") {
      connectWebSocket(connection);
    }
  }, delay);
}

/**
 * Handle event from a harness.
 */
function handleHarnessEvent(harnessUrl: string, event: unknown): void {
  // Forward to aggregation layer (implemented in aggregation.ts)
  import("./aggregation.ts").then((mod) => {
    mod.onHarnessEvent(harnessUrl, event);
  });
}

/**
 * Subscribe to harness state changes.
 */
export function onHarnessStateChange(
  listener: (harnesses: Map<string, HarnessConnection>) => void,
): () => void {
  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
}

/**
 * Notify listeners of state changes.
 */
function notifyListeners(): void {
  for (const listener of state.listeners) {
    listener(state.harnesses);
  }
}

/**
 * Get all harness connections.
 */
export function getHarnessConnections(): Map<string, HarnessConnection> {
  return state.harnesses;
}

/**
 * Connect to all harnesses from environment variable.
 */
export function connectFromEnv(): void {
  const urlsJson = Deno.env.get("HARNESS_URLS") ?? "[]";
  try {
    const urls = JSON.parse(urlsJson) as string[];
    for (const url of urls) {
      connectToHarness(url);
    }
  } catch {
    console.error("[Harness] Failed to parse HARNESS_URLS");
  }
}
