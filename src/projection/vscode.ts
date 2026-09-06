/**
 * VS Code extension projection.
 *
 * Surfaces agent interactions within VS Code via TreeView, OutputChannel,
 * and StatusBar. The projection logic is decoupled from VS Code API calls
 * so it can be unit-tested with mocks.
 */

import { BaseEvent, EventType } from "../types/events.ts";
import type { Session, SessionState } from "../core/session-manager.ts";

// ============================================================================
// VS Code Projection Types
// ============================================================================

/** Agent processing state for status bar. */
export type AgentState = "active" | "idle" | "error";

/** Event type color map for output panel syntax highlighting. */
export const EVENT_TYPE_COLORS: Record<string, string> = {
  "session.created": "#4EC9B0",
  "session.resumed": "#4EC9B0",
  "session.completed": "#6A9955",
  "session.failed": "#F44747",
  "session.cancelled": "#808080",
  "tool.execution.started": "#DCDCAA",
  "tool.execution.completed": "#6A9955",
  "tool.execution.failed": "#F44747",
  "model.request": "#569CD6",
  "model.response": "#CE9178",
  "model.stream.delta": "#CE9178",
  "agent.self_observed": "#C586C0",
  "agent.pattern_detected": "#C586C0",
  "ui.user.input": "#9CDCFE",
  "tool.call.invocation": "#DCDCAA",
  "tool.call.result": "#6A9955",
};

// ============================================================================
// VS Code API Abstraction (for testability)
// ============================================================================

/** Tree view item representing a session. */
export interface SessionTreeItem {
  id: string;
  label: string;
  state: SessionState;
  eventCount: number;
  createdAt: string;
  description?: string;
}

/** Tree item shape. */
export interface TreeItem {
  id: string;
  label: string;
  description?: string;
  state: SessionState;
  collapsibleState?: number;
}

/** Abstracts VS Code OutputChannel. */
export interface IOutputChannel {
  appendLine(text: string, color?: string): void;
  clear(): void;
  show(): void;
  hide(): void;
  dispose(): void;
}

/** Abstracts VS Code StatusBar. */
export interface IStatusBarItem {
  text: string;
  tooltip?: string;
  color?: string;
  command?: string;
  show(): void;
  hide(): void;
  dispose(): void;
}

// ============================================================================
// VS Code Projection Interface
// ============================================================================

/**
 * Interface for VS Code projection operations.
 */
export interface IVSCodeProjection {
  /** Render a single event to the output channel. */
  renderEvent(event: BaseEvent): void;

  /** Update the session tree view with current sessions. */
  updateSessionList(sessions: Session[]): void;

  /** Update the status bar with the current agent state. */
  updateStatusBar(state: AgentState, sessionName?: string): void;

  /** Clear the output channel. */
  clearOutput(): void;

  /** Show the output channel. */
  showOutput(): void;

  /** Dispose all resources. */
  dispose(): void;
}

// ============================================================================
// Session Tree Data Provider
// ============================================================================

/**
 * Tree data provider that lists active sessions.
 */
export class SessionTreeDataProvider {
  private sessions: SessionTreeItem[] = [];
  private onDidChangeTreeDataListeners: Array<() => void> = [];

