## 1. AgentRuntime L3 Integration

- [x] 1.1 Add `agentId` to `AgentConfig` interface. Use existing `memoryProvider` (from `memoryComponents`) for core memory lookup. Verify: `deno check src/runtime/agent-runtime.ts` passes.

- [x] 1.2 In `AgentRuntime.start()`, after the session is created, call `readCore(agentId)` if `memoryProvider` is available. Format core memory sections into a system prompt section: `## Agent Identity\n- key: value` for each section. Store in private `coreMemoryText` field. Verify: `deno check src/runtime/agent-runtime.ts` passes.

- [x] 1.3 In `AgentRuntime.buildModelRequest()`, prepend the core memory section to the first system message (or create one if none exists). Ensure the core memory is part of the system prompt budget. Verify: `deno check src/runtime/agent-runtime.ts` passes.

- [x] 1.4 Add L2/L3 methods to `IMemoryProvider` interface. Verify: `deno check src/memory/provider.ts` passes.

## 2. PatternAnalyzer L2 Integration

- [x] 2.1 Add `memoryProvider: IMemoryProvider` parameter to `PatternAnalyzer` constructor. Make it optional (backward compatible). Verify: `deno check src/runtime/pattern-analyzer.ts` passes.

- [x] 2.2 In `PatternAnalyzer.generateReport()`, after analyzing tool trends, check for degrading tools with `changeMagnitude > 0.1`. If found, call `memoryProvider.writeScenario()` with path `patterns.tool-failure.<toolName>` and content containing the trend details. Verify: `deno check src/runtime/pattern-analyzer.ts` passes.

- [x] 2.3 In `PatternAnalyzer.generateReport()`, after analyzing session efficiency, check for sessions with `score < 0.3`. If found, call `memoryProvider.writeScenario()` with path `patterns.efficiency.low-score` and content containing the efficiency details. Verify: `deno check src/runtime/pattern-analyzer.ts` passes.

- [x] 2.4 Add `writePatterns: boolean` to `PatternAnalyzer` constructor options. Default to `true`. When `false`, no scenarios are written. Verify: `deno check src/runtime/pattern-analyzer.ts` passes.

## 3. MemoryRetrieval L2/L3 Integration

- [x] 3.1 Add `storage: IMemoryStorage` parameter to `MemoryRetrieval` constructor. Make it optional. Verify: `deno check src/memory/retrieval.ts` passes.

- [x] 3.2 In `MemoryRetrieval.retrieve()`, if `storage` is provided, query `listScenarios(agentId)` for L2 scenarios and `readCore(agentId)` for L3 core. Include these in the results alongside standard memories. Verify: `deno check src/memory/retrieval.ts` passes.

- [x] 3.3 Add `agentId` to `RetrievalOptions`. When set, L2/L3 queries use this agent ID. When not set, L2/L3 queries are skipped. Verify: `deno check src/memory/retrieval.ts` passes.

- [x] 3.4 Update `MemoryRetrievalResult` to include `memory_type` field (already has `memory.type`). Ensure L2/L3 entries are scored by content relevance (simple substring match) and provenance. Verify: `deno check src/memory/retrieval.ts` passes.

## 4. Context Budget Integration

- [x] 4.1 In `ProvenanceContextManager.assembleContext()`, update the system prompt section to include L3 core memory content (already injected by AgentRuntime). No change needed if L3 is part of the system prompt. Verify: `deno check src/memory/provenance-context.ts` passes.

- [x] 4.2 In `ProvenanceContextManager.createBeforeModelCallHook()`, ensure L2 scenario content is injected in the `memoriesPercent` bucket. Add a `scenariosPercent` bucket (steal from `historyPercent` — 40% → 35%) and allocate 5% to scenarios. Verify: `deno check src/memory/provenance-context.ts` passes.

- [x] 4.3 Update `DEFAULT_BUDGET` in `provenance-context-types.ts` to add `scenariosPercent: 5` and reduce `historyPercent` from 40 to 35. Verify: `deno check src/memory/provenance-context-types.ts` passes.

## 5. Tests

- [x] 5.1 Create `src/runtime/__tests__/agent-runtime-l3.test.ts`. Test: start() loads core memory and injects into system prompt; start() works without memory storage (no core); system prompt includes core sections formatted correctly; system prompt is unchanged when no core memory exists. Verify: `deno test --allow-read --allow-write --allow-env --allow-ffi src/runtime/__tests__/agent-runtime-l3.test.ts` passes.

- [x] 5.2 Create `src/runtime/__tests__/pattern-analyzer-l2.test.ts`. Test: generateReport writes scenario on degrading tool; generateReport writes scenario on low efficiency; generateReport does not write when no patterns; writePatterns=false disables writing. Verify: `deno test --allow-read --allow-write --allow-env --allow-ffi src/runtime/__tests__/pattern-analyzer-l2.test.ts` passes.

- [x] 5.3 Create `src/memory/__tests__/retrieval-l2l3.test.ts`. Test: retrieve returns L2/L3 alongside standard memories; retrieve with type filter returns only matching type; retrieve with agentId returns L2/L3 for that agent; retrieve without agentId skips L2/L3. Verify: `deno test --allow-read --allow-write --allow-env --allow-ffi src/memory/__tests__/retrieval-l2l3.test.ts` passes.

- [x] 5.4 Run full test suite: `deno task verify`. Verify: all checks, lint, and tests pass with no regressions.