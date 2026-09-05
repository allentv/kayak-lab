/**
 * MCP (Model Context Protocol) module.
 *
 * Provides MCP client, server, registry, and search capabilities
 * for connecting to external MCP servers and exposing harness tools.
 */

// Types
export type {
  IMCPClient,
  IMCPRegistry,
  IMCPSearch,
  IMCPServer,
  IMCPTransport,
  MCPClientConfig,
  MCPClientEvents,
  MCPClientState,
  MCPErrorCode,
  MCPRegistryEvents,
  MCPSearchEvents,
  MCPSearchQuery,
  MCPSearchResult,
  MCPSearchResultItem,
  MCPServerConfig,
  MCPServerEvents,
  MCPServerState,
  MCPToolCallParams,
  MCPToolCallResult,
  MCPToolDefinition,
  MCPToolExposure,
  MCPToolRegistration,
  MCPTransportConfig,
  MCPRequest,
  MCPResponse,
  MCPNotification,
  TransportEvents,
  TransportState,
} from "./types.ts";

// Errors and constants
export { MCPError, MCPErrorCodes } from "./types.ts";

// Implementations
export { createTransport, HttpTransport, StdioTransport, WebSocketTransport } from "./transport.ts";
export { MCPClient } from "./client.ts";
export { MCPServer } from "./server.ts";
export { MCPRegistry } from "./registry.ts";
export { MCPSearch } from "./search.ts";

// Event types
export { isMCPEvent, MCPEventTypes } from "./events.ts";
export type {
  MCPConnectedEvent,
  MCPDisconnectedEvent,
  MCPSearchEvent,
  MCPSearchResultEvent,
  MCPServerStartedEvent,
  MCPServerStoppedEvent,
  MCPToolInvocationEvent,
  MCPToolResultEvent,
  MCPToolsDiscoveredEvent,
} from "./events.ts";
