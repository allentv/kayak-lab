## Purpose

A standardized tool calling protocol that enables agents to discover, invoke, and handle results from tools with structured definitions, typed parameters, and result validation, following OpenAI's function calling pattern.

## ADDED Requirements

### Requirement: Tool Definition

Tools MUST be defined with a structured schema that includes name, description, and parameter definitions following OpenAI's function calling format.

#### Scenario: Define a tool with parameters

- **WHEN** a tool is registered with name, description, and parameter schema (JSON Schema)
- **THEN** the tool definition is stored and retrievable by name
- **AND** the parameter schema validates input against the defined types

#### Scenario: Tool definition validation

- **WHEN** a tool definition is missing required fields (name, description, parameters)
- **THEN** registration fails with a descriptive error

### Requirement: Tool Invocation

The tool calling engine MUST invoke tools with validated parameters and return typed results.

#### Scenario: Invoke a tool with valid parameters

- **WHEN** a tool is invoked with parameters matching the schema
- **THEN** the tool executes and returns a result with exit_code, stdout, stderr
- **AND** the invocation is recorded in the event stream

#### Scenario: Invoke a tool with invalid parameters

- **WHEN** a tool is invoked with parameters that don't match the schema
- **THEN** the invocation fails with a validation error
- **AND** the error is recorded in the event stream

### Requirement: Tool Result Handling

Tool results MUST be handled with proper error handling, timeout support, and result formatting.

#### Scenario: Tool call succeeds

- **WHEN** a tool call completes successfully
- **THEN** the result is returned with exit_code 0 and stdout content
- **AND** the result is formatted for the agent runtime

#### Scenario: Tool call times out

- **WHEN** a tool call exceeds the configured timeout
- **THEN** the tool is terminated and a timeout error is returned
- **AND** the timeout is recorded in the event stream

#### Scenario: Tool call fails

- **WHEN** a tool call returns a non-zero exit code
- **THEN** the result includes the error output and exit code
- **AND** the failure is recorded in the event stream

### Requirement: Agent Runtime Integration

The agent runtime MUST support structured tool calling with the new protocol.

#### Scenario: Agent selects and invokes a tool

- **WHEN** the agent runtime receives a tool invocation request
- **THEN** the tool is looked up by name from the registry
- **AND** parameters are validated against the tool schema
- **AND** the tool is executed with the validated parameters
- **AND** the result is returned to the agent runtime

#### Scenario: Agent handles tool call errors

- **WHEN** a tool call fails (validation error, timeout, or execution failure)
- **THEN** the agent runtime receives an error result
- **AND** the error is handled according to the configured error handling strategy

### Requirement: Tool Calling Events

Tool calls MUST generate events in the event stream for observability.

#### Scenario: Tool invocation event

- **WHEN** a tool is invoked
- **THEN** a tool_invocation event is emitted with tool_name, parameters, and timestamp
- **AND** the event is appended to the event stream

#### Scenario: Tool result event

- **WHEN** a tool call completes (success or failure)
- **THEN** a tool_result event is emitted with tool_name, exit_code, stdout, stderr, duration_ms
- **AND** the event is appended to the event stream