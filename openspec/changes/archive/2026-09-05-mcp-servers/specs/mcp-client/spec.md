## Purpose

An MCP client that connects to external MCP servers with support for multiple transports (stdio, HTTP, WebSocket), enabling the harness to access additional tools and data sources.

## ADDED Requirements

### Requirement: MCP Client Connection

The MCP client MUST support connecting to MCP servers with multiple transports.

#### Scenario: Connect via stdio

- **WHEN** the MCP client is configured to connect via stdio
- **THEN** the client launches a subprocess and communicates via stdin/stdout
- **AND** the client can send requests and receive responses

#### Scenario: Connect via HTTP

- **WHEN** the MCP client is configured to connect via HTTP
- **THEN** the client connects to the server via HTTP
- **AND** the client can send requests and receive responses

#### Scenario: Connect via WebSocket

- **WHEN** the MCP client is configured to connect via WebSocket
- **THEN** the client connects to the server via WebSocket
- **AND** the client can send requests and receive responses

#### Scenario: Connection failure

- **WHEN** the MCP client cannot connect to a server
- **THEN** the client returns a connection error
- **AND** the error is recorded in the event stream

### Requirement: MCP Tool Discovery

The MCP client MUST discover tools available from MCP servers.

#### Scenario: Discover tools from MCP server

- **WHEN** the MCP client connects to an MCP server
- **THEN** the client discovers available tools from the server
- **AND** the tools are registered in the MCP registry

#### Scenario: Discover tools with specific capability

- **WHEN** the MCP client discovers tools from an MCP server
- **THEN** the client filters tools by capability
- **AND** only tools matching the capability are registered

### Requirement: MCP Tool Invocation

The MCP client MUST invoke tools from MCP servers with validated parameters.

#### Scenario: Invoke MCP tool with valid parameters

- **WHEN** the MCP client invokes an MCP tool with parameters matching the schema
- **THEN** the tool executes on the MCP server
- **AND** the result is returned to the agent runtime
- **AND** the invocation is recorded in the event stream

#### Scenario: Invoke MCP tool with invalid parameters

- **WHEN** the MCP client invokes an MCP tool with parameters that don't match the schema
- **THEN** the invocation fails with a validation error
- **AND** the error is recorded in the event stream

### Requirement: MCP Connection Management

The MCP client MUST manage connections to MCP servers.

#### Scenario: Connect to MCP server

- **WHEN** the MCP client is configured to connect to an MCP server
- **THEN** the client establishes a connection to the server
- **AND** the connection status is tracked

#### Scenario: Disconnect from MCP server

- **WHEN** the MCP client is disconnected from an MCP server
- **THEN** the client closes the connection
- **AND** the connection status is updated

#### Scenario: Reconnect to MCP server

- **WHEN** the MCP client loses connection to an MCP server
- **THEN** the client attempts to reconnect
- **AND** the reconnection status is tracked

### Requirement: MCP Events

MCP operations MUST generate events in the event stream for observability.

#### Scenario: MCP connection event

- **WHEN** the MCP client connects to an MCP server
- **THEN** a mcp_connected event is emitted with server_name and timestamp
- **AND** the event is appended to the event stream

#### Scenario: MCP disconnection event

- **WHEN** the MCP client disconnects from an MCP server
- **THEN** a mcp_disconnected event is emitted with server_name and timestamp
- **AND** the event is appended to the event stream

#### Scenario: MCP tool invocation event

- **WHEN** the MCP client invokes an MCP tool
- **THEN** a mcp_tool_invocation event is emitted with tool_name, parameters, and timestamp
- **AND** the event is appended to the event stream

#### Scenario: MCP tool result event

- **WHEN** the MCP client receives a tool result
- **THEN** a mcp_tool_result event is emitted with tool_name, result, and timestamp
- **AND** the event is appended to the event stream