## Why

The L2 (Scenario) and L3 (Core) structured memory types are implemented and tested, but they are not wired into the runtime. Agents can't load their identity from L3 at session start, self-evolution patterns can't accumulate into L2 scenario files, and the memory retrieval system doesn't know about L2/L3 content. This change completes the integration so agents can actually use structured memory.

## What Changes

- **AgentRuntime loads L3 Core at session start**: When `AgentRuntime.start()` is called, it reads `CoreMemory` for the agent and injects sections (name, goals, constraints, personality) into the system prompt. This gives agents persistent identity across sessions.
- **PatternAnalyzer writes L2 Scenarios on pattern detection**: When `PatternAnalyzer.generateReport()` detects a recurring pattern (e.g., tool failure clusters, efficiency trends), it writes a scenario file under a `patterns.*` prefix. This enables self-evolution to accumulate knowledge as structured documents.
- **MemoryRetrieval includes L2/L3 in search**: `MemoryRetrieval.retrieve()` is extended to return `ScenarioMemory` and `CoreMemory` alongside standard memories, scored by relevance and provenance. L2 scenarios are searched by content match; L3 core is always included as context.

## Capabilities

### Modified Capabilities

- `memory/structured-knowledge` (L2): PatternAnalyzer writes to scenario storage, retrieval includes L2 content in search results.
- `memory/agent-identity` (L3): AgentRuntime loads core memory at session start, injects sections into system prompt.

### New Capabilities

- `memory/context-integration`: L2/L3 content is injected into the context window with proper budget management (respecting the 9000-token limit).

## Scope

- **In scope**: AgentRuntime wiring, PatternAnalyzer wiring, MemoryRetrieval extension, context budget integration.
- **Out of scope**: External knowledge sources, cross-agent knowledge sharing, full-text search (FTS5), UI for managing L2/L3 content.