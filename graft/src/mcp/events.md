# src/mcp/events.ts · [[model-context-protocol-mcp-integration]]

Defines MCP event types and payloads for observability of MCP operations in the event stream.

- MCPEventType · type · L40-L41 — Union type representing all possible MCP event type constants for type-safe event handling.
- MCPEventBase · interface · L48-L52 — Base interface providing common properties for all MCP events including timestamp and optional session ID.
- MCPConnectedEvent · interface · L55-L59 — Event payload for when an MCP client successfully connects to a server.
- MCPDisconnectedEvent · interface · L62-L66 — Event payload for when an MCP client disconnects from a server, optionally including a reason.
- MCPToolsDiscoveredEvent · interface · L69-L74 — Event payload for when an MCP client discovers available tools on a server.
- MCPToolInvocationEvent · interface · L77-L82 — Event payload for when an MCP tool is invoked, including its parameters.
- MCPToolResultEvent · interface · L85-L92 — Event payload for the result of an MCP tool invocation, including success status and duration.
- MCPServerStartedEvent · interface · L95-L99 — Event payload for when an MCP server starts, including transport type and tool count.
- MCPServerStoppedEvent · interface · L102-L104 — Event payload for when an MCP server stops running.
- MCPSearchEvent · interface · L107-L114 — Event payload for MCP tool search queries with optional name, capability, and category filters.
- MCPSearchResultEvent · interface · L117-L125 — Event payload for MCP tool search results including count and the original query parameters.
- isMCPEvent · function · L134-L136 — Type guard function that identifies MCP events by checking if their event_type starts with 'mcp.' prefix.
