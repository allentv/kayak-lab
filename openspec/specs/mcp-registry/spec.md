# mcp-registry Specification

## Purpose
An MCP tool registry (separate from the internal tool registry) for managing tools from external MCP servers, with support for tool discovery and state management.

## Requirements

### Requirement: MCP Tool Registry

The MCP registry MUST provide a central place for MCP tool discovery and management.

#### Scenario: Register MCP tool

- **WHEN** an MCP tool is discovered from an MCP server
- **THEN** the tool is stored and retrievable by name
- **AND** the tool is marked as enabled by default

#### Scenario: Unregister MCP tool

- **WHEN** an MCP tool is unregistered from the registry
- **THEN** the tool is removed and no longer available
- **AND** any active invocations are terminated

#### Scenario: List MCP tools

- **WHEN** a component requests MCP tools
- **THEN** a list of MCP tool definitions is returned with name, description, and parameter schemas
- **AND** the list includes only tools that are currently enabled

#### Scenario: Get MCP tool by name

- **WHEN** a component requests an MCP tool by name
- **THEN** the tool definition is returned if it exists
- **AND** an error is returned if the tool does not exist

### Requirement: MCP Tool State Management

MCP tools MUST have configurable state (enabled/disabled) that can be changed at runtime.

#### Scenario: Enable MCP tool

- **WHEN** an MCP tool is enabled
- **THEN** it becomes available for invocation
- **AND** the state change is recorded in the event stream

#### Scenario: Disable MCP tool

- **WHEN** an MCP tool is disabled
- **THEN** it is no longer available for invocation
- **AND** any active invocations are terminated
- **AND** the state change is recorded in the event stream

### Requirement: MCP Tool Discovery

The MCP registry MUST support discovering MCP tools by capability or category.

#### Scenario: Discover MCP tools by capability

- **WHEN** a component requests MCP tools with a specific capability
- **THEN** a list of MCP tools matching that capability is returned
- **AND** only enabled tools are included

#### Scenario: Discover MCP tools by category

- **WHEN** a component requests MCP tools in a specific category
- **THEN** a list of MCP tools in that category is returned
- **AND** only enabled tools are included

### Requirement: MCP Tool Registry Events

MCP registry operations MUST generate events in the event stream for observability.

#### Scenario: MCP tool registration event

- **WHEN** an MCP tool is registered
- **THEN** a mcp_tool_registered event is emitted with tool_name and timestamp
- **AND** the event is appended to the event stream

#### Scenario: MCP tool state change event

- **WHEN** an MCP tool's state changes (enabled/disabled)
- **THEN** a mcp_tool_state_changed event is emitted with tool_name, old_state, new_state, and timestamp
- **AND** the event is appended to the event stream
