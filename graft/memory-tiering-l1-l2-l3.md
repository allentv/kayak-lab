---
name: Memory Tiering (L1/L2/L3)
slug: memory-tiering-l1-l2-l3
type: concept
sources:
  - path: src/memory/provider.ts
    hash: 4c07507019f287e5a070d9edc9723775ad18c9290d9ae310a23202d5cee67082
  - path: src/memory/retrieval.ts
    hash: 6805775f7f4247f9340ae17413e768c93088dbdc8d10b4b72718e55e4858d676
  - path: src/memory/types.ts
    hash: 236e8efc98ab25a91add3d005f0e3a4f73852e314d0821fb29076ca3137588ea
  - path: src/runtime/__tests__/agent-runtime-l3.test.ts
    hash: b2e90d4e5e4305ce08d9ea94b118a62754d06824d023d73ef51ebb9adc7bd381
  - path: src/runtime/__tests__/pattern-analyzer-l2.test.ts
    hash: efc2e4c352eeff9f09447061253e354fe11400042ff9c10f39b8ac6e0e0c4dd4
sources_digest: 88bdcc61c20761226897a9a48605705500ce927b23d3cdec2e33bea9c745d5c4
links:
  - to: memory-system
    relation: part_of
    description: >-
      Defined in memory types; implemented in provider, retrieval, and storage
      components.
  - to: runtime-orchestration
    relation: uses
    description: >-
      AgentRuntime conditionally loads L3 memory; PatternAnalyzer writes L2
      scenarios.
generator:
  version: 1
