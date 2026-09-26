# src/mcp/types.ts · [[model-context-protocol-mcp-integration]]

Defines TypeScript interfaces and types for implementing the Model Context Protocol (MCP) standard for connecting AI models to external tools and data sources.

- MCPRequest · interface · L20-L25 — Represents a JSON-RPC 2.0 request structure for MCP communication with method and parameters.
- MCPResponse · interface · L28-L37 — Represents a JSON-RPC 2.0 response structure for MCP communication with result or error.
- MCPNotification · interface · L40-L44 — Represents a JSON-RPC 2.0 notification structure for MCP communication without expecting a response.
- MCPToolDefinition · interface · L51-L55 — Defines the structure of a tool as exposed by MCP servers for AI model consumption.
- MCPToolCallParams · interface · L58-L61 — Specifies the parameters required to invoke a tool through MCP, including tool name and arguments.
- MCPToolCallResult · interface · L64-L67 — Defines the result structure returned from MCP tool invocations, containing content and error status.
- TransportState · type · L74-L74 — Enumerates the possible connection states for MCP transport implementations.
- MCPTransportConfig · interface · L77-L88 — Configures MCP transport connections with type-specific settings for stdio, HTTP, or WebSocket.
- TransportEvents · interface · L91-L98 — Defines event callbacks for MCP transport state changes, message reception, and errors.
- IMCPTransport · interface · L104-L120 — Interface for low-level MCP transport implementations that handle communication with MCP servers.
- MCPClientConfig · interface · L127-L138 — Configures MCP client behavior including server identification, transport, and reconnection settings.
- MCPClientState · type · L141-L141 — Enumerates the possible connection states for MCP clients interacting with servers.
- MCPClientEvents · interface · L144-L153 — Defines event callbacks for MCP client connection, tool discovery, and error handling.
- IMCPClient · interface · L158-L176 — Interface for MCP client operations including connection management, tool discovery, and invocation.
- MCPServerConfig · interface · L183-L188 — Configures MCP server behavior including transport settings and tool exposure registry.
- MCPToolExposure · interface · L191-L201 — Interface for filtering and exposing tools from a registry for MCP server consumption.
- MCPServerState · type · L204-L204 — Enumerates the possible operational states for MCP servers.
- MCPServerEvents · interface · L207-L218 — Defines event callbacks for MCP server lifecycle, tool invocation, and error handling.
- IMCPServer · interface · L223-L243 — Interface for MCP server operations including startup, tool exposure, and request handling.
- MCPToolRegistration · interface · L250-L263 — Defines metadata for registered MCP tools including server origin, capabilities, and enablement status.
- MCPRegistryEvents · interface · L266-L277 — Defines event callbacks for MCP registry operations including tool registration and state changes.
- IMCPRegistry · interface · L282-L303 — Interface for MCP tool registry operations including registration, discovery, and enablement management.
- MCPSearchQuery · interface · L310-L317 — Defines search criteria for finding MCP tools by name, capability, or category.
- MCPSearchResultItem · interface · L320-L327 — Represents a single search result item combining tool definition with server connection status.
- MCPSearchResult · interface · L330-L337 — Defines the complete search result structure including matching tools and server status summary.
- MCPSearchEvents · interface · L340-L345 — Defines event callbacks for MCP search operations including query execution and result delivery.
- IMCPSearch · interface · L350-L357 — Interface for MCP tool search operations allowing discovery of tools across registered servers.
- MCPErrorCode · type · L376-L377 — Type representing all possible MCP error codes derived from the MCPErrorCodes constant.
- MCPError · class · L380-L389 — Custom error class for MCP-specific errors with standardized error codes and optional data.
- constructor · method · L381-L388 — Constructs an MCPError instance with a message, error code, and optional additional data.
