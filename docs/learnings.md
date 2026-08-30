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

## Agent Runtime

- Provider abstraction must hide streaming differences (Anthropic vs OpenAI delta formats)
- Context window management requires truncation/summarization strategy
- Tool invocation needs timeout and error handling at the abstraction layer

## Capabilities

- Abstract interfaces enable testing with mocks
- Typed parameters and results prevent runtime errors
- Safety constraints (timeouts, output limits) are mandatory for shell execution

## Projection Protocol

- WebSocket provides bidirectional real-time communication
- Reconnection must handle event gaps (resume from last received event)
- Ordered delivery is non-negotiable for event-sourced systems
