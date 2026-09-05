/**
 * MCP (Model Context Protocol) types.
 *
 * Defines interfaces for MCP transport, client, server, registry, and search.
 * MCP is an open standard for connecting AI models to external tools and data sources.
 */

import type {
  IToolDefinition,
  ParameterSchema,
  ToolCapability,
  ToolCategory,
} from "../tools/types.ts";

// ============================================================================
// MCP JSON-RPC Types
// ============================================================================

/** JSON-RPC 2.0 request. */
export interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

/** JSON-RPC 2.0 response. */
export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/** JSON-RPC 2.0 notification (no id). */
export interface MCPNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

// ============================================================================
// MCP Tool Types
// ============================================================================

/** MCP tool definition as returned by tools/list. */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: ParameterSchema;
}

/** MCP tool call parameters. */
export interface MCPToolCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

/** MCP tool call result. */
export interface MCPToolCallResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

// ============================================================================
// MCP Transport
// ============================================================================

/** Transport connection state. */
export type TransportState = "disconnected" | "connecting" | "connected" | "error";

/** MCP transport configuration. */
export interface MCPTransportConfig {
  type: "stdio" | "http" | "websocket";
  /** For stdio: command and args to spawn. */
  command?: string;
  args?: string[];
  /** For HTTP/WebSocket: server URL. */
  url?: string;
  /** Connection timeout in milliseconds. */
  timeout_ms?: number;
  /** Additional headers for HTTP/WebSocket. */
  headers?: Record<string, string>;
}

/** Events emitted by MCP transports. */
export interface TransportEvents {
  /** Emitted when state changes. */
  stateChange: (state: TransportState) => void;
  /** Emitted when a message is received. */
  message: (message: MCPResponse | MCPNotification) => void;
  /** Emitted when an error occurs. */
  error: (error: Error) => void;
}

/**
 * Interface for MCP transport implementations.
 * Transports handle the low-level communication with MCP servers.
 */
export interface IMCPTransport {
  /** Current connection state. */
  readonly state: TransportState;

  /** Connect to the MCP server. */
  connect(): Promise<void>;
  /** Disconnect from the MCP server. */
  disconnect(): Promise<void>;
  /** Send a request and wait for the response. */
  send(request: MCPRequest): Promise<MCPResponse>;
  /** Send a notification (no response expected). */
  notify(notification: MCPNotification): Promise<void>;
  /** Register an event listener. */
  on<K extends keyof TransportEvents>(event: K, listener: TransportEvents[K]): void;
  /** Remove an event listener. */
  off<K extends keyof TransportEvents>(event: K, listener: TransportEvents[K]): void;
}

// ============================================================================
// MCP Client
// ============================================================================

/** MCP client configuration. */
export interface MCPClientConfig {
  /** Server name for identification. */
  name: string;
  /** Transport configuration. */
  transport: MCPTransportConfig;
  /** Reconnect on disconnect. */
  autoReconnect?: boolean;
  /** Max reconnect attempts. */
  maxReconnectAttempts?: number;
  /** Reconnect delay in milliseconds. */
  reconnectDelayMs?: number;
}

/** MCP client connection state. */
export type MCPClientState = "disconnected" | "connecting" | "connected" | "error";

/** Events emitted by MCP clients. */
export interface MCPClientEvents {
  /** Emitted when connected to server. */
  connected: (serverName: string) => void;
  /** Emitted when disconnected from server. */
  disconnected: (serverName: string) => void;
  /** Emitted when tools are discovered. */
  toolsDiscovered: (serverName: string, tools: MCPToolDefinition[]) => void;
  /** Emitted on connection error. */
  error: (serverName: string, error: Error) => void;
}

/**
 * Interface for MCP client operations.
 */
export interface IMCPClient {
  /** Client configuration. */
  readonly config: MCPClientConfig;
  /** Current connection state. */
  readonly state: MCPClientState;

  /** Connect to the MCP server. */
  connect(): Promise<void>;
  /** Disconnect from the MCP server. */
  disconnect(): Promise<void>;
  /** Discover tools from the MCP server. */
  discover(): Promise<MCPToolDefinition[]>;
  /** Invoke a tool on the MCP server. */
  invoke(params: MCPToolCallParams): Promise<MCPToolCallResult>;
  /** Register an event listener. */
  on<K extends keyof MCPClientEvents>(event: K, listener: MCPClientEvents[K]): void;
  /** Remove an event listener. */
  off<K extends keyof MCPClientEvents>(event: K, listener: MCPClientEvents[K]): void;
}

// ============================================================================
// MCP Server
// ============================================================================

/** MCP server configuration. */
export interface MCPServerConfig {
  /** Transport configuration. */
  transport: MCPTransportConfig;
  /** Tool registry reference for exposing tools. */
  toolRegistry: MCPToolExposure;
}

/** Tool exposure filter - provides tools that can be exposed via MCP. */
export interface MCPToolExposure {
  /** Get all tools marked as exposable. */
  getExposableTools(): IToolDefinition[];
  /** Get a tool by name. */
  getTool(name: string): IToolDefinition | undefined;
  /** Invoke a tool by name. */
  invokeTool(
    name: string,
    params: Record<string, unknown>,
  ): Promise<{ success: boolean; output: string; error?: string }>;
}

/** MCP server state. */
export type MCPServerState = "stopped" | "starting" | "running" | "error";

