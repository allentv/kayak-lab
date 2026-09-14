## Context

The memory subsystem currently has:
- `IMemoryStorage` interface with `store`, `retrieve`, `delete`, `list` methods
- `MemoryProvider` consumer-facing abstraction with event emission
- SQLite backend implementing both `IPersistenceBackend` and `IMemoryStorage`
- `MemoryType` union: `"short_term" | "long_term" | "episodic" | "semantic"`
- `AnyMemory` union type for all memory entries
- Existing `memories` SQLite table for standard memory entries
- `ProvenanceContextManager` assembling context windows with 8000-token default budget

All existing interfaces and tables remain unchanged. L2/L3 are additive.

## Goals / Non-Goals

**Goals:**
- Add `ScenarioMemory` (L2) and `CoreMemory` (L3) types to the type system
- Store L2/L3 in a dedicated `agent_memory` SQLite table (no migration of existing tables)
- Extend `IMemoryStorage` with L2/L3-specific methods
- Extend `MemoryProvider` with L2/L3 convenience methods and event emission
- Increase default `maxTokens` from 8000 to 9000 to accommodate overhead

**Non-Goals:**
- Wiring L3 into AgentRuntime system prompt loading (follow-up change)
- Wiring L2 into PatternAnalyzer for automatic pattern writing (follow-up change)
- MemoryRetrieval L2/L3 scoring and search integration (follow-up change)
- Cross-agent knowledge sharing or ACL (future consideration)

## Decisions

### D1: Separate table, not polymorphic `memories`

**Decision:** New `agent_memory` table, not extending the existing `memories` table with a `memory_type` discriminator.

**Rationale:** The existing `memories` table schema is optimized for generic key-value storage with metadata. L2/L3 have fundamentally different access patterns — L2 needs path-based lookup and prefix listing; L3 needs singleton-per-agent semantics. A dedicated table gives clean indexes and avoids polluting the generic schema with nullable columns. Zero migration risk to existing data.

**Alternatives considered:**
- Adding `memory_type = 'scenario' | 'core'` to `memories` table: Simpler but mixes access patterns, requires nullable `path`/`agent_id`/`sections` columns, and creates index bloat on the generic table.

### D2: Path as dot-notation string

**Decision:** L2 scenarios use dot-separated path strings (e.g., `git.workflow`, `error-handling.retry`).

**Rationale:** Dot-notation is a natural hierarchy for knowledge organization, trivially supports prefix listing (`WHERE path LIKE 'git.%'`), and avoids the complexity of a tree structure. Paths are unique per agent (composite unique index on `agent_id + path`).

### D3: Core memory sections as JSON

**Decision:** L3 core memory stores sections as a JSON text column (`sections TEXT`), parsed to/from `Record<string, string>` on read/write.

**Rationale:** SQLite has native JSON support, and sections are inherently key-value. JSON avoids a separate `core_sections` table and join overhead. Section keys are arbitrary strings (not schema-enforced) to allow agent-specific sections without migration.

### D4: Typed methods, not generic CRUD

**Decision:** Add typed `writeScenario`/`readScenario`/`listScenarios`/`deleteScenario`/`countScenarios` and `readCore`/`writeCore` methods to `IMemoryStorage`, not a generic `store(memory)` with runtime type discrimination.

**Rationale:** Typed methods give compile-time safety, self-documenting APIs, and clean method-level testing. The existing generic `store()` method stays for backward compatibility but L2/L3 consumers use the typed methods.

### D5: maxTokens increase with measurement

**Decision:** Increase default `maxTokens` from 8000 to 9000. Defer budget bucket optimization to real-world measurement.

**Rationale:** L2/L3 overhead is estimated at ~600 tokens (L3 core in system prompt: ~300 tokens, L2 scenarios in retrieval: ~300 tokens). A 1000-token increase provides headroom. The `memoriesPercent` bucket already exists but isn't enforced in the hook path — this is a pre-existing issue, not introduced by this change. Real data will show whether the budget needs restructuring.

## Risks / Trade-offs

- **R1: Context budget bypass.** The `createBeforeModelCallHook` inserts memories after `enforceBudget` runs. L2 retrieval could push context over the token limit. Mitigated by the 9000-token increase and capping L2 retrieval to 5 results. A follow-up should add a `scenariosPercent` budget bucket.

- **R2: No full-text search on L2 content.** Scenario content is stored as plain text. Search requires `LIKE` queries or loading all scenarios into memory. Acceptable for v1 since scenarios are small and few per agent. Full-text search (SQLite FTS5) is a natural follow-up.

- **R3: Core memory sections are untyped.** Section keys are arbitrary strings. No schema validation means agents can store malformed or conflicting sections. Acceptable for v1 — the system prompt assembly layer (follow-up change) will validate section structure.
