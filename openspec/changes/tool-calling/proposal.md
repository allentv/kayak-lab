## Why

The existing agent runtime has basic tool invocation, but lacks a standardized, extensible tool calling protocol that supports structured tool definitions, typed parameters, result validation, and graceful error handling. To enable MCP server integration and advanced agent capabilities, we need a robust tool calling layer that decouples tool definition from execution and supports the full lifecycle of tool invocations. This includes the ability for users to create new tools at runtime through a TUI interface, and a self-improvement loop that learns from tool usage patterns to suggest and automatically create new tools.

## What Changes

- Add a standardized tool calling protocol with structured tool definitions (name, description, parameters schema) following OpenAI's function calling pattern
- Implement a tool calling engine that validates parameters, executes tools, and returns typed results
- Implement a tool registry that agents query to discover available tools (not injected into context)
- Add dynamic tool creation with a TUI interface that presents background information for informed decisions
- Add self-improvement loop that learns from tool usage patterns and suggests/creates new tools
- Add tool calling events to the event stream for observability
- Add error handling and retry logic for tool calls
- Integrate tool calling with the agent runtime loop

## Capabilities

### New Capabilities

- `tool-calling`: Core tool calling protocol, engine, and integration with agent runtime
- `tool-registry`: Registry for tool discovery and management
- `tool-authoring`: TUI interface for dynamic tool creation
- `tool-self-improvement`: Self-improvement loop based on tool usage patterns

### Modified Capabilities

- `agent-runtime`: Extend to support structured tool calling with the new protocol

## Out of Scope

- MCP server integration (separate change)
- Memory support (separate change)
- Specific tool implementations (shell, git, etc. - already exist)
- Tool chaining or complex orchestration (future work)