  /** Register a listener for tree data changes. */
  onDidChangeTreeData(listener: () => void): () => void {
    this.onDidChangeTreeDataListeners.push(listener);
    return () => {
      this.onDidChangeTreeDataListeners = this.onDidChangeTreeDataListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  /** Get tree item for display. */
  getTreeItem(element: SessionTreeItem): TreeItem {
    return {
      id: element.id,
      label: element.label,
      description: `${element.state} — ${element.eventCount} events`,
      state: element.state,
      collapsibleState: 0, // None
    };
  }

  /** Get child elements (root level = all sessions). */
  getChildren(element?: SessionTreeItem): SessionTreeItem[] {
    if (!element) {
      return this.sessions;
    }
    return [];
  }

  /** Update the session list and notify listeners. */
  refresh(sessions: Session[], eventCounts: Map<string, number>): void {
    this.sessions = sessions.map((s) => ({
      id: s.id,
      label: s.description || `Session ${s.id.slice(0, 8)}`,
      state: s.state,
      eventCount: eventCounts.get(s.id) || 0,
      createdAt: s.created_at,
      description: s.description,
    }));
    this.onDidChangeTreeDataListeners.forEach((l) => l());
  }
}

// ============================================================================
// Event Formatter
// ============================================================================

/**
 * Formats events for display in the VS Code output channel.
 */
export class EventFormatter {
  /** Format an event for output channel display. */
  format(event: BaseEvent): string {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    const type = event.event_type;
    const payload = JSON.stringify(event.payload, null, 2);

    return `[${timestamp}] ${type}\n${payload}`;
  }

  /** Get the color for an event type. */
  getColor(eventType: EventType): string | undefined {
    return EVENT_TYPE_COLORS[eventType];
  }
}

// ============================================================================
// VS Code Projection Implementation
// ============================================================================

/**
 * VS Code projection that renders agent events to VS Code UI surfaces.
 */
export class VSCodeProjection implements IVSCodeProjection {
  private treeDataProvider: SessionTreeDataProvider;
  private outputChannel: IOutputChannel;
  private statusBar: IStatusBarItem;
  private eventFormatter: EventFormatter;
  private outputFilters: Set<string> = new Set();

  constructor(
    treeDataProvider: SessionTreeDataProvider,
    outputChannel: IOutputChannel,
    statusBar: IStatusBarItem,
  ) {
    this.treeDataProvider = treeDataProvider;
    this.outputChannel = outputChannel;
    this.statusBar = statusBar;
    this.eventFormatter = new EventFormatter();
  }

  /** Render a single event to the output channel. */
  renderEvent(event: BaseEvent): void {
    // Apply filters if any are set
    if (this.outputFilters.size > 0 && !this.outputFilters.has(event.event_type)) {
      return;
    }

    const formatted = this.eventFormatter.format(event);
    const color = this.eventFormatter.getColor(event.event_type);
    this.outputChannel.appendLine(formatted, color);
  }

  /** Update the session tree view with current sessions. */
  updateSessionList(sessions: Session[]): void {
    const eventCounts = new Map<string, number>();
    // Event counts would come from the event store; for now pass empty
    this.treeDataProvider.refresh(sessions, eventCounts);
  }

  /** Update the status bar with the current agent state. */
  updateStatusBar(state: AgentState, sessionName?: string): void {
    switch (state) {
      case "active":
        this.statusBar.text = `$(sync~spin) ${sessionName || "Agent"}`;
        this.statusBar.tooltip = `Agent processing: ${sessionName || "active"}`;
        this.statusBar.color = undefined;
        break;
      case "idle":
        this.statusBar.text = "$(check) Idle";
        this.statusBar.tooltip = "Agent idle";
        this.statusBar.color = undefined;
        break;
      case "error":
        this.statusBar.text = "$(error) Error";
        this.statusBar.tooltip = "Agent encountered an error";
        this.statusBar.color = "#F44747";
        break;
    }
    this.statusBar.show();
  }

  /** Set event type filters for the output channel. */
  setFilters(types: Set<string>): void {
    this.outputFilters = types;
  }

  /** Clear the output channel. */
  clearOutput(): void {
    this.outputChannel.clear();
  }

  /** Show the output channel. */
  showOutput(): void {
    this.outputChannel.show();
  }

  /** Dispose all resources. */
  dispose(): void {
    this.outputChannel.dispose();
    this.statusBar.dispose();
  }
}

// ============================================================================
// WebSocket Client for VS Code
// ============================================================================

/** WebSocket client message types. */
export type ClientMessage =
  | { type: "subscribe"; session_id?: string; event_types?: string[] }
  | { type: "unsubscribe" }
  | { type: "reconnect"; session_id: string; last_event_id: string }
  | { type: "ping" }
  | { type: "pong" };

/** WebSocket client message types. */
export type ServerMessage =
  | { type: "welcome"; client_id: string; server_time: string }
  | { type: "event"; event: BaseEvent }
  | { type: "error"; code: string; message: string }
  | { type: "ping" }
  | { type: "pong" }
  | { type: "close"; reason: string };

/** WebSocket client configuration. */
export interface VSCodeWebSocketClientConfig {
  url: string;
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
}

/**
 * WebSocket client that connects to the harness WebSocket server
 * and feeds events to the VS Code projection.
 */
export class VSCodeWebSocketClient {
  private config: VSCodeWebSocketClientConfig;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private listeners: Array<(event: BaseEvent) => void> = [];
  private stateListeners: Array<(state: "connected" | "disconnected" | "reconnecting") => void> = [];

  constructor(config: VSCodeWebSocketClientConfig) {
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
      // Subscribe to all sessions by default
      this.send({ type: "subscribe" });
    };

    this.ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as ServerMessage;
        if (data.type === "event") {
          this.listeners.forEach((l) => l(data.event));
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

  /** Subscribe to events from a specific session. */
  subscribe(sessionId: string, eventTypes?: string[]): void {
    this.send({ type: "subscribe", session_id: sessionId, event_types: eventTypes });
  }

  /** Unsubscribe from current subscription. */
  unsubscribe(): void {
    this.send({ type: "unsubscribe" });
  }

  /** Register an event listener. */
  onEvent(listener: (event: BaseEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Register a connection state listener. */
  onStateChange(listener: (state: "connected" | "disconnected" | "reconnecting") => void): () => void {
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

  private send(msg: ClientMessage): void {
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

  private notifyState(state: "connected" | "disconnected" | "reconnecting"): void {
    this.stateListeners.forEach((l) => l(state));
  }
}

// ============================================================================
// VS Code Projection Factory
// ============================================================================

/** Return type for the VS Code projection factory. */
export interface VSCodeProjectionBundle {
  projection: VSCodeProjection;
  client: VSCodeWebSocketClient;
}

/**
 * Creates a fully wired VS Code projection with WebSocket client.
 */
export function createVSCodeProjection(
  treeDataProvider: SessionTreeDataProvider,
  outputChannel: IOutputChannel,
  statusBar: IStatusBarItem,
  wsConfig: VSCodeWebSocketClientConfig,
): VSCodeProjectionBundle {
  const projection = new VSCodeProjection(treeDataProvider, outputChannel, statusBar);
  const client = new VSCodeWebSocketClient(wsConfig);

  // Wire events to projection
  client.onEvent((event) => {
    projection.renderEvent(event);
  });

  // Wire state changes to status bar
  client.onStateChange((state) => {
    if (state === "connected") {
      projection.updateStatusBar("idle");
    } else if (state === "disconnected") {
      projection.updateStatusBar("error", "Disconnected");
    } else {
      projection.updateStatusBar("active", "Reconnecting...");
    }
  });

  return { projection, client };
}
