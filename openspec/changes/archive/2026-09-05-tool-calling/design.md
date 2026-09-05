## Context

The existing agent runtime (`src/runtime/agent-runtime.ts`) has basic tool invocation, but lacks a standardized protocol for tool definition, parameter validation, and result handling. The dynamic tool registry (`src/runtime/dynamic-tool-registry.ts`) manages tool state but doesn't provide the structured calling protocol needed for MCP server integration and advanced agent capabilities.

The event-sourced architecture (events in `src/store/event-store.ts`) provides the foundation for tool calling observability. The capability layer (`src/capabilities/`) shows the pattern for abstracting tool implementations.

## Goals / Non-Goals

**Goals:**
- Define a structured tool calling protocol following OpenAI's function calling pattern
- Implement a tool calling engine that validates parameters and handles errors
- Implement a tool registry that agents query to discover available tools
- Add dynamic tool creation with a TUI interface
- Add self-improvement loop that learns from tool usage patterns
- Generate tool calling events for observability
- Integrate tool calling with the agent runtime loop

**Non-Goals:**
- MCP server integration (separate change)
- Memory support (separate change)
- Specific tool implementations (shell, git, etc. - already exist)
- Tool chaining or complex orchestration (future work)

## Decisions

### Decision: Tool Definition Format

**Choice:** JSON Schema for parameter definitions, with TypeScript interfaces for type safety, following OpenAI's function calling pattern.

**Rationale:** JSON Schema is widely supported, self-documenting, and compatible with MCP protocol. TypeScript interfaces provide compile-time safety. The combination gives both runtime validation and type checking. Following OpenAI's pattern ensures compatibility with existing tool calling implementations.

**Alternatives considered:**
- Pure TypeScript interfaces: No runtime validation, poor MCP compatibility
- Custom schema format: Reinvents the wheel, no ecosystem support
- Protocol Buffers: Too heavy for this use case

### Decision: Tool Registry Architecture

**Choice:** Central registry with on-demand loading, queried by agents at runtime.

**Rationale:** Agents query the registry to discover available tools, not injecting them into context. This gives users full access to the context window and allows for dynamic tool loading. The registry is the single source of truth for tool availability.

**Alternatives considered:**
- Inject tools into context: Limits context window, not scalable
- Direct tool access: No central management, hard to track

### Decision: TUI Interface for Tool Authoring

**Choice:** Interactive TUI that appears during agent execution when a new tool needs to be created.

**Rationale:** The TUI presents background information to help users make informed decisions about tool design. It allows users to accept, modify, or reject tool proposals. This ensures the user has full control over tool creation while the agent can suggest new tools based on needs.

**Alternatives considered:**
- Standalone tool: User runs separately, less integrated
- Agent loop: No user control, less flexible

### Decision: Self-Improvement Loop

**Choice:** Analyze tool usage patterns to suggest and automatically create/improve tools.

**Rationale:** The system learns from tool usage patterns to identify opportunities for improvement. It can suggest new tools or improvements to existing tools. Auto-creation and auto-improvement can be configured. This allows the harness to evolve over time based on actual usage.

**Alternatives considered:**
- Manual improvement: Less automated, requires user intervention
- No improvement: Stagnant system, no growth

### Decision: Event Tracking

**Choice:** Every tool operation generates events in the event stream.

**Rationale:** The event-sourced architecture provides a natural foundation for tool calling observability. Every tool invocation, result, failure, and state change is recorded. This allows for analysis of tool usage patterns and self-improvement.

**Alternatives considered:**
- No event tracking: No observability, hard to debug
- Limited event tracking: Incomplete picture of tool usage

## Risks / Trade-offs

**Risk:** Tool calling protocol may be too rigid for future extensions.
**Mitigation:** Design the protocol to be extensible with optional fields and versioning.

**Risk:** Integration with existing agent runtime may introduce regressions.
**Mitigation:** Add comprehensive tests and verify existing tests pass.

**Risk:** Performance overhead from parameter validation.
**Mitigation:** Validate only when needed, cache validated schemas.

**Risk:** TUI interface may be too complex for users.
**Mitigation:** Provide clear documentation and examples, allow for simple accept/reject flow.

**Risk:** Self-improvement loop may create unwanted tools.
**Mitigation:** Allow configuration of auto-creation and auto-improvement, require user confirmation for tool creation.