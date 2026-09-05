/**
 * MCP event types for the event stream.
 *
 * Defines MCP-specific event types that are appended to the event stream
 * for observability of MCP operations.
 */

// ============================================================================
// MCP Event Types
// ============================================================================

/** MCP event type constants. */
export const MCPEventTypes = {
  // Client events
  MCP_CONNECTED: "mcp.connected",
  MCP_DISCONNECTED: "mcp.disconnected",
  MCP_TOOLS_DISCOVERED: "mcp.tools_discovered",

  // Tool invocation events
  MCP_TOOL_INVOCATION: "mcp.tool.invocation",
  MCP_TOOL_RESULT: "mcp.tool.result",

  // Server events
  MCP_SERVER_STARTED: "mcp.server.started",
  MCP_SERVER_STOPPED: "mcp.server.stopped",
  MCP_SERVER_TOOL_INVOCATION: "mcp.server.tool.invocation",
  MCP_SERVER_TOOL_RESULT: "mcp.server.tool.result",

  // Registry events
  MCP_TOOL_REGISTERED: "mcp.tool.registered",
  MCP_TOOL_UNREGISTERED: "mcp.tool.unregistered",
  MCP_TOOL_STATE_CHANGED: "mcp.tool.state_changed",

  // Search events
  MCP_SEARCH: "mcp.search",
  MCP_SEARCH_RESULT: "mcp.search.result",
  MCP_ERROR: "mcp.error",
} as const;

export type MCPEventType =
  (typeof MCPEventTypes)[keyof typeof MCPEventTypes];

// ============================================================================
// MCP Event Payloads
// ============================================================================

/** Base interface for MCP events. */
export interface MCPEventBase {
  event_type: MCPEventType;
  timestamp: number;
  session_id?: string;
}

/** MCP connected event. */
export interface MCPConnectedEvent extends MCPEventBase {
  event_type: typeof MCPEventTypes.MCP_CONNECTED;
  server_name: string;
  transport_type: string;
}

/** MCP disconnected event. */
export interface MCPDisconnectedEvent extends MCPEventBase {
  event_type: typeof MCPEventTypes.MCP_DISCONNECTED;
  server_name: string;
  reason?: string;
}

/** MCP tools discovered event. */
export interface MCPToolsDiscoveredEvent extends MCPEventBase {
  event_type: typeof MCPEventTypes.MCP_TOOLS_DISCOVERED;
  server_name: string;
  tool_count: number;
  tool_names: string[];
}

/** MCP tool invocation event. */
export interface MCPToolInvocationEvent extends MCPEventBase {
  event_type: typeof MCPEventTypes.MCP_TOOL_INVOCATION;
  server_name: string;
  tool_name: string;
  parameters: Record<string, unknown>;
}

/** MCP tool result event. */
export interface MCPToolResultEvent extends MCPEventBase {
  event_type: typeof MCPEventTypes.MCP_TOOL_RESULT;
  server_name: string;
  tool_name: string;
  success: boolean;
  duration_ms: number;
  error?: string;
}

/** MCP server started event. */
export interface MCPServerStartedEvent extends MCPEventBase {
  event_type: typeof MCPEventTypes.MCP_SERVER_STARTED;
  transport_type: string;
  tool_count: number;
}

/** MCP server stopped event. */
export interface MCPServerStoppedEvent extends MCPEventBase {
  event_type: typeof MCPEventTypes.MCP_SERVER_STOPPED;
}

/** MCP search event. */
export interface MCPSearchEvent extends MCPEventBase {
  event_type: typeof MCPEventTypes.MCP_SEARCH;
  query: {
    name?: string;
    capability?: string;
    category?: string;
  };
}

/** MCP search result event. */
export interface MCPSearchResultEvent extends MCPEventBase {
  event_type: typeof MCPEventTypes.MCP_SEARCH_RESULT;
  result_count: number;
  query: {
    name?: string;
    capability?: string;
    category?: string;
  };
}

// ============================================================================
// MCP Event Type Guard
// ============================================================================

/**
 * Checks if an event is an MCP event.
 */
export function isMCPEvent(event: { event_type: string }): event is MCPEventBase {
  return event.event_type.startsWith("mcp.");
}
