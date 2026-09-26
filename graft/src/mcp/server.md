# src/mcp/server.ts · [[model-context-protocol-mcp-integration]]

MCP server implementation that exposes harness capabilities (only exposable tools) to external MCP clients, handling incoming requests for tool discovery and invocation.

- MCPServer · class · L27-L127 — MCP server class that exposes harness tools to external clients, managing server state and tool exposure lifecycle.
- state · method · L32-L34 — Getter that provides read-only access to the current server state (stopped, starting, running, error).
- constructor · method · L36-L40 — Initializes the MCP server with configuration and immediately refreshes the list of exposable tools from the registry.
- refreshExposedTools · method · L43-L50 — Refreshes the list of exposed tools by querying the tool registry for exposable tools and mapping them to MCP tool definitions.
- start · method · L52-L65 — Starts the MCP server by refreshing exposed tools, transitioning to running state, and emitting appropriate events.
- stop · method · L67-L72 — Stops the MCP server by clearing exposed tools, transitioning to stopped state, and emitting a stopped event.
- listTools · method · L74-L76 — Returns a copy of the current list of exposed MCP tool definitions available for client discovery.
- getTool · method · L78-L80 — Retrieves a specific MCP tool definition by name from the exposed tools list, returning undefined if not found.
- handleToolCall · method · L82-L118 — Handles incoming MCP tool invocation requests by validating tool existence, invoking through registry, and returning formatted results with error handling.
- on · method · L120-L122 — Overrides EventEmitter's on method to provide type-safe event listening for MCPServerEvents.
- off · method · L124-L126 — Overrides EventEmitter's off method to provide type-safe event listener removal for MCPServerEvents.
