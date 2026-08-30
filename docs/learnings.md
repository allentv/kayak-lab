# Learnings

This file captures patterns, decisions, and gotchas discovered during kayak-lab development. Agents reference this automatically via config.yaml context.

---

## OpenSpec

- Schema: `spec-driven` (proposal → specs → design → tasks)
- Delta specs must use `## ADDED/MODIFIED/REMOVED/RENAMED Requirements` headers
- Each requirement must include at least one `#### Scenario:` block
- `openspec validate <change-name>` validates all artifacts
- `openspec instructions apply --change <name> --json` returns context files and progress
- Tasks tracked via checkboxes: `- [ ]` pending, `- [x]` complete
- Archive requires all artifacts done and all tasks complete (or user confirmation)

## Event Sourcing

- Events are immutable and append-only
- Sequence numbers must be monotonically increasing (no gaps)
- Session isolation: events from session A never appear in session B
- Schema versioning is critical for forward compatibility
- Start with in-memory store, add persistence later
- `EventStream.append()` takes a single `AppendEventInput` object — not separate session_id + event args
- Sequence numbers start at 1, not 0 — `getCurrentSequence()` returns 0 for new sessions; next = `getCurrentSequence() + 1`
- Event types use dot notation with `ui.` prefix for user input: `ui.user.input`, not `user.input`
- Event arrays are frozen after retrieval — `getEvents()` returns `Object.freeze([...events])`
- `EventStoreBridge.connect()` performs one-shot backfill but does not subscribe to new events — known gap

## Agent Runtime

- Provider abstraction must hide streaming differences (Anthropic vs OpenAI delta formats)
- Context window management requires truncation/summarization strategy
- Tool invocation needs timeout and error handling at the abstraction layer
- AgentRuntime has hard-coded 10-iteration safety limit — not configurable via AgentConfig
- `AgentRuntime.appendEvent()` casts event type with `as any` — should accept `EventType` instead of `string`

## Interface Design

- `ISessionManager` uses compound method names (`createSession()`, `pauseSession()`) to avoid ambiguity when composed with other interfaces
- Session manager returns immutable clones via `cloneSession()` — never store a returned Session reference
- `CapabilityResult<T>` wraps success/data/error pattern — only `ensureInitialized()` throws

## Capabilities

- Abstract interfaces enable testing with mocks
- Typed parameters and results prevent runtime errors
- Safety constraints (timeouts, output limits) are mandatory for shell execution
- Shell capability has dual-layer safety: `BLOCKED_COMMANDS` always rejected; `DANGEROUS_COMMANDS` return 'requires approval'

## Deno / TypeScript Patterns

- Deno.Command requires `--allow-run` permission — shell capability tests fail without it
- Error class `cause` property needs `override` keyword in strict mode: `override readonly cause?: Error`
- Generic type params cause assignability issues in test callbacks — use `unknown` and cast inside handler
- `mod.ts` barrel files separate type exports from value exports for tree-shaking
- Custom error assertion: use manual try/catch when verifying specific error properties (e.g., `error.name`)

## Projection Protocol

- WebSocket provides bidirectional real-time communication
- Reconnection must handle event gaps (resume from last received event)
- Ordered delivery is non-negotiable for event-sourced systems

## Testing Patterns

- `Deno.test` with async `t.step` for nested test organization
- Mock providers implement `IModelProvider` with configurable responses and failure flags
- Test context objects (`CapabilityContext`, `ToolContext`) provide minimal required fields
