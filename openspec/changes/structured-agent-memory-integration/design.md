## Context

The L2/L3 storage layer is implemented: `ScenarioMemory` and `CoreMemory` types exist in `types.ts`, the `agent_memory` SQLite table stores L2/L3 data, and `MemoryProvider` exposes convenience methods. The deferred integration work connects these to three existing subsystems:

1. **AgentRuntime** — session start, system prompt assembly
2. **PatternAnalyzer** — pattern detection, scenario writing
3. **MemoryRetrieval** — retrieval, scoring, budget management

## Goals / Non-Goals

**Goals:**
- Wire L3 Core into AgentRuntime's system prompt at session start
- Wire PatternAnalyzer to write L2 Scenarios on pattern detection
- Extend MemoryRetrieval to include L2/L3 in search results
- Ensure L2/L3 content respects the 9000-token budget

**Non-Goals:**
- External knowledge sources or cross-agent sharing
- Full-text search (FTS5) on scenario content
- UI for managing L2/L3 content
- Automatic scenario cleanup or expiration

## Decisions

### D1: L3 Core as system prompt section (not a separate message)

**Decision:** Inject L3 core memory sections into the system prompt string, not as a separate message in the context.

**Rationale:** The system prompt is always included in the context window and counted in the system budget. By injecting L3 into the system prompt, we get consistent token budgeting and ensure the agent's identity is always available. The alternative (injecting as a system message in the hook) would bypass the budget enforcement.

### D2: PatternAnalyzer writes scenarios via MemoryProvider

**Decision:** `PatternAnalyzer` gets a reference to `MemoryProvider` and calls `writeScenario()` to write patterns.

**Rationale:** This keeps the pattern detection logic in PatternAnalyzer while delegating storage to the existing provider. The provider emits `memory_operation` events for observability. The PatternAnalyzer doesn't need to know about SQLite or the storage backend.

### D3: MemoryRetrieval retrieves L2/L3 by querying storage directly

**Decision:** `MemoryRetrieval` gets a reference to `IMemoryStorage` and queries L2/L3 directly during retrieval, scoring them alongside standard memories.

**Rationale:** L2/L3 data is in the `agent_memory` table, not the `memories` table. The existing retrieval function only queries `memories`. By adding L2/L3 retrieval directly, we avoid changing the existing retrieval function and keep the scoring consistent.

### D4: L2 scenarios in memoriesPercent budget

**Decision:** L2 scenario content is included in the `memoriesPercent` bucket (20% of remaining budget, ~1800 tokens at 9000 max). L3 core is part of the system prompt budget.

**Rationale:** L2 scenarios are retrieved memories, similar to semantic memories. They belong in the memories budget. L3 core is a fixed part of the agent's identity and belongs in the system prompt. This keeps the budget structure clean.

### D5: Scenario path prefixes for self-evolution

**Decision:** PatternAnalyzer writes scenarios under `patterns.*` prefix: `patterns.tool-failure.<toolName>`, `patterns.efficiency.low-score`, etc.

**Rationale:** This creates a clear namespace for machine-generated patterns. Users can write scenarios under any prefix. The prefix convention makes it easy to list all patterns and differentiate from user-authored knowledge.

## Risks / Trade-offs

- **R1: AgentRuntime depends on memory storage.** If memory storage is unavailable, L3 core won't be loaded. Mitigated by making L3 injection optional — if `readCore` returns null, the system prompt is unchanged. No error or failure.

- **R2: PatternAnalyzer writes may be noisy.** Frequent pattern writes could create many small scenario files. Mitigated by only writing when `changeMagnitude > 0.1` and not writing duplicates (upsert semantics on path).

- **R3: MemoryRetrieval L2/L3 scoring.** L2 scenarios are scored by content match, which is a simple string search. No semantic embedding. Acceptable for v1 — the scenarios are small and few.

- **R4: Token budget for L3 core.** If agent has many sections (10+), the core memory could be 500+ tokens, eating into the system prompt budget. Mitigated by keeping sections concise and monitoring token usage.