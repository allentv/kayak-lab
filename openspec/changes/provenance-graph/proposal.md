## Why

The agent runtime records events as flat sequences. You can see *what* happened but not *why*. When a tool call produces unexpected results, there's no way to trace back to the user request that caused it, the exploration that informed it, or the verification that validated it. This makes debugging agent reasoning opaque and prevents downstream features (intelligent context assembly, cost attribution, provenance-aware memory retrieval) from functioning.

## What Changes

- **Causal parent field on events**: `BaseEvent` gains an optional `causal_parents: string[]` field linking each event to the events that caused it. Backward-compatible — existing events without the field are treated as roots.

- **Causal graph construction**: `EventStore` gains the ability to build an in-memory adjacency list from flat events using causal_parents, enabling graph queries over event dependencies.

- **Provenance graph module**: New `src/provenance/` module containing:
  - Typed nodes (Goal, Exploration, Commitment, Verification, PatchProposal)
  - Rule-based tool call classifier
  - In-memory graph with O(1) lookup and O(v+e) traversal
  - JSONL persistence (write/load round-trip)

- **EventStream integration**: ProvenanceGraph is wired into the agent loop, recording nodes at each lifecycle point and linking them via causal edges.

## Capabilities

### New Capabilities

- `core/causal-events`: Causal parent field on events, graph construction from flat sequences, dependency-aware queries.
- `provenance/graph`: Causal provenance graph — node types, classifier, in-memory graph, persistence, traversal queries.

### Modified Capabilities

- `core/event-stream`: BaseEvent extended with optional `causal_parents` field. EventStream appender supports causal parent specification.
- `store/event-store`: EventStore gains `buildCausalGraph()` and graph query methods.

## Non-Goals

- Hook system, attestations, or context assembly (Phase 2 and 3).
- Cryptographic signatures on provenance nodes.
- Cross-session graph queries (deferred to scale-out).
- REST API exposure of provenance data (added in Phase 2).

## Risks

- **Event schema backward compat**: Adding `causal_parents` to BaseEvent. Mitigation: field is optional, defaults to empty array, existing code unchanged.
- **Graph memory growth**: Unbounded per session. Mitigation: session-scoped, GC on completion, JSONL persistence.
- **Classifier accuracy**: Wrong classification leads to wrong provenance. Mitigation: rule-based (deterministic), extensible, log misclassifications for tuning.
