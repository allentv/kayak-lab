## Purpose

Agent execution loop with context management, model abstraction, and tool invocation. The agent loop is the core runtime that processes user input, makes decisions, and executes tools.

## ADDED Requirements

### Requirement: Agent loop execution

The agent loop MUST process user input, invoke models, and execute tools in a continuous cycle.

#### Scenario: Process user input
- **WHEN** user input is received
- **THEN** the agent loop processes the input, updates context, and generates a response

#### Scenario: Model invocation
- **WHEN** the agent needs to make a decision
- **THEN** the agent loop invokes the configured model with appropriate context

#### Scenario: Tool invocation
- **WHEN** the agent determines a tool is needed
- **THEN** the agent loop invokes the tool with appropriate parameters and handles the result

### Requirement: Context management

The agent loop MUST maintain conversation context across interactions.

#### Scenario: Context accumulation
- **WHEN** multiple interactions occur in a session
- **THEN** the context accumulates relevant history for model invocation

#### Scenario: Context window management
- **WHEN** the context exceeds the model's window limit
- **THEN** the agent loop truncates or summarizes older context while preserving key information

### Requirement: Tool execution

Tools MUST be invoked through an abstract interface with typed parameters and results.

#### Scenario: Tool invocation
- **WHEN** the agent invokes a tool
- **THEN** the tool receives typed parameters and returns a typed result

#### Scenario: Tool failure handling
- **WHEN** a tool invocation fails
- **THEN** the agent loop captures the error, updates context, and continues execution

#### Scenario: Tool timeout
- **WHEN** a tool invocation exceeds the configured timeout
- **THEN** the agent loop cancels the invocation and reports a timeout error
