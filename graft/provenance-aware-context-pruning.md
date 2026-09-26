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
covers:
  - symbol: MessageClassifier
    kind: class
    at: 'src/memory/message-classifier.ts:L30-L272'
  - symbol: setProvenanceGraph
    kind: method
    at: 'src/memory/message-classifier.ts:L34-L36'
  - symbol: getProvenanceGraph
    kind: method
    at: 'src/memory/message-classifier.ts:L39-L41'
  - symbol: isGraphSufficient
    kind: method
    at: 'src/memory/message-classifier.ts:L47-L49'
  - symbol: scoreMessage
    kind: method
    at: 'src/memory/message-classifier.ts:L54-L56'
  - symbol: getBasePriority
    kind: method
    at: 'src/memory/message-classifier.ts:L65-L87'
  - symbol: isGoalMessage
    kind: method
    at: 'src/memory/message-classifier.ts:L93-L98'
  - symbol: isCommitmentMessage
    kind: method
    at: 'src/memory/message-classifier.ts:L104-L112'
  - symbol: isVerificationMessage
    kind: method
    at: 'src/memory/message-classifier.ts:L118-L126'
  - symbol: isExplorationMessage
    kind: method
    at: 'src/memory/message-classifier.ts:L132-L139'
  - symbol: getOutcomeScore
    kind: method
    at: 'src/memory/message-classifier.ts:L148-L171'
  - symbol: findNodeForMessage
    kind: method
    at: 'src/memory/message-classifier.ts:L177-L179'
  - symbol: isSuccessfulOutcome
    kind: method
    at: 'src/memory/message-classifier.ts:L184-L196'
  - symbol: isFailedOutcome
    kind: method
    at: 'src/memory/message-classifier.ts:L201-L213'
  - symbol: isDeadEnd
    kind: method
    at: 'src/memory/message-classifier.ts:L218-L227'
  - symbol: getChildNodes
    kind: method
    at: 'src/memory/message-classifier.ts:L236-L243'
  - symbol: hasDescendantOfType
    kind: method
    at: 'src/memory/message-classifier.ts:L248-L271'
  - symbol: ProvenanceContextManager
    kind: class
    at: 'src/memory/provenance-context.ts:L55-L368'
  - symbol: constructor
    kind: method
    at: 'src/memory/provenance-context.ts:L61-L64'
  - symbol: setProvenanceGraph
    kind: method
    at: 'src/memory/provenance-context.ts:L67-L70'
  - symbol: getProvenanceGraph
    kind: method
    at: 'src/memory/provenance-context.ts:L73-L75'
  - symbol: setMemoryRetrieval
    kind: method
    at: 'src/memory/provenance-context.ts:L78-L80'
  - symbol: add
    kind: method
    at: 'src/memory/provenance-context.ts:L85-L106'
  - symbol: compressToolResult
    kind: method
    at: 'src/memory/provenance-context.ts:L115-L155'
  - symbol: getReferencedLines
    kind: method
    at: 'src/memory/provenance-context.ts:L160-L177'
  - symbol: assembleContext
    kind: method
    at: 'src/memory/provenance-context.ts:L186-L221'
  - symbol: calculateBudget
    kind: method
    at: 'src/memory/provenance-context.ts:L223-L233'
  - symbol: compressTurnsToSummary
    kind: method
    at: 'src/memory/provenance-context.ts:L235-L250'
  - symbol: retrieveProvenanceScoredMemories
    kind: method
    at: 'src/memory/provenance-context.ts:L252-L264'
  - symbol: enforceBudget
    kind: method
    at: 'src/memory/provenance-context.ts:L266-L323'
  - symbol: createBeforeModelCallHook
    kind: method
    at: 'src/memory/provenance-context.ts:L332-L367'
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
