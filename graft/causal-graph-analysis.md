---
name: Causal Graph Analysis
slug: causal-graph-analysis
type: concept
sources:
  - path: src/store/causal-graph.ts
    hash: 03c7eba68dcda9c936f831e7c71ca9dca2c0993c3e8f6ce6db7974f0ed7959b5
sources_digest: de3721c6d711c4fd915a63c8588ff933b7dd1868ecabb42f2c341821f90ae28e
links:
  - to: event-sourcing-persistence-system
    relation: part_of
    description: Integrated into EventStore and PersistentEventStore for causal analysis.
generator:
  version: 1
covers:
  - symbol: CausalGraphNode
    kind: interface
    at: 'src/store/causal-graph.ts:L15-L18'
  - symbol: buildCausalGraph
    kind: function
    at: 'src/store/causal-graph.ts:L28-L50'
  - symbol: findDownstream
    kind: function
    at: 'src/store/causal-graph.ts:L60-L89'
  - symbol: findIndependentChains
    kind: function
    at: 'src/store/causal-graph.ts:L95-L140'
  - symbol: getCausalParents
    kind: function
    at: 'src/store/causal-graph.ts:L150-L154'
---
<!-- context:generated:start -->
## Summary

Shared utilities for constructing and traversing event causality graphs using parent-child relationships. Enables downstream closure computation and identification of independent event chains for debugging and analysis.

## Related

- part of [[event-sourcing-persistence-system]] — Integrated into EventStore and PersistentEventStore for causal analysis.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
