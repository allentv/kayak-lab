## Purpose

Extensible hook system wired into AgentRuntime at lifecycle boundaries, enabling external modules to observe and extend agent behavior without modifying core runtime code.

## ADDED Requirements

### Requirement: Hook Registration

External modules MUST be able to register async functions at specific lifecycle points.

#### Scenario: Register a hook at a lifecycle point
- **WHEN** a module calls `register(hookPoint, asyncFn)` on the hook registry
- **THEN** the function is stored and will be called when that lifecycle point is reached

#### Scenario: Register multiple hooks at the same point
- **WHEN** multiple functions are registered at the same lifecycle point
- **THEN** all functions are called in registration order when the point is reached

#### Scenario: Unregister a hook
- **WHEN** a module calls `unregister(hookId)`
- **THEN** the function is removed and no longer called

#### Scenario: Hot-registration after runtime start
- **WHEN** a hook is registered while the runtime is already running
- **THEN** the hook is active for the next invocation of its lifecycle point

### Requirement: Lifecycle Points

The system MUST expose hooks at five lifecycle boundaries in AgentRuntime.

#### Scenario: before_model_call
- **WHEN** the agent is about to invoke the model
- **THEN** all registered `before_model_call` hooks are called with session state, context messages, and a mutable context object

#### Scenario: after_tool_execution
- **WHEN** a tool call completes (success or failure)
- **THEN** all registered `after_tool_execution` hooks are called with tool name, parameters, result, and session state

#### Scenario: turn_end
- **WHEN** the agent turn ends
- **THEN** all registered `turn_end` hooks are called with turn summary, provenance nodes, and session state

#### Scenario: session_start
- **WHEN** a session is created or resumed
- **THEN** all registered `session_start` hooks are called with session ID and initial state

#### Scenario: session_end
- **WHEN** a session transitions to "completed" or "cancelled"
- **THEN** all registered `session_end` hooks are called with session summary and attestation data

### Requirement: Hook Dispatch

Hooks MUST be called with configurable timeout and error handling.

#### Scenario: Hook timeout enforcement
- **WHEN** a hook function exceeds the configured timeout (default 5000ms)
- **THEN** the hook is terminated, an error is logged, and the runtime continues

#### Scenario: Hook error does not block runtime
- **WHEN** a hook function throws an error
- **THEN** the error is logged, the hook is skipped, and the runtime continues normal execution

#### Scenario: before_model_call hook modifies context
- **WHEN** a `before_model_call` hook modifies the context object
- **THEN** the model is invoked with the modified context

### Requirement: Hook Registry Scope

Hooks MUST support session-scoped or global registration.

#### Scenario: Session-scoped hook
- **WHEN** a hook is registered with a session ID
- **THEN** it only fires for that session

#### Scenario: Global hook
- **WHEN** a hook is registered without a session ID
- **THEN** it fires for all sessions