covers:
  - symbol: MemoryProviderType
    kind: type
    at: 'src/memory/provider.ts:L23-L23'
  - symbol: MemoryProviderConfig
    kind: interface
    at: 'src/memory/provider.ts:L26-L31'
  - symbol: MemoryOperationEvent
    kind: interface
    at: 'src/memory/provider.ts:L38-L46'
  - symbol: MemoryProviderEvents
    kind: interface
    at: 'src/memory/provider.ts:L49-L51'
  - symbol: IMemoryProvider
    kind: interface
    at: 'src/memory/provider.ts:L66-L95'
  - symbol: ReflectOptions
    kind: interface
    at: 'src/memory/provider.ts:L98-L107'
  - symbol: ListOptions
    kind: interface
    at: 'src/memory/provider.ts:L110-L119'
  - symbol: MemoryProvider
    kind: class
    at: 'src/memory/provider.ts:L131-L350'
  - symbol: constructor
    kind: method
    at: 'src/memory/provider.ts:L136-L141'
  - symbol: providerType
    kind: method
    at: 'src/memory/provider.ts:L143-L145'
  - symbol: config
    kind: method
    at: 'src/memory/provider.ts:L147-L152'
  - symbol: retain
    kind: method
    at: 'src/memory/provider.ts:L154-L166'
  - symbol: recall
    kind: method
    at: 'src/memory/provider.ts:L168-L175'
  - symbol: reflect
    kind: method
    at: 'src/memory/provider.ts:L177-L184'
  - symbol: delete
    kind: method
    at: 'src/memory/provider.ts:L186-L193'
  - symbol: _list
    kind: method
    at: 'src/memory/provider.ts:L195-L202'
  - symbol: list
    kind: method
    at: 'src/memory/provider.ts:L205-L207'
  - symbol: writeScenario
    kind: method
    at: 'src/memory/provider.ts:L213-L221'
  - symbol: readScenario
    kind: method
    at: 'src/memory/provider.ts:L223-L231'
  - symbol: listScenarios
    kind: method
    at: 'src/memory/provider.ts:L233-L241'
  - symbol: deleteScenario
    kind: method
    at: 'src/memory/provider.ts:L243-L251'
  - symbol: countScenarios
    kind: method
    at: 'src/memory/provider.ts:L253-L261'
  - symbol: readCore
    kind: method
    at: 'src/memory/provider.ts:L267-L275'
  - symbol: writeCore
    kind: method
    at: 'src/memory/provider.ts:L277-L285'
  - symbol: createMemoryEntry
    kind: method
    at: 'src/memory/provider.ts:L290-L349'
  - symbol: MemoryRetrievedEvent
    kind: interface
    at: 'src/memory/retrieval.ts:L17-L22'
  - symbol: MemoryRetrievalEvents
    kind: interface
    at: 'src/memory/retrieval.ts:L25-L27'
  - symbol: RetrievalConfig
    kind: interface
    at: 'src/memory/retrieval.ts:L34-L41'
  - symbol: RetrievalOptions
    kind: interface
    at: 'src/memory/retrieval.ts:L44-L57'
  - symbol: MemoryRetrievalResult
    kind: interface
    at: 'src/memory/retrieval.ts:L60-L69'
  - symbol: IMemoryRetrieval
    kind: interface
    at: 'src/memory/retrieval.ts:L78-L87'
  - symbol: MemoryRetrieval
    kind: class
    at: 'src/memory/retrieval.ts:L99-L255'
  - symbol: constructor
    kind: method
    at: 'src/memory/retrieval.ts:L111-L126'
  - symbol: retrieve
    kind: method
    at: 'src/memory/retrieval.ts:L128-L209'
  - symbol: configure
    kind: method
    at: 'src/memory/retrieval.ts:L211-L213'
  - symbol: getConfig
    kind: method
    at: 'src/memory/retrieval.ts:L215-L217'
  - symbol: calculateRelevanceScore
    kind: method
    at: 'src/memory/retrieval.ts:L222-L245'
  - symbol: calculateProvenanceScore
    kind: method
    at: 'src/memory/retrieval.ts:L250-L254'
  - symbol: MemoryType
    kind: type
    at: 'src/memory/types.ts:L13-L13'
  - symbol: MemoryStatus
    kind: type
    at: 'src/memory/types.ts:L16-L16'
  - symbol: InteractionDirection
    kind: type
    at: 'src/memory/types.ts:L19-L19'
  - symbol: MemoryEntry
    kind: interface
    at: 'src/memory/types.ts:L28-L45'
  - symbol: ShortTermMemory
    kind: interface
    at: 'src/memory/types.ts:L54-L58'
  - symbol: LongTermMemory
    kind: interface
    at: 'src/memory/types.ts:L67-L73'
  - symbol: EpisodicMemory
    kind: interface
    at: 'src/memory/types.ts:L82-L92'
  - symbol: SemanticMemory
    kind: interface
    at: 'src/memory/types.ts:L101-L109'
  - symbol: ScenarioMemory
    kind: interface
    at: 'src/memory/types.ts:L119-L127'
  - symbol: CoreMemory
    kind: interface
    at: 'src/memory/types.ts:L137-L143'
  - symbol: AnyMemory
    kind: type
    at: 'src/memory/types.ts:L150-L150'
  - symbol: CreateShortTermInput
    kind: interface
    at: 'src/memory/types.ts:L157-L163'
  - symbol: CreateLongTermInput
    kind: interface
    at: 'src/memory/types.ts:L166-L172'
  - symbol: CreateEpisodicInput
    kind: interface
    at: 'src/memory/types.ts:L175-L184'
  - symbol: CreateSemanticInput
    kind: interface
    at: 'src/memory/types.ts:L187-L195'
  - symbol: CreateScenarioInput
    kind: interface
    at: 'src/memory/types.ts:L198-L206'
  - symbol: CreateCoreInput
    kind: interface
    at: 'src/memory/types.ts:L209-L215'
  - symbol: CreateMemoryInput
    kind: type
    at: 'src/memory/types.ts:L218-L224'
  - symbol: UpdateMemoryInput
    kind: interface
    at: 'src/memory/types.ts:L227-L236'
  - symbol: createMockModelManager
    kind: function
    at: 'src/runtime/__tests__/agent-runtime-l3.test.ts:L19-L35'
  - symbol: createMemoryProvider
    kind: function
    at: 'src/runtime/__tests__/agent-runtime-l3.test.ts:L37-L44'
  - symbol: createMockQueryEngine
    kind: function
    at: 'src/runtime/__tests__/pattern-analyzer-l2.test.ts:L14-L49'
  - symbol: createMemoryProvider
    kind: function
    at: 'src/runtime/__tests__/pattern-analyzer-l2.test.ts:L51-L58'
---
<!-- context:generated:start -->
## Summary

Three-tier memory architecture: L1 (short-term/session), L2 (scenario/pattern), L3 (core/identity). MemoryProvider abstracts storage backends; retrieval scopes by tier; PatternAnalyzer writes detected patterns as L2 scenarios; AgentRuntime loads L3 core memory for agent identity.

## Related

- part of [[memory-system]] — Defined in memory types; implemented in provider, retrieval, and storage components.
- uses [[runtime-orchestration]] — AgentRuntime conditionally loads L3 memory; PatternAnalyzer writes L2 scenarios.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
