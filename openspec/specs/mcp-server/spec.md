# mcp-server Specification

## Purpose
An MCP server that exposes the harness's capabilities (only tools marked as exposable/public) to external MCP clients.

## Requirements

### Requirement: MCP Server Exposure

The MCP server MUST expose only tools marked as exposable/public.

#### Scenario: Expose exposable tools

- **WHEN** the MCP server is started
- **THEN** only tools marked as exposable/public are exposed
- **AND** the exposed tools are available to MCP clients

#### Scenario: Do not expose non-exposable tools

- **WHEN** the MCP server is started
- **THEN** tools not marked as exposable are not exposed
- **AND** non-exposable tools are not available to MCP clients

### Requirement: MCP Server Transport

The MCP server MUST support multiple transports (stdio, HTTP, WebSocket).

#### Scenario: Serve via stdio

- **WHEN** the MCP server is configured to serve via stdio
- **THEN** the server communicates via stdin/stdout
- **AND** the server can handle requests and send responses

#### Scenario: Serve via HTTP

- **WHEN** the MCP server is configured to serve via HTTP
- **THEN** the server communicates via HTTP
- **AND** the server can handle requests and send responses

#### Scenario: Serve via WebSocket

- **WHEN** the MCP server is configured to serve via WebSocket
- **THEN** the server communicates via WebSocket
- **AND** the server can handle requests and send responses

### Requirement: MCP Server Tool Discovery

The MCP server MUST provide tool discovery to MCP clients.

#### Scenario: List exposed tools

- **WHEN** an MCP client requests tool discovery
- **THEN** the server returns a list of exposed tools with name, description, and parameter schemas
- **AND** only tools marked as exposable are included

#### Scenario: Get tool by name

- **WHEN** an MCP client requests a tool by name
- **THEN** the server returns the tool definition if it exists and is exposed
- **AND** an error is returned if the tool does not exist or is not exposed

### Requirement: MCP Server Tool Invocation

The MCP server MUST handle tool invocations from MCP clients.

#### Scenario: Invoke exposed tool

- **WHEN** an MCP client invokes an exposed tool with valid parameters
- **THEN** the server executes the tool and returns the result
- **AND** the invocation is recorded in the event stream

#### Scenario: Invoke non-exposed tool

- **WHEN** an MCP client invokes a tool that is not exposed
- **THEN** the server returns an error
- **AND** the error is recorded in the event stream

#### Scenario: Invoke tool with invalid parameters

- **WHEN** an MCP client invokes a tool with invalid parameters
- **THEN** the server returns a validation error
- **AND** the error is recorded in the event stream

### Requirement: MCP Server Events

MCP server operations MUST generate events in the event stream for observability.

#### Scenario: MCP server start event

- **WHEN** the MCP server starts
- **THEN** a mcp_server_started event is emitted with transport type and timestamp
- **AND** the event is appended to the event stream

#### Scenario: MCP server stop event

- **WHEN** the MCP server stops
- **THEN** a mcp_server_stopped event is emitted with timestamp
- **AND** the event is appended to the event stream

#### Scenario: MCP server tool invocation event

- **WHEN** the MCP server handles a tool invocation
- **THEN** a mcp_server_tool_invocation event is emitted with tool_name, parameters, and timestamp
- **AND** the event is appended to the event stream

#### Scenario: MCP server tool result event

- **WHEN** the MCP server returns a tool result
- **THEN** a mcp_server_tool_result event is emitted with tool_name, result, and timestamp
- **AND** the event is appended to the event stream
