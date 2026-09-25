---
name: Provenance-Aware Context Pruning
slug: provenance-aware-context-pruning
type: concept
sources:
  - path: src/memory/message-classifier.ts
    hash: 6d01c40eb71cf735fff0bfd8e303806b0e5ea33557de6834b94e7dc735b09e71
  - path: src/memory/provenance-context.ts
    hash: e46eb1f21ac6305615d27dcd2be61f224361012f86a70814dc9dacd754e85ef6
sources_digest: a4411eef50407f05f1f4ac25540aad85a180fbcf5adc9ac3d02fa7e1495ad910
links:
  - to: memory-system
    relation: part_of
    description: >-
      ProvenanceContextManager extends ContextManager; MessageClassifier assigns
      priority and outcome scores based on provenance nodes.
  - to: provenance-graph-system
    relation: depends_on
    description: >-
      Requires provenance graph data to score messages; uses node outcomes to
      assign success/failure scores.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Intelligent context window reduction using provenance graph data to preserve high-value messages (goals, commitments, verifications) while discarding low-priority content. Falls back to positional pruning when graph is insufficient. Achieves 50-80% token reduction.

## Related

- part of [[memory-system]] — ProvenanceContextManager extends ContextManager; MessageClassifier assigns priority and outcome scores based on provenance nodes.
- depends on [[provenance-graph-system]] — Requires provenance graph data to score messages; uses node outcomes to assign success/failure scores.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
