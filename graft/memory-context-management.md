---
name: Memory & Context Management
slug: memory-context-management
type: system
sources:
  - path: src/memory/__tests__/memory.test.ts
    hash: 1c54f90274f6d7fa5484013fd1e3257af7a51313787b3089bc611a3eac8a5db0
  - path: src/memory/__tests__/provenance-context.test.ts
    hash: 14123a821a949bbe051bdd3da485b0f0ffa035488cad0197b0ab1ce1518b6d26
  - path: src/memory/__tests__/retrieval-l2l3.test.ts
    hash: 06b8023a047192f80b4c7c211e556fb67846211b1cebac8da05f00b712385aca
  - path: src/memory/config.ts
    hash: 6527ed9ad0c0f3eedbe3a8943d5e1909e72594be80e7fdcb229e7403cfe1a9ec
sources_digest: a444fbb9ed7427e83dbb85fb1fe61f5a3b0e947baa8cb653be178c6d04273ee8
links:
  - to: core-resilience-fault-tolerance
    relation: uses
    description: >-
      Memory storage may use fallback strategies (FallbackStorage) and retry
      mechanisms.
  - to: event-sourcing-session-lifecycle
    relation: depends_on
    description: >-
      Memories are often associated with sessions and may be retrieved based on
      session events.
generator:
  version: 1
covers:
  - symbol: makeMemory
    kind: function
    at: 'src/memory/__tests__/memory.test.ts:L32-L46'
  - symbol: handler
    kind: function
    at: 'src/memory/__tests__/memory.test.ts:L716-L716'
  - symbol: createMessage
    kind: function
    at: 'src/memory/__tests__/provenance-context.test.ts:L26-L32'
  - symbol: createTestGraph
    kind: function
    at: 'src/memory/__tests__/provenance-context.test.ts:L35-L91'
  - symbol: createBackend
    kind: function
    at: 'src/memory/__tests__/retrieval-l2l3.test.ts:L13-L15'
  - symbol: createMockRetrieveFn
    kind: function
    at: 'src/memory/__tests__/retrieval-l2l3.test.ts:L17-L19'
  - symbol: MemoryConfig
    kind: interface
    at: 'src/memory/config.ts:L18-L29'
  - symbol: SharedMemoryConfig
    kind: interface
    at: 'src/memory/config.ts:L32-L39'
  - symbol: createMemoryConfig
    kind: function
    at: 'src/memory/config.ts:L82-L94'
  - symbol: validateMemoryConfig
    kind: function
    at: 'src/memory/config.ts:L97-L131'
---
<!-- context:generated:start -->
## Summary

Manages structured memories (semantic, scenario, core) with storage backends (in-memory, SQLite, distributed). Includes retrieval with relevance scoring, search, shared memory for multi-agent contexts, and provenance-based context pruning. ProvenanceContextManager uses a graph to prioritize context, falling back to positional pruning if graph is absent.

## Related

- uses [[core-resilience-fault-tolerance]] — Memory storage may use fallback strategies (FallbackStorage) and retry mechanisms.
- depends on [[event-sourcing-session-lifecycle]] — Memories are often associated with sessions and may be retrieved based on session events.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
