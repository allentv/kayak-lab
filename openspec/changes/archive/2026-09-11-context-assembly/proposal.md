## Why

Phases 1 and 2 delivered the provenance graph and hook system. Now we connect them: provenance data feeds back into context management to replace positional trimming with intelligent, provenance-weighted pruning. This is where the 50-80% token savings materialize. The current ContextManager drops the oldest messages regardless of value — tool results from dead-end explorations compete equally with critical commitment messages for limited context slots.

## What Changes

- **Provenance-aware ContextManager**: Extended ContextManager that uses provenance graph data to score message priority. Goal messages always retained; commitment/verification messages prioritized; dead-end exploration messages deprioritized for pruning.

- **Tool result compression**: When a tool result exceeds a size threshold and has provenance links, compress it to only the content referenced in downstream reasoning. Full result preserved on disk for audit.

- **Hook-driven context assembly**: A `before_model_call` hook that queries the provenance graph to assemble context dynamically — retrieving only task-relevant memories, compressing previous turns to summaries, and respecting token budgets.

- **Provenance-weighted memory scoring**: MemoryRetrieval ranks memories based on their provenance links — memories linked to successful outcomes score higher than those linked to dead ends.

## Capabilities

### New Capabilities

- `memory/provenance-context`: Provenance-weighted context pruning, tool result compression, hook-driven context assembly, token budget enforcement.

### Modified Capabilities

- `runtime/agent-runtime`: ProvenanceContextManager replaces ContextManager. `before_model_call` hook wired in.
- `memory/retrieval`: Provenance-aware scoring integrated into ranking algorithm.

## Non-Goals

- LLM-based relevance scoring (too expensive per turn).
- Real-time context streaming.
- Cross-session memory promotion based on provenance.
- Automatic model routing based on attestation data (future optimization).

## Risks

- **Context pruning regression**: Incorrect scoring could drop critical context, degrading agent quality. Mitigation: positional fallback when provenance data insufficient; A/B comparison tests; debug logging for pruning decisions.
- **Compression losing relevant detail**: Compressed tool results might miss content the model needs. Mitigation: full reference preserved; threshold prevents aggressive compression; fallback to full result on model request.
- **Performance overhead in hot path**: Context assembly runs before every model call. Mitigation: provenance lookup is O(1); compression is threshold-gated; total overhead target <10μs per call.
