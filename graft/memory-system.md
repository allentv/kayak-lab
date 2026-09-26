---
name: Memory System
slug: memory-system
type: system
sources:
  - path: src/memory/emitter.ts
    hash: 90fdc07d5efc1a1ab7d55ad6c026c2154cdea4af6f6d471e4bfbda0af92d4bfa
  - path: src/memory/message-classifier.ts
    hash: 6d01c40eb71cf735fff0bfd8e303806b0e5ea33557de6834b94e7dc735b09e71
  - path: src/memory/mod.ts
    hash: 2be384d1f6871cc76345f7f3e02313a46e85e3f154d9218cdc2fef15e517c9b5
  - path: src/memory/provenance-context-types.ts
    hash: 8c44fd75dba4f46e400a640a5501376a2b60cdd8d28c8bdec68291da39a338e8
  - path: src/memory/provenance-context.ts
    hash: e46eb1f21ac6305615d27dcd2be61f224361012f86a70814dc9dacd754e85ef6
  - path: src/memory/provider.ts
    hash: 4c07507019f287e5a070d9edc9723775ad18c9290d9ae310a23202d5cee67082
  - path: src/memory/retrieval.ts
    hash: 6805775f7f4247f9340ae17413e768c93088dbdc8d10b4b72718e55e4858d676
  - path: src/memory/search.ts
    hash: c4439e6c7e2b5d20bd4233c4a1f2ad206cc6ac4245f62b530f20bffde459a3ab
  - path: src/memory/shared.ts
    hash: a09742b39222f0e86818f48cbe3f3deb96179b53474308f3fbc41c3991d3eda5
  - path: src/memory/storage.ts
    hash: c096f41e0176a3516e0959d227fd1786e818afb459d3a211063b093875e863d2
  - path: src/memory/types.ts
    hash: 236e8efc98ab25a91add3d005f0e3a4f73852e314d0821fb29076ca3137588ea
  - path: src/memory/update.ts
    hash: bcb0c33794eddbd1ad0ef0039ea08c54e8050665be23aed444b5a1504120139b
sources_digest: 5330675dc8c4c30ccefa02f61691d6d5bcd5872b233461675ab1393b30b19394
links:
  - to: projection-system
    relation: produces
    description: >-
      Memory events are emitted and can be projected to UI surfaces via the
      event stream.
  - to: provenance-graph-system
    relation: uses
    description: >-
      MessageClassifier scores messages based on provenance node outcomes;
      ProvenanceContextManager uses graph data to prune context intelligently.
  - to: runtime-orchestration
    relation: produces
    description: >-
      MemoryProvider emits memory_operation events; MemoryRetrieval supplies
      memories to agents on demand; ProvenanceContextManager injects memories
      before model calls via hooks.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Provider-agnostic memory management with typed storage, retrieval, classification, and provenance-aware context pruning. The system separates short-term (L1), scenario (L2), and core identity (L3) memories, uses event-driven updates, and integrates with provenance graphs to reduce token usage by 50-80% while preserving critical context.

## Related

- produces [[projection-system]] — Memory events are emitted and can be projected to UI surfaces via the event stream.
- uses [[provenance-graph-system]] — MessageClassifier scores messages based on provenance node outcomes; ProvenanceContextManager uses graph data to prune context intelligently.
- produces [[runtime-orchestration]] — MemoryProvider emits memory_operation events; MemoryRetrieval supplies memories to agents on demand; ProvenanceContextManager injects memories before model calls via hooks.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