/** Events emitted by MCP servers. */
export interface MCPServerEvents {
  /** Emitted when server starts. */
  started: (transportType: string) => void;
  /** Emitted when server stops. */
  stopped: () => void;
  /** Emitted when a tool is invoked. */
  toolInvoked: (toolName: string, params: Record<string, unknown>) => void;
  /** Emitted when a tool result is returned. */
  toolResult: (toolName: string, success: boolean) => void;
  /** Emitted on error. */
  error: (error: Error) => void;
}

/**
 * Interface for MCP server operations.
 */
export interface IMCPServer {
  /** Server configuration. */
  readonly config: MCPServerConfig;
  /** Current server state. */
  readonly state: MCPServerState;

  /** Start the MCP server. */
  start(): Promise<void>;
  /** Stop the MCP server. */
  stop(): Promise<void>;
  /** Get exposed tools (MCP tool list format). */
  listTools(): MCPToolDefinition[];
  /** Get a specific exposed tool. */
  getTool(name: string): MCPToolDefinition | undefined;
  /** Handle an incoming tool invocation request. */
  handleToolCall(params: MCPToolCallParams): Promise<MCPToolCallResult>;
  /** Register an event listener. */
  on<K extends keyof MCPServerEvents>(event: K, listener: MCPServerEvents[K]): void;
  /** Remove an event listener. */
  off<K extends keyof MCPServerEvents>(event: K, listener: MCPServerEvents[K]): void;
}

// ============================================================================
// MCP Registry
// ============================================================================

/** MCP tool registration with metadata. */
export interface MCPToolRegistration {
  /** Tool definition from MCP server. */
  tool: MCPToolDefinition;
  /** Server name this tool came from. */
  serverName: string;
  /** Whether the tool is enabled. */
  enabled: boolean;
  /** Timestamp when registered. */
  registeredAt: number;
  /** Capabilities for discovery. */
  capabilities: ToolCapability[];
  /** Category for discovery. */
  category?: ToolCategory;
}

/** MCP registry events. */
export interface MCPRegistryEvents {
  /** Emitted when a tool is registered. */
  toolRegistered: (toolName: string, serverName: string) => void;
  /** Emitted when a tool is unregistered. */
  toolUnregistered: (toolName: string, serverName: string) => void;
  /** Emitted when a tool state changes. */
  toolStateChanged: (
    toolName: string,
    oldState: boolean,
    newState: boolean,
  ) => void;
}

/**
 * Interface for MCP tool registry operations.
 */
export interface IMCPRegistry {
  /** Register a tool from an MCP server. */
  register(registration: MCPToolRegistration): void;
  /** Unregister a tool. */
  unregister(toolName: string, serverName: string): void;
  /** List all enabled tools. */
  list(): MCPToolRegistration[];
  /** Get a tool by name. */
  get(toolName: string): MCPToolRegistration | undefined;
  /** Enable a tool. */
  enable(toolName: string, serverName: string): void;
  /** Disable a tool. */
  disable(toolName: string, serverName: string): void;
  /** Find tools by capability. */
  findByCapability(capabilityId: string): MCPToolRegistration[];
  /** Find tools by category. */
  findByCategory(categoryId: string): MCPToolRegistration[];
  /** Register an event listener. */
  on<K extends keyof MCPRegistryEvents>(event: K, listener: MCPRegistryEvents[K]): void;
  /** Remove an event listener. */
  off<K extends keyof MCPRegistryEvents>(event: K, listener: MCPRegistryEvents[K]): void;
}

// ============================================================================
// MCP Search
// ============================================================================

/** MCP search query. */
export interface MCPSearchQuery {
  /** Search by tool name (substring match). */
  name?: string;
  /** Search by capability ID. */
  capability?: string;
  /** Search by category ID. */
  category?: string;
}

/** MCP search result item. */
export interface MCPSearchResultItem {
  /** Tool definition. */
  tool: MCPToolDefinition;
  /** Server name. */
  serverName: string;
  /** Server connection status. */
  serverStatus: MCPClientState;
}

/** MCP search result. */
export interface MCPSearchResult {
  /** Matching tools. */
  items: MCPSearchResultItem[];
  /** Total count. */
  count: number;
  /** Server status summary. */
  serverStatus: Record<string, { status: MCPClientState; toolCount: number }>;
}

/** MCP search events. */
export interface MCPSearchEvents {
  /** Emitted when a search is performed. */
  search: (query: MCPSearchQuery) => void;
  /** Emitted when search results are returned. */
  searchResult: (query: MCPSearchQuery, resultCount: number) => void;
}

/**
 * Interface for MCP tool search operations.
 */
export interface IMCPSearch {
  /** Search for MCP tools. */
  search(query: MCPSearchQuery): MCPSearchResult;
  /** Register an event listener. */
  on<K extends keyof MCPSearchEvents>(event: K, listener: MCPSearchEvents[K]): void;
  /** Remove an event listener. */
  off<K extends keyof MCPSearchEvents>(event: K, listener: MCPSearchEvents[K]): void;
}

// ============================================================================
// MCP Error Types
// ============================================================================

/** MCP-specific error codes (JSON-RPC compatible). */
export const MCPErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  CONNECTION_ERROR: -32000,
  TIMEOUT_ERROR: -32001,
  TOOL_NOT_FOUND: -32002,
  TOOL_INVOCATION_ERROR: -32003,
} as const;

export type MCPErrorCode =
  (typeof MCPErrorCodes)[keyof typeof MCPErrorCodes];

/** MCP error with code and optional data. */
export class MCPError extends Error {
  constructor(
    message: string,
    public readonly code: MCPErrorCode,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "MCPError";
  }
}
