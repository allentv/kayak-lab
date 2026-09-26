---
name: Provenance Graph System
slug: provenance-graph-system
type: system
sources:
  - path: src/provenance/__tests__/classifier.test.ts
    hash: 1dd6606111e678fe6e176ed2426adfa19bcc39bbc70605b3dc657c693ed1ba1a
  - path: src/provenance/__tests__/graph.test.ts
    hash: 1fe6c5fae919ffa63bfb414424a044e7d52ff175395a2f258436cf15f4c0e25f
  - path: src/provenance/classifier.ts
    hash: 7a0594121086d00b29afb27885bf591a70d74a1f2352a823a92f225cd304f274
  - path: src/provenance/graph.ts
    hash: 51115f8d179ab21932ee5590d4a5cda21751ef5b015d4156120b991b71c38b91
  - path: src/provenance/mod.ts
    hash: 18413c8a756a1dbbf7f4c8862625d2e57199f5f9707a66a86619d0034365e396
  - path: src/provenance/types.ts
    hash: b5274cfb5355adc596838662de96b78445d87384f213d9ea267fc2eeeb66bdfb
sources_digest: 92c08b6fbc6e2acee82f89d60483510f36514d32e2ca90dce29930664d195127
links:
  - to: memory-system
    relation: depends_on
    description: >-
      ProvenanceContextManager uses graph data to score and prune messages;
      MessageClassifier reads node outcomes to assign success/failure scores.
  - to: runtime-orchestration
    relation: produces
    description: >-
      AgentRuntime attaches provenance graph to sessions; tool calls are
      classified and added as nodes; graph tracks commitment-verification
      chains.
generator:
  version: 1
covers:
  - symbol: goalNode
    kind: function
    at: 'src/provenance/__tests__/graph.test.ts:L10-L19'
  - symbol: explorationNode
    kind: function
    at: 'src/provenance/__tests__/graph.test.ts:L21-L32'
  - symbol: commitmentNode
    kind: function
    at: 'src/provenance/__tests__/graph.test.ts:L34-L45'
  - symbol: verificationNode
    kind: function
    at: 'src/provenance/__tests__/graph.test.ts:L47-L58'
  - symbol: patchNode
    kind: function
    at: 'src/provenance/__tests__/graph.test.ts:L60-L72'
  - symbol: ClassifierRule
    kind: interface
    at: 'src/provenance/classifier.ts:L25-L29'
  - symbol: classifyToolCall
    kind: function
    at: 'src/provenance/classifier.ts:L87-L135'
  - symbol: ProvenanceGraph
    kind: class
    at: 'src/provenance/graph.ts:L26-L286'
  - symbol: constructor
    kind: method
    at: 'src/provenance/graph.ts:L36-L38'
  - symbol: addNode
    kind: method
    at: 'src/provenance/graph.ts:L48-L58'
  - symbol: addEdge
    kind: method
    at: 'src/provenance/graph.ts:L64-L89'
  - symbol: canReach
    kind: method
    at: 'src/provenance/graph.ts:L94-L112'
  - symbol: getNode
    kind: method
    at: 'src/provenance/graph.ts:L119-L121'
  - symbol: getChildren
    kind: method
    at: 'src/provenance/graph.ts:L124-L133'
  - symbol: getParents
    kind: method
    at: 'src/provenance/graph.ts:L136-L147'
  - symbol: getReachable
    kind: method
    at: 'src/provenance/graph.ts:L153-L180'
  - symbol: getNodesByType
    kind: method
    at: 'src/provenance/graph.ts:L183-L191'
  - symbol: toJSON
    kind: method
    at: 'src/provenance/graph.ts:L198-L204'
  - symbol: fromJSON
    kind: method
    at: 'src/provenance/graph.ts:L207-L230'
  - symbol: writeToDisk
    kind: method
    at: 'src/provenance/graph.ts:L240-L251'
  - symbol: loadFromDisk
    kind: method
    at: 'src/provenance/graph.ts:L257-L285'
  - symbol: ProvenanceNodeType
    kind: enum
    at: 'src/provenance/types.ts:L13-L19'
  - symbol: ProvenanceNode
    kind: interface
    at: 'src/provenance/types.ts:L28-L41'
  - symbol: GoalNode
    kind: interface
    at: 'src/provenance/types.ts:L48-L52'
  - symbol: ExplorationNode
    kind: interface
    at: 'src/provenance/types.ts:L55-L63'
  - symbol: CommitmentNode
    kind: interface
    at: 'src/provenance/types.ts:L66-L74'
  - symbol: VerificationNode
    kind: interface
    at: 'src/provenance/types.ts:L77-L85'
  - symbol: PatchProposalNode
    kind: interface
    at: 'src/provenance/types.ts:L88-L98'
  - symbol: AnyProvenanceNode
    kind: type
    at: 'src/provenance/types.ts:L105-L110'
  - symbol: ProvenanceEdge
    kind: interface
    at: 'src/provenance/types.ts:L117-L124'
  - symbol: ProvenanceGraphData
    kind: interface
    at: 'src/provenance/types.ts:L131-L138'
---
<!-- context:generated:start -->
## Summary

Directed acyclic graph (DAG) tracking causal relationships between agent actions (goals, tool calls, verifications). Provides classification rules for tool calls, serialization, and integration with memory for context pruning. Enforces acyclicity and optimizes for child lookups.

## Related

- depends on [[memory-system]] — ProvenanceContextManager uses graph data to score and prune messages; MessageClassifier reads node outcomes to assign success/failure scores.
- produces [[runtime-orchestration]] — AgentRuntime attaches provenance graph to sessions; tool calls are classified and added as nodes; graph tracks commitment-verification chains.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
