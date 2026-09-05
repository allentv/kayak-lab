## 1. MCP Client Transport

- [ ] 1.1 Define `IMCPTransport` interface with connect, disconnect, send, receive methods. Verify: `deno check` passes
- [ ] 1.2 Implement `StdioTransport` class for stdio communication. Verify: `deno test` passes
- [ ] 1.3 Implement `HttpTransport` class for HTTP communication. Verify: `deno test` passes
- [ ] 1.4 Implement `WebSocketTransport` class for WebSocket communication. Verify: `deno test` passes
- [ ] 1.5 Add transport factory to create transports based on configuration. Verify: can create transports from config

## 2. MCP Client Core

- [ ] 2.1 Create `IMCPClient` interface with connect, disconnect, discover, invoke methods. Verify: `deno check` passes
- [ ] 2.2 Implement `MCPClient` class with transport abstraction. Verify: `deno test` passes
- [ ] 2.3 Implement MCP tool discovery (list tools from MCP server). Verify: discovers tools from MCP server
- [ ] 2.4 Implement MCP tool invocation (invoke tool on MCP server). Verify: invokes tool on MCP server
- [ ] 2.5 Add MCP connection management (connect, disconnect, reconnect). Verify: manages connections properly

## 3. MCP Server

- [ ] 3.1 Define `IMCPServer` interface with start, stop, expose methods. Verify: `deno check` passes
- [ ] 3.2 Implement `MCPServer` class with transport abstraction. Verify: `deno test` passes
- [ ] 3.3 Implement MCP server tool exposure (only exposable tools). Verify: only exposable tools are exposed
- [ ] 3.4 Implement MCP server tool discovery (list exposed tools). Verify: lists exposed tools
- [ ] 3.5 Implement MCP server tool invocation (invoke exposed tool). Verify: invokes exposed tool

## 4. MCP Registry

- [ ] 4.1 Create `IMCPRegistry` interface with register, unregister, list, get, enable, disable methods. Verify: `deno check` passes
- [ ] 4.2 Implement `MCPRegistry` class with state management. Verify: `deno test` passes
- [ ] 4.3 Add MCP tool discovery by capability and category. Verify: can find MCP tools by capability or category
- [ ] 4.4 Add MCP registry events (mcp_tool_registered, mcp_tool_state_changed). Verify: events are emitted on state changes

## 5. MCP Search

- [ ] 5.1 Create `IMCPSearch` interface with search methods. Verify: `deno check` passes
- [ ] 5.2 Implement `MCPSearch` class with search by name, capability, category. Verify: `deno test` passes
- [ ] 5.3 Add MCP search results with tool details and server status. Verify: search results include tool details and server status
- [ ] 5.4 Add MCP search events (mcp_search, mcp_search_result). Verify: events are emitted on search operations

## 6. Event Stream Integration

- [ ] 6.1 Define MCP event types (mcp_connected, mcp_disconnected, mcp_tool_invocation, mcp_tool_result, mcp_server_started, mcp_server_stopped). Verify: event types are registered and valid
- [ ] 6.2 Emit MCP client events on connection, disconnection, invocation, result. Verify: events are appended to event stream
- [ ] 6.3 Emit MCP server events on start, stop, invocation, result. Verify: events are appended to event stream

## 7. Tool Registry Integration

- [ ] 7.1 Add `exposable` field to `IToolDefinition` interface. Verify: `deno check` passes
- [ ] 7.2 Implement tool exposure logic (only exposable tools are exposed). Verify: only exposable tools are exposed
- [ ] 7.3 Add tool exposure configuration. Verify: configuration controls which tools are exposed

## 8. Tests

- [ ] 8.1 Write unit tests for MCP client transport (stdio, HTTP, WebSocket). Verify: `deno test` passes
- [ ] 8.2 Write unit tests for MCP client core (connect, disconnect, discover, invoke). Verify: `deno test` passes
- [ ] 8.3 Write unit tests for MCP server (start, stop, expose, discover, invoke). Verify: `deno test` passes
- [ ] 8.4 Write unit tests for MCP registry (register, unregister, list, get, enable, disable). Verify: `deno test` passes
- [ ] 8.5 Write unit tests for MCP search (search by name, capability, category). Verify: `deno test` passes
- [ ] 8.6 Write unit tests for event stream integration. Verify: `deno test` passes
- [ ] 8.7 Write unit tests for tool registry integration. Verify: `deno test` passes
- [ ] 8.8 Verify existing 112+ tests still pass. Verify: `deno test --allow-read --allow-env --allow-run` passes