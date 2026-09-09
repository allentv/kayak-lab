## Context

kayak-lab is event-sourced: EventStream → EventStore → QueryEngine. Events are flat sequences ordered by sequence_number. No causal relationships between events. AgentRuntime is a monolithic loop: input → model → tool → response. No structured reasoning trace.

Phase 1 adds the foundational data layer: causal event linking and a provenance graph that tracks agent reasoning chains.

## Goals / Non-Goals

**Goals:**
- `causal_parents` field on BaseEvent, backward-compatible
- In-memory adjacency list for causal graph construction
- Provenance graph with typed nodes and rule-based classifier
- JSONL persistence for provenance graphs
- Traversal queries (causal chain, downstream, independent chains)

**Non-Goals:**
- Hook system, attestations, context assembly (Phase 2/3)
- REST API for provenance data (Phase 2)
- Cross-session graph queries
- Cryptographic signatures on nodes

## Decisions

### D1: Causal Parents as Optional Array on BaseEvent

**Decision:** Add `causal_parents?: string[]` to BaseEvent. Defaults to empty array.

**Rationale:** Backward-compatible. Optional — not all events need causal tracking. ~50-100 bytes per event. Queryable via lazy graph construction at query time.

**Alternatives:** Separate causal index table (duplicates IDs, sync risk); required field (forces meaningless parents on heartbeat events).

### D2: In-Memory Adjacency List for Event Graph

**Decision:** `buildCausalGraph()` constructs `Map<eventId, { event, children: string[] }>` lazily at query time, not at append time.

**Rationale:** No write-time overhead. Graph is session-scoped (typically <500 events). Construction is O(e) which is fast for session-sized data.

**Alternatives:** Build at append time (write overhead, stale if events are appended concurrently); SQLite graph (heavy dependency for session-scoped data).

### D3: ProvenanceGraph as Separate Module

**Decision:** New `src/provenance/` module with its own types, graph, and classifier. Not embedded in EventStore.

**Rationale:** Separation of concerns — EventStore handles persistence, ProvenanceGraph handles reasoning trace. Different lifecycle (graph is session-scoped, EventStore is process-scoped). Easier to test in isolation.

**Alternatives:** Embed in EventStore (coupling); separate microservice (overkill).

### D4: Rule-Based Tool Call Classifier

**Decision:** Deterministic mapping from tool names/categories to provenance types. No ML, no heuristics.

**Rationale:** Predictable, testable, zero runtime cost. Tool names are known at registration time. Edge cases (ambiguous tools) default to Exploration (safe default — exploration is the least committal classification).

**Alternatives:** LLM-based classification (expensive, non-deterministic); heuristic scoring (complex, hard to test).

### D5: JSONL Persistence at Turn End

**Decision:** Write complete provenance graph to `<dataDir>/<sessionId>.provenance.json` at each turn end (when PatchProposal is created).

**Rationale:** Same pattern as EventStore persistence. Atomic write (temp + rename). Enables session resume. Turn-end write amortizes I/O across the turn.

**Alternatives:** Write per-node (excessive I/O); write only at session end (lose data on crash).

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|---|---|---|
| Graph memory growth per session | Low — session-scoped, GC on completion | Cap at 1000 nodes; warn at 500 |
| Classifier misclassification | Medium — wrong provenance chain | Log misclassifications; extensible rules |
| JSONL file size for long sessions | Low — one file per session | Compression if >1MB; archival on completion |
| Backward compat of BaseEvent change | Low — optional field | Tests verify old events work without field |
