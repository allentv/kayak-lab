# tool-registry Specification

## Purpose

A registry for tool discovery and management that agents query to find available tools, with support for on-demand loading and tool lifecycle management.

## Requirements

### Requirement: Tool Registry

The registry MUST provide a central place for tool discovery and management.

#### Scenario: Register a tool

- **WHEN** a tool definition is registered with the registry
- **THEN** the tool is stored and retrievable by name
- **AND** the tool is marked as enabled by default

#### Scenario: Unregister a tool

- **WHEN** a tool is unregistered from the registry
- **THEN** the tool is removed and no longer available
- **AND** any active invocations are terminated

#### Scenario: List available tools

- **WHEN** a component requests available tools
- **THEN** a list of tool definitions is returned with name, description, and parameter schemas
- **AND** the list includes only tools that are currently enabled

#### Scenario: Get tool by name

- **WHEN** a component requests a tool by name
- **THEN** the tool definition is returned if it exists
- **AND** an error is returned if the tool does not exist

### Requirement: Tool State Management

Tools MUST have configurable state (enabled/disabled) that can be changed at runtime.

#### Scenario: Enable a tool

- **WHEN** a tool is enabled
- **THEN** it becomes available for invocation
- **AND** the state change is recorded in the event stream

#### Scenario: Disable a tool

- **WHEN** a tool is disabled
- **THEN** it is no longer available for invocation
- **AND** any active invocations are terminated
- **AND** the state change is recorded in the event stream

### Requirement: Tool Discovery

The registry MUST support discovering tools by capability or category.

#### Scenario: Discover tools by capability

- **WHEN** a component requests tools with a specific capability
- **THEN** a list of tools matching that capability is returned
- **AND** only enabled tools are included

#### Scenario: Discover tools by category

- **WHEN** a component requests tools in a specific category
- **THEN** a list of tools in that category is returned
- **AND** only enabled tools are included

### Requirement: Tool Registry Events

Registry operations MUST generate events in the event stream for observability.

#### Scenario: Tool registration event

- **WHEN** a tool is registered
- **THEN** a tool_registered event is emitted with tool_name and timestamp
- **AND** the event is appended to the event stream

#### Scenario: Tool state change event

- **WHEN** a tool's state changes (enabled/disabled)
- **THEN** a tool_state_changed event is emitted with tool_name, old_state, new_state, and timestamp
- **AND** the event is appended to the event stream
