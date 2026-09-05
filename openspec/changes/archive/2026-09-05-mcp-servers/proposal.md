## Why

The harness needs to connect to external MCP (Model Context Protocol) servers to access additional tools and data sources, and optionally expose its own capabilities as an MCP server. MCP is an open standard for connecting AI models to external tools and data sources, with updates every ~6 months. A flexible architecture is needed to support multiple transports (stdio, HTTP, WebSocket) and future extensions.

## What Changes

- Add MCP client that connects to external MCP servers with support for multiple transports (stdio, HTTP, WebSocket)
- Add MCP server that exposes the harness's capabilities (only tools marked as exposable/public)
- Add MCP tool registry (separate from internal tool registry) for managing MCP tools
- Add MCP tool search endpoint (separate from internal tool search for now, can be unified later)
- Add MCP events to the event stream for observability
- Add MCP connection management (connect, disconnect, reconnect)

## Capabilities

### New Capabilities

- `mcp-client`: MCP client that connects to external MCP servers
- `mcp-server`: MCP server that exposes the harness's capabilities
- `mcp-registry`: MCP tool registry (separate from internal tool registry)
- `mcp-search`: MCP tool search endpoint (separate from internal tool search)

### Modified Capabilities

- `tool-registry`: Add support for marking tools as exposable/public

## Out of Scope

- Unified search endpoint for tools and MCP servers (future work based on feedback)
- MCP server implementation for external tools (separate change)
- MCP server configuration UI (future work)
- MCP server authentication and authorization (future work)