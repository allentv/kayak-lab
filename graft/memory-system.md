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
covers:
  - symbol: Handler
    kind: type
    at: 'src/memory/emitter.ts:L8-L8'
  - symbol: TypedEmitter
    kind: class
    at: 'src/memory/emitter.ts:L21-L54'
  - symbol: 'on'
    kind: method
    at: 'src/memory/emitter.ts:L24-L31'
  - symbol: 'off'
    kind: method
    at: 'src/memory/emitter.ts:L33-L35'
  - symbol: emit
    kind: method
    at: 'src/memory/emitter.ts:L37-L48'
  - symbol: removeAllListeners
    kind: method
    at: 'src/memory/emitter.ts:L51-L53'
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
  - symbol: MessagePriority
    kind: enum
    at: 'src/memory/provenance-context-types.ts:L13-L20'
  - symbol: OutcomeScore
    kind: enum
    at: 'src/memory/provenance-context-types.ts:L23-L28'
  - symbol: TokenBudget
    kind: interface
    at: 'src/memory/provenance-context-types.ts:L31-L44'
  - symbol: CompressionResult
    kind: interface
    at: 'src/memory/provenance-context-types.ts:L47-L56'
  - symbol: ProvenanceContextConfig
    kind: interface
    at: 'src/memory/provenance-context-types.ts:L59-L70'
  - symbol: estimateTokens
    kind: function
    at: 'src/memory/provenance-context-types.ts:L98-L98'
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
  - symbol: MemorySearchEvent
    kind: interface
    at: 'src/memory/search.ts:L16-L21'
  - symbol: MemorySearchResultEvent
    kind: interface
    at: 'src/memory/search.ts:L24-L29'
  - symbol: MemorySearchEvents
    kind: interface
    at: 'src/memory/search.ts:L32-L35'
  - symbol: SearchType
    kind: type
    at: 'src/memory/search.ts:L42-L42'
  - symbol: SearchFilters
    kind: interface
    at: 'src/memory/search.ts:L45-L52'
  - symbol: SearchConfig
    kind: interface
    at: 'src/memory/search.ts:L55-L62'
  - symbol: SearchOptions
    kind: interface
    at: 'src/memory/search.ts:L65-L74'
  - symbol: SearchResult
    kind: interface
    at: 'src/memory/search.ts:L77-L80'
  - symbol: IMemorySearch
    kind: interface
    at: 'src/memory/search.ts:L89-L107'
  - symbol: MemorySearch
    kind: class
    at: 'src/memory/search.ts:L120-L313'
  - symbol: constructor
    kind: method
    at: 'src/memory/search.ts:L128-L136'
  - symbol: setMemories
    kind: method
    at: 'src/memory/search.ts:L139-L141'
  - symbol: addMemory
    kind: method
    at: 'src/memory/search.ts:L144-L151'
  - symbol: removeMemory
    kind: method
    at: 'src/memory/search.ts:L154-L156'
  - symbol: semanticSearch
    kind: method
    at: 'src/memory/search.ts:L158-L168'
  - symbol: keywordSearch
    kind: method
    at: 'src/memory/search.ts:L170-L181'
  - symbol: combinedSearch
    kind: method
    at: 'src/memory/search.ts:L183-L200'
  - symbol: search
    kind: method
    at: 'src/memory/search.ts:L202-L212'
  - symbol: configure
    kind: method
    at: 'src/memory/search.ts:L214-L216'
  - symbol: getConfig
    kind: method
    at: 'src/memory/search.ts:L218-L220'
  - symbol: applyFilters
    kind: method
    at: 'src/memory/search.ts:L224-L239'
  - symbol: semanticScore
    kind: method
    at: 'src/memory/search.ts:L245-L258'
  - symbol: keywordScore
    kind: method
    at: 'src/memory/search.ts:L263-L273'
  - symbol: tokenize
    kind: method
    at: 'src/memory/search.ts:L275-L280'
  - symbol: rankAndLimit
    kind: method
    at: 'src/memory/search.ts:L282-L299'
  - symbol: emitSearchEvent
    kind: method
    at: 'src/memory/search.ts:L301-L312'
  - symbol: SharedMemoryEvent
    kind: interface
    at: 'src/memory/shared.ts:L16-L22'
  - symbol: SharedMemoryEvents
    kind: interface
    at: 'src/memory/shared.ts:L25-L27'
  - symbol: MemorySnapshot
    kind: interface
    at: 'src/memory/shared.ts:L34-L43'
  - symbol: ISharedMemory
    kind: interface
    at: 'src/memory/shared.ts:L52-L64'
  - symbol: SnapshotOptions
    kind: interface
    at: 'src/memory/shared.ts:L67-L72'
  - symbol: SharedMemory
    kind: class
    at: 'src/memory/shared.ts:L85-L192'
  - symbol: constructor
    kind: method
    at: 'src/memory/shared.ts:L92-L99'
  - symbol: addMemory
    kind: method
    at: 'src/memory/shared.ts:L102-L104'
  - symbol: removeMemory
    kind: method
    at: 'src/memory/shared.ts:L107-L109'
  - symbol: getAllMemories
    kind: method
    at: 'src/memory/shared.ts:L112-L114'
  - symbol: shareContext
    kind: method
    at: 'src/memory/shared.ts:L116-L133'
  - symbol: reference
    kind: method
    at: 'src/memory/shared.ts:L135-L153'
  - symbol: getSnapshot
    kind: method
    at: 'src/memory/shared.ts:L155-L187'
  - symbol: getSharedAgents
    kind: method
    at: 'src/memory/shared.ts:L189-L191'
  - symbol: MemoryStoredEvent
    kind: interface
    at: 'src/memory/storage.ts:L16-L20'
  - symbol: MemoryFallbackEvent
    kind: interface
    at: 'src/memory/storage.ts:L23-L29'
  - symbol: MemoryStorageEvents
    kind: interface
    at: 'src/memory/storage.ts:L32-L35'
  - symbol: StorageBackend
    kind: type
    at: 'src/memory/storage.ts:L42-L42'
  - symbol: MemoryStorageConfig
    kind: interface
    at: 'src/memory/storage.ts:L45-L52'
  - symbol: StorageBackendConfig
    kind: interface
    at: 'src/memory/storage.ts:L55-L58'
  - symbol: IMemoryStorage
    kind: interface
    at: 'src/memory/storage.ts:L67-L114'
  - symbol: StorageListOptions
    kind: interface
    at: 'src/memory/storage.ts:L117-L121'
  - symbol: InMemoryStorage
    kind: class
    at: 'src/memory/storage.ts:L131-L254'
  - symbol: store
    kind: method
    at: 'src/memory/storage.ts:L137-L144'
  - symbol: retrieve
    kind: method
    at: 'src/memory/storage.ts:L146-L149'
  - symbol: delete
    kind: method
    at: 'src/memory/storage.ts:L151-L153'
  - symbol: list
    kind: method
    at: 'src/memory/storage.ts:L155-L172'
  - symbol: isAvailable
    kind: method
    at: 'src/memory/storage.ts:L174-L176'
  - symbol: writeScenario
    kind: method
    at: 'src/memory/storage.ts:L179-L200'
  - symbol: readScenario
    kind: method
    at: 'src/memory/storage.ts:L202-L206'
  - symbol: listScenarios
    kind: method
    at: 'src/memory/storage.ts:L208-L212'
  - symbol: deleteScenario
    kind: method
    at: 'src/memory/storage.ts:L214-L217'
  - symbol: countScenarios
    kind: method
    at: 'src/memory/storage.ts:L219-L221'
  - symbol: readCore
    kind: method
    at: 'src/memory/storage.ts:L224-L227'
  - symbol: writeCore
    kind: method
    at: 'src/memory/storage.ts:L229-L248'
  - symbol: size
    kind: method
    at: 'src/memory/storage.ts:L251-L253'
  - symbol: PersistentStorage
    kind: class
    at: 'src/memory/storage.ts:L265-L376'
  - symbol: constructor
    kind: method
    at: 'src/memory/storage.ts:L272-L275'
  - symbol: store
    kind: method
    at: 'src/memory/storage.ts:L277-L286'
  - symbol: retrieve
    kind: method
    at: 'src/memory/storage.ts:L288-L292'
  - symbol: delete
    kind: method
    at: 'src/memory/storage.ts:L294-L299'
  - symbol: list
    kind: method
    at: 'src/memory/storage.ts:L301-L319'
  - symbol: isAvailable
    kind: method
    at: 'src/memory/storage.ts:L321-L323'
  - symbol: size
    kind: method
    at: 'src/memory/storage.ts:L325-L327'
  - symbol: writeScenario
    kind: method
    at: 'src/memory/storage.ts:L330-L332'
  - symbol: readScenario
    kind: method
    at: 'src/memory/storage.ts:L333-L333'
  - symbol: listScenarios
    kind: method
    at: 'src/memory/storage.ts:L334-L334'
  - symbol: deleteScenario
    kind: method
    at: 'src/memory/storage.ts:L335-L335'
  - symbol: countScenarios
    kind: method
    at: 'src/memory/storage.ts:L336-L336'
  - symbol: readCore
    kind: method
    at: 'src/memory/storage.ts:L339-L339'
  - symbol: writeCore
    kind: method
    at: 'src/memory/storage.ts:L340-L342'
  - symbol: ensureLoaded
    kind: method
    at: 'src/memory/storage.ts:L344-L353'
  - symbol: persist
    kind: method
    at: 'src/memory/storage.ts:L355-L358'
  - symbol: load
    kind: method
    at: 'src/memory/storage.ts:L360-L375'
  - symbol: DistributedStorage
    kind: class
    at: 'src/memory/storage.ts:L387-L435'
  - symbol: store
    kind: method
    at: 'src/memory/storage.ts:L391-L393'
  - symbol: retrieve
    kind: method
    at: 'src/memory/storage.ts:L395-L397'
  - symbol: delete
    kind: method
    at: 'src/memory/storage.ts:L399-L401'
  - symbol: list
    kind: method
    at: 'src/memory/storage.ts:L403-L405'
  - symbol: isAvailable
    kind: method
    at: 'src/memory/storage.ts:L407-L409'
  - symbol: writeScenario
    kind: method
    at: 'src/memory/storage.ts:L412-L414'
  - symbol: readScenario
    kind: method
    at: 'src/memory/storage.ts:L415-L415'
  - symbol: listScenarios
    kind: method
    at: 'src/memory/storage.ts:L416-L416'
  - symbol: deleteScenario
    kind: method
    at: 'src/memory/storage.ts:L417-L417'
  - symbol: countScenarios
    kind: method
    at: 'src/memory/storage.ts:L418-L418'
  - symbol: readCore
    kind: method
    at: 'src/memory/storage.ts:L421-L421'
  - symbol: writeCore
    kind: method
    at: 'src/memory/storage.ts:L422-L424'
  - symbol: enable
    kind: method
    at: 'src/memory/storage.ts:L427-L429'
  - symbol: disable
    kind: method
    at: 'src/memory/storage.ts:L432-L434'
  - symbol: FallbackStorage
    kind: class
    at: 'src/memory/storage.ts:L447-L596'
  - symbol: constructor
    kind: method
    at: 'src/memory/storage.ts:L451-L462'
  - symbol: store
    kind: method
    at: 'src/memory/storage.ts:L464-L497'
  - symbol: retrieve
    kind: method
    at: 'src/memory/storage.ts:L499-L511'
  - symbol: delete
    kind: method
    at: 'src/memory/storage.ts:L513-L526'
  - symbol: list
    kind: method
    at: 'src/memory/storage.ts:L528-L539'
  - symbol: isAvailable
    kind: method
    at: 'src/memory/storage.ts:L541-L546'
  - symbol: writeScenario
    kind: method
    at: 'src/memory/storage.ts:L549-L554'
  - symbol: readScenario
    kind: method
    at: 'src/memory/storage.ts:L555-L560'
  - symbol: listScenarios
    kind: method
    at: 'src/memory/storage.ts:L561-L566'
  - symbol: deleteScenario
    kind: method
    at: 'src/memory/storage.ts:L567-L575'
  - symbol: countScenarios
    kind: method
    at: 'src/memory/storage.ts:L576-L581'
  - symbol: readCore
    kind: method
    at: 'src/memory/storage.ts:L584-L589'
  - symbol: writeCore
    kind: method
    at: 'src/memory/storage.ts:L590-L595'
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
  - symbol: MemoryUpdatedEvent
    kind: interface
    at: 'src/memory/update.ts:L16-L21'
  - symbol: MemoryUpdateEvents
    kind: interface
    at: 'src/memory/update.ts:L24-L26'
  - symbol: IMemoryUpdate
    kind: interface
    at: 'src/memory/update.ts:L35-L44'
  - symbol: MemoryUpdate
    kind: class
    at: 'src/memory/update.ts:L56-L107'
  - symbol: constructor
    kind: method
    at: 'src/memory/update.ts:L64-L71'
  - symbol: autoStore
    kind: method
    at: 'src/memory/update.ts:L73-L82'
  - symbol: manualStore
    kind: method
    at: 'src/memory/update.ts:L84-L93'
  - symbol: update
    kind: method
    at: 'src/memory/update.ts:L95-L106'
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
