## 1. Tool Definition

- [ ] 1.1 Define `IToolDefinition` interface with name, description, parameters (JSON Schema), and return type. Verify: `deno check` passes
- [ ] 1.2 Implement `ToolDefinition` class that validates tool definitions and provides schema validation. Verify: `deno test` passes
- [ ] 1.3 Add tool definition registry to store and retrieve tool definitions by name. Verify: can register and lookup tools

## 2. Tool Calling Engine

- [ ] 2.1 Create `ToolCallingEngine` interface with invoke, validate, and result handling methods. Verify: `deno check` passes
- [ ] 2.2 Implement parameter validation using JSON Schema. Verify: valid parameters pass, invalid parameters fail with descriptive error
- [ ] 2.3 Implement tool invocation with timeout support. Verify: tool executes within timeout, times out if exceeded
- [ ] 2.4 Implement result formatting with exit_code, stdout, stderr, duration_ms. Verify: results are properly formatted

## 3. Tool Registry

- [ ] 3.1 Create `IToolRegistry` interface with register, unregister, list, get, enable, disable methods. Verify: `deno check` passes
- [ ] 3.2 Implement `ToolRegistry` class with on-demand loading and state management. Verify: `deno test` passes
- [ ] 3.3 Add tool discovery by capability and category. Verify: can find tools by capability or category
- [ ] 3.4 Add tool registry events (tool_registered, tool_state_changed). Verify: events are emitted on state changes

## 4. Agent Runtime Integration

- [ ] 4.1 Extend `AgentRuntime` to support tool calling via the new protocol. Verify: agent can invoke tools through the protocol
- [ ] 4.2 Add tool selection logic based on agent input. Verify: agent selects appropriate tool based on request
- [ ] 4.3 Implement tool call error handling in the agent loop. Verify: errors are handled gracefully and reported to agent
- [ ] 4.4 Add tool calling to the agent event loop. Verify: tool calls are part of the agent's execution cycle

## 5. Event Stream Integration

- [ ] 5.1 Define `tool_invocation` event type with tool_name, parameters, timestamp. Verify: event type is registered and valid
- [ ] 5.2 Define `tool_result` event type with tool_name, exit_code, stdout, stderr, duration_ms. Verify: event type is registered and valid
- [ ] 5.3 Emit tool_invocation event on tool invocation. Verify: event is appended to event stream
- [ ] 5.4 Emit tool_result event on tool completion. Verify: event is appended to event stream

## 6. Tool Authoring TUI

- [ ] 6.1 Create `IToolAuthoring` interface with propose, accept, reject, modify methods. Verify: `deno check` passes
- [ ] 6.2 Implement TUI interface with interactive tool proposal display. Verify: TUI shows tool proposal with name, description, parameters, context
- [ ] 6.3 Implement tool proposal generation based on agent needs. Verify: generates tool proposals with background information
- [ ] 6.4 Implement user accept/reject/modify flow. Verify: user can accept, reject, or modify tool proposals
- [ ] 6.5 Add tool authoring events (tool_proposed, tool_created, tool_rejected). Verify: events are emitted on tool authoring operations

## 7. Self-Improvement Loop

- [ ] 7.1 Create `IToolSelfImprovement` interface with analyze, suggest, autoCreate, autoImprove methods. Verify: `deno check` passes
- [ ] 7.2 Implement tool usage pattern analysis. Verify: analyzes tool usage patterns to identify opportunities for improvement
- [ ] 7.3 Implement tool suggestion generation. Verify: generates tool suggestions based on usage patterns
- [ ] 7.4 Implement automatic tool creation. Verify: automatically creates tools based on usage patterns
- [ ] 7.5 Implement automatic tool improvement. Verify: automatically improves tools based on usage patterns
- [ ] 7.6 Add self-improvement events (tool_suggested, tool_auto_created, tool_auto_improved). Verify: events are emitted on self-improvement operations
- [ ] 7.7 Add self-improvement configuration (auto-creation, auto-improvement). Verify: configuration is stored and respected

## 8. Tests

- [ ] 8.1 Write unit tests for tool definition validation. Verify: `deno test` passes
- [ ] 8.2 Write unit tests for tool calling engine (parameter validation, invocation, timeout). Verify: `deno test` passes
- [ ] 8.3 Write unit tests for tool registry (register, unregister, list, get, enable, disable). Verify: `deno test` passes
- [ ] 8.4 Write unit tests for agent runtime integration. Verify: `deno test` passes
- [ ] 8.5 Write unit tests for event stream integration. Verify: `deno test` passes
- [ ] 8.6 Write unit tests for tool authoring TUI. Verify: `deno test` passes
- [ ] 8.7 Write unit tests for self-improvement loop. Verify: `deno test` passes
- [ ] 8.8 Verify existing 112+ tests still pass. Verify: `deno test --allow-read --allow-env --allow-run` passes