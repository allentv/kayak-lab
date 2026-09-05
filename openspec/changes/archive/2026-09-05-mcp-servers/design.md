## Context

The harness needs to connect to external MCP (Model Context Protocol) servers to access additional tools and data sources, and optionally expose its own capabilities as an MCP server. MCP is an open standard for connecting AI models to external tools and data sources, with updates every ~6 months. A flexible architecture is needed to support multiple transports (stdio, HTTP, WebSocket) and future extensions.

The existing tool calling protocol (from `tool-calling` change) provides the internal mechanism for invoking tools. MCP is the external protocol for connecting to external tools. MCP tools are registered in a separate registry from internal tools, but both can be searched via separate endpoints.

## Goals / Non-Goals

**Goals:**
- Implement MCP client that connects to external MCP servers with support for multiple transports (stdio, HTTP, WebSocket)
- Implement MCP server that exposes the harness's capabilities (only tools marked as exposable/public)
- Implement MCP tool registry (separate from internal tool registry)
- Implement MCP tool search endpoint (separate from internal tool search for now)
- Add MCP events to the event stream for observability
- Add MCP connection management (connect, disconnect, reconnect)

**Non-Goals:**
- Unified search endpoint for tools and MCP servers (future work based on feedback)
- MCP server implementation for external tools (separate change)
- MCP server configuration UI (future work)
- MCP server authentication and authorization (future work)

## Decisions

### Decision: MCP Client Transport Architecture

**Choice:** Flexible architecture with transport abstraction layer, supporting stdio, HTTP, and WebSocket.

**Rationale:** MCP spec gets updates every ~6 months, so the architecture should be flexible to change. A transport abstraction layer allows easy addition of new transports without changing the core client logic.

**Alternatives considered:**
- Hard-coded transports: Not flexible for future changes
- Plugin-based transports: Too complex for initial implementation
- Single transport: Not flexible enough

### Decision: MCP Server Tool Exposure

**Choice:** Only tools marked as exposable/public are exposed via the MCP server.

**Rationale:** Security and control. Not all tools should be exposed to external MCP clients. Only tools explicitly marked as exposable are exposed.

**Alternatives considered:**
- Expose all tools: Too broad, potential security issues
- Expose no tools: No value from MCP server

### Decision: Separate Registries

**Choice:** MCP tools are registered in a separate registry from internal tools.

**Rationale:** Separation of concerns. MCP tools are from external sources, while internal tools are from the harness. Keeping them separate makes it easier to manage and search each type.

**Alternatives considered:**
- Unified registry: More complex to manage, harder to distinguish between internal and MCP tools
- Separate registries with unified search: Future work based on feedback

### Decision: Separate Search Endpoints

**Choice:** MCP tool search is separate from internal tool search for now.

**Rationale:** Simplicity. Keeping them separate makes it easier to build and iterate. Once the coding harness runs with real production workload for a while, we can incorporate feedback and see if a unified search interface makes sense.

**Alternatives considered:**
- Unified search: More complex, may not be needed initially
- No search: No way to discover tools

## Risks / Trade-offs

**Risk:** MCP spec may change in ways that require significant refactoring.
**Mitigation:** Design the architecture to be flexible with transport abstraction layer and versioned protocol handling.

**Risk:** MCP server may expose sensitive tools.
**Mitigation:** Only tools marked as exposable are exposed. Configuration controls which tools are exposed.

**Risk:** MCP client may have performance overhead.
**Mitigation:** Use efficient transports and connection pooling. Cache tool definitions.

**Risk:** Separate registries may lead to duplication.
**Mitigation:** Use a unified search endpoint in the future if needed.