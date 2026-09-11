## Context

Phase 1 delivered the provenance graph. Phase 2 delivered hooks and attestations. Phase 3 connects them: provenance data feeds into context management to replace positional trimming with intelligent pruning. This is the highest-value but highest-risk phase — changing what enters the context window can silently degrade agent quality.

The current ContextManager trims by dropping oldest messages. All messages are treated equally. The provenance graph now tells us which messages led to successful outcomes and which were dead ends.

## Goals / Non-Goals

**Goals:**
- Provenance-weighted context pruning (replace positional trimming)
- Tool result compression based on provenance references
- Hook-driven context assembly before each model call
- Provenance-aware memory scoring in MemoryRetrieval
- Token budget enforcement across context sections

**Non-Goals:**
- LLM-based relevance scoring (too expensive per turn)
- Real-time context streaming
- Cross-session memory promotion
- Automatic model routing based on attestation data

## Decisions

### D1: ProvenanceContextManager Extends ContextManager

**Decision:** Create `ProvenanceContextManager` that extends `ContextManager` with a `setProvenanceGraph(graph)` method. When graph is available, use provenance scoring. When unavailable, fall back to positional.

**Rationale:** Drop-in replacement — same interface. Backward-compatible. Graceful degradation. No changes to AgentRuntime's ContextManager type.

**Scoring formula:**
```
base_priority:
  system_message:  1000  (never prune)
  goal_message:     900
  commitment_msg:   800
  verification_msg: 700
  exploration_msg:  500
  other:            300

outcome_score:
  linked_to_success: +200
  linked_to_failure: -100
  dead_end:          -200
  no_link:             0

final = base_priority + outcome_score
```

**Alternatives:** Replace ContextManager entirely (unnecessary); LLM scoring (expensive).

### D2: Tool Result Compression via Provenance References

**Decision:** When a tool result exceeds 2000 tokens and has provenance links, compress to referenced content only. Store event ID as full reference for audit.

**Rationale:** Tool results are 40-60% of context. Compression is the highest-leverage token saving. Provenance graph tells exactly which parts were used. Lossy but auditable.

**Compression flow:**
```
tool_result > threshold
  AND provenance.has_commitment_link(tool_call_id)
    → referenced = provenance.get_referenced_lines(tool_call_id)
    → compressed = summarize(result, referenced)
    → full_ref = result.event_id
tool_result <= threshold
    → keep as-is
```

**Alternatives:** Always compress (wasteful for small results); LLM summarization (expensive).

### D3: before_model_call Hook for Dynamic Assembly

**Decision:** A built-in `before_model_call` hook queries the provenance graph to assemble context. This hook is registered by default, not by external modules.

**Rationale:** Context assembly is core behavior, not an extension point. The hook mechanism from Phase 2 is the integration point, but the assembly logic lives in `src/memory/provenance-context.ts`.

**Assembly flow:**
```
1. Get current Goal from provenance graph
2. Retrieve memories relevant to Goal (via provenance scoring)
3. Compress previous turns to summaries (via provenance chain)
4. Allocate token budget across sections
5. Assemble: [system, goal_context, summary, memories, current_input]
```

**Alternatives:** Inline in AgentRuntime (couples context assembly to runtime); external hook (core behavior shouldn't be opt-in).

### D4: Memory Scoring with Provenance Weights

**Decision:** Add `provenanceScore` to memory retrieval results. Score computed from provenance links: +1.0 for success-linked, -0.5 for dead-end-linked, 0 for unlinked.

**Rationale:** Simple additive score. Doesn't replace existing relevance scoring — augments it. `final_score = relevance_score + provenance_weight * provenance_score`.

**Alternatives:** Replace relevance scoring (too aggressive); separate provenance ranking (loses relevance signal).

### D5: Token Budget Allocation

**Decision:** Fixed allocation percentages with dynamic adjustment:
- System prompt: fixed (never pruned)
- Goal context: 25% of remaining budget
- Provenance summary: 15%
- Compressed history: 40%
- Retrieved memories: 20%

**Rationale:** Predictable. Goal context always has space. History gets the most because it's the model's working memory. Memories are supplementary.

**Alternatives:** Dynamic allocation based on content length (complex, unpredictable); equal split (wastes budget on low-value sections).

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|---|---|---|
| Context pruning regression | HIGH — could degrade agent quality | Positional fallback; A/B tests; debug logging |
| Compression losing relevant detail | MEDIUM — model might need compressed content | Full reference preserved; threshold prevents over-compression |
| Hot-path performance | MEDIUM — runs before every model call | Provenance lookup O(1); compression threshold-gated; target <10μs |
| Provenance graph stale/empty | LOW — fallback handles gracefully | Positional pruning when graph unavailable |
