/**
 * MCP event emission helpers.
 *
 * Connects MCP components to the event stream for observability.
 * Emits MCP-specific events when client, server, and registry operations occur.
 */

import type { AppendEventInput } from "../types/events.ts";
import { EventTypes } from "../types/events.ts";
import type { MCPClient } from "./client.ts";
import type { MCPServer } from "./server.ts";
import type { MCPRegistry } from "./registry.ts";
import type { MCPSearch } from "./search.ts";
import type { MCPToolDefinition } from "./types.ts";

// ============================================================================
// Event Emitter Interface
// ============================================================================

/** Function to append events to the event stream. */
export type AppendEventFn = (event: AppendEventInput) => Promise<void>;

// ============================================================================
// Helper
// ============================================================================

function makeEvent(
  eventType: string,
  payload: Record<string, unknown>,
  sessionId?: string,
): AppendEventInput {
  return {
    event_type: eventType as AppendEventInput["event_type"],
    session_id: sessionId ?? "",
    sequence_number: 0,
    payload,
    metadata: { source: "mcp-module" },
  };
}

// ============================================================================
// Client Event Wiring
// ============================================================================

/**
 * Wire MCP client events to the event stream.
 */
export function wireClientEvents(
  client: MCPClient,
  appendEvent: AppendEventFn,
): void {
  client.on("connected", (serverName: string) => {
    appendEvent(makeEvent(EventTypes.MCP_CONNECTED, {
      server_name: serverName,
      transport_type: client.config.transport.type,
    })).catch(() => {});
  });

  client.on("disconnected", (serverName: string) => {
    appendEvent(makeEvent(EventTypes.MCP_DISCONNECTED, {
      server_name: serverName,
    })).catch(() => {});
  });

  client.on("toolsDiscovered", (serverName: string, tools: MCPToolDefinition[]) => {
    appendEvent(makeEvent(EventTypes.MCP_TOOLS_DISCOVERED, {
      server_name: serverName,
      tool_count: tools.length,
      tool_names: tools.map((t) => t.name),
    })).catch(() => {});
  });

  client.on("error", (serverName: string, error: Error) => {
    appendEvent(makeEvent(EventTypes.MCP_ERROR, {
      server_name: serverName,
      error_message: error.message,
      error_code: "client_error",
    })).catch(() => {});
  });
}

// ============================================================================
// Server Event Wiring
// ============================================================================

/**
 * Wire MCP server events to the event stream.
 */
export function wireServerEvents(
  server: MCPServer,
  appendEvent: AppendEventFn,
): void {
  server.on("started", (transportType: string) => {
    const tools = server.listTools();
    appendEvent(makeEvent(EventTypes.MCP_SERVER_STARTED, {
      transport_type: transportType,
      tool_count: tools.length,
    })).catch(() => {});
  });

  server.on("stopped", () => {
    appendEvent(makeEvent(EventTypes.MCP_SERVER_STOPPED, {})).catch(() => {});
  });

  server.on("toolInvoked", (toolName: string, params: Record<string, unknown>) => {
    appendEvent(makeEvent(EventTypes.MCP_SERVER_TOOL_INVOCATION, {
      tool_name: toolName,
      parameters: params,
    })).catch(() => {});
  });

  server.on("toolResult", (toolName: string, success: boolean) => {
    appendEvent(makeEvent(EventTypes.MCP_SERVER_TOOL_RESULT, {
      tool_name: toolName,
      success,
    })).catch(() => {});
  });

  server.on("error", (error: Error) => {
    appendEvent(makeEvent(EventTypes.MCP_ERROR, {
      error_message: error.message,
      error_code: "server_error",
    })).catch(() => {});
  });
}

// ============================================================================
// Registry Event Wiring
// ============================================================================

/**
 * Wire MCP registry events to the event stream.
 */
export function wireRegistryEvents(
  registry: MCPRegistry,
  appendEvent: AppendEventFn,
): void {
  registry.on("toolRegistered", (toolName: string, serverName: string) => {
    appendEvent(makeEvent(EventTypes.MCP_TOOL_REGISTERED, {
      tool_name: toolName,
      server_name: serverName,
    })).catch(() => {});
  });

  registry.on("toolUnregistered", (toolName: string, serverName: string) => {
    appendEvent(makeEvent(EventTypes.MCP_TOOL_UNREGISTERED, {
      tool_name: toolName,
      server_name: serverName,
    })).catch(() => {});
  });

  registry.on("toolStateChanged", (toolName: string, oldState: boolean, newState: boolean) => {
    appendEvent(makeEvent(EventTypes.MCP_TOOL_STATE_CHANGED, {
      tool_name: toolName,
      old_state: oldState,
      new_state: newState,
    })).catch(() => {});
  });
}

// ============================================================================
// Search Event Wiring
// ============================================================================

/**
 * Wire MCP search events to the event stream.
 */
export function wireSearchEvents(
  search: MCPSearch,
  appendEvent: AppendEventFn,
): void {
  search.on("search", (query: { name?: string; capability?: string; category?: string }) => {
    appendEvent(makeEvent(EventTypes.MCP_SEARCH, { query })).catch(() => {});
  });

  search.on("searchResult", (query: { name?: string; capability?: string; category?: string }, resultCount: number) => {
    appendEvent(makeEvent(EventTypes.MCP_SEARCH_RESULT, {
      result_count: resultCount,
      query,
    })).catch(() => {});
  });
}
