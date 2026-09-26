---
name: Runtime Orchestration
slug: runtime-orchestration
type: system
sources:
  - path: src/runtime/__tests__/agent-runtime-config.test.ts
    hash: dfbdc3f1a5dec122f6bfb80a8a8c82903a2797da94c22e23febdb3349939eaa3
  - path: src/runtime/__tests__/agent-runtime-l3.test.ts
    hash: b2e90d4e5e4305ce08d9ea94b118a62754d06824d023d73ef51ebb9adc7bd381
  - path: src/runtime/__tests__/agent-runtime.test.ts
    hash: 38b61060122b1a3f2736237fb35d594a7af75ae6dee89b3add47ae25d1a6c686
  - path: src/runtime/__tests__/builtin-profiles.test.ts
    hash: 107a6a986766cea35546ea76e7a0a84894cb5f4e39dd765ef047676ddb0e7059
  - path: src/runtime/__tests__/dynamic-tool-registry.test.ts
    hash: 6988522b48727679677b29ec0bda40b53e1471ee62de3cb46d70da7bbe83c49f
  - path: src/runtime/__tests__/hooks.test.ts
    hash: 3aa309db06f0112b752fd20317ef16c38198135d64d19ebf25b7435b5a964bba
  - path: src/runtime/__tests__/model-provider.test.ts
    hash: 57c785fcfcf0bcc10dbf98bdc9b295a4abe52b244f40580c8205c44a7fb2765c
  - path: src/runtime/__tests__/pattern-analyzer-l2.test.ts
    hash: efc2e4c352eeff9f09447061253e354fe11400042ff9c10f39b8ac6e0e0c4dd4
  - path: src/runtime/__tests__/pattern-analyzer.test.ts
    hash: 2cec30bac36df5497393f539b6b5b7b27cd6830bf103ce30abcf7c439ea66320
  - path: src/runtime/__tests__/profile-registry.test.ts
    hash: 259047fbf2d9cac92929d9364733986dfa8bf889f4c412b0b2f06995f4b11ad4
  - path: src/runtime/__tests__/self-observation.test.ts
    hash: 2888fccad79a71404f70abaa37a8a18bcb8ff6a005fa622c7d6a4fad021dfe27
  - path: src/runtime/__tests__/spawn-config.test.ts
    hash: 1f0adb8d97efccada7d784f499706512f33ad7441e9e0e0577b2462cabe084c5
  - path: src/runtime/__tests__/spawn.test.ts
    hash: 182bd4eb9db9d21a12fdbc42e34952017d8f6c2e7c1ee09e7de7d9f06b1cc5dc
  - path: src/runtime/__tests__/tool-registry.test.ts
    hash: d430f97a6f538d9157922c244423b6756905dc61ba9b14be02f75f04d4b84574
  - path: src/runtime/agent-runtime.ts
    hash: 7d7c326dcd7435ab4ed084c5d4510efcd6101ca049cacd887f9510aa2dc5cb04
  - path: src/runtime/dynamic-tool-registry.ts
    hash: 2fa4a2276d02195abc3f9bcb9f8ded58d50bcc0171b3c63f24ce53339836709a
  - path: src/runtime/hooks.ts
    hash: fa1df80a31102431e033364151bc92edc3b36a2575d2a23909e374c1835a86db
  - path: src/runtime/mod.ts
    hash: aa2d2d0afab21ade69f85ea0881a16e8632e59d17124fdebf56b872bb5e86a1c
  - path: src/runtime/model-provider.ts
    hash: c8a192c878464a7a31433bcb7f2f3eb6e845aa6362b046fd7ebc3c107da3c785
  - path: src/runtime/pattern-analyzer.ts
    hash: e260254e00101782762612c24a7a7e4ed63a76bb7c79ab1bd9d45bcb16160527
  - path: src/runtime/profile-registry.ts
    hash: ef7fce9216ef969be07f84dfbba472408f15168e1cd8b1ea53fdb38d5b65e01b
  - path: src/runtime/profiles.ts
    hash: 637ecda8496a4e8b53d0c083c9e7371192ed8a06d6355646eca537e3078b1229
  - path: src/runtime/self-observation.ts
    hash: cce70c21d21ace25e8ad48b852d6846a05d3caa93bc3b29a41ffd16fcde7736f
  - path: src/runtime/spawn-config.ts
    hash: 9d45ae581d9957cddaeba62eb8d232d798223b7bcda0427dca9736591b22662e
  - path: src/runtime/spawn.ts
    hash: 7c14c2897e267321b808ae329db7d93803c3b740853bb3f1680ddab53e35b344
  - path: src/runtime/tool-registry.ts
    hash: cf4be8c7fc8e565ecd89791f3f9a42041b2ce049257158f2bfd1d74e393235d8
  - path: src/runtime/types.ts
    hash: a0e89af6fed713fdccf6b0a9bb483f1375113fb515e4b085dc234a355433a8af
sources_digest: 7bb0c4e59d36d867db70d0f661c068d997f812830792dcfbcc705eee985c8b24
links:
  - to: dynamic-tool-management
    relation: implements
    description: >-
      DynamicToolRegistry evaluates AnalysisReport patterns to disable failing
      tools or re-enable improving ones, emitting state change events.
  - to: memory-system
    relation: uses
    description: >-
      AgentRuntime loads core memory (L3) via MemoryProvider; hooks inject
      memories before model calls; PatternAnalyzer writes scenarios to memory.
  - to: profile-inheritance
    relation: implements
    description: >-
      ProfileRegistry resolves inheritance chains; SpawnConfigBuilder merges
      profile defaults with overrides; builtin profiles provide common defaults.
  - to: projection-system
    relation: produces
    description: >-
      Runtime emits events via IEventStream that are consumed by projection
      protocols for UI surfaces.
  - to: provenance-graph-system
    relation: uses
    description: >-
      AgentRuntime attaches provenance graph to sessions; tool calls are
      classified and added as nodes; graph tracks commitment-verification
      chains.
generator:
  version: 1
covers:
  - symbol: createAgent
    kind: function
    at: 'src/runtime/__tests__/agent-runtime-config.test.ts:L14-L27'
  - symbol: createMockModelManager
    kind: function
    at: 'src/runtime/__tests__/agent-runtime-l3.test.ts:L19-L35'
  - symbol: createMemoryProvider
    kind: function
    at: 'src/runtime/__tests__/agent-runtime-l3.test.ts:L37-L44'
  - symbol: createDeps
    kind: function
    at: 'src/runtime/__tests__/builtin-profiles.test.ts:L21-L27'
  - symbol: registerBuiltinProfiles
    kind: function
    at: 'src/runtime/__tests__/builtin-profiles.test.ts:L29-L35'
  - symbol: createEmptyReport
    kind: function
    at: 'src/runtime/__tests__/dynamic-tool-registry.test.ts:L10-L18'
  - symbol: fn
    kind: function
    at: 'src/runtime/__tests__/hooks.test.ts:L7-L7'
  - symbol: fn
    kind: function
    at: 'src/runtime/__tests__/hooks.test.ts:L21-L21'
  - symbol: fn
    kind: function
    at: 'src/runtime/__tests__/hooks.test.ts:L76-L76'
  - symbol: fn
    kind: function
    at: 'src/runtime/__tests__/hooks.test.ts:L95-L95'
  - symbol: createMockQueryEngine
    kind: function
    at: 'src/runtime/__tests__/pattern-analyzer-l2.test.ts:L14-L49'
  - symbol: createMemoryProvider
    kind: function
    at: 'src/runtime/__tests__/pattern-analyzer-l2.test.ts:L51-L58'
  - symbol: createTestEvent
    kind: function
    at: 'src/runtime/__tests__/pattern-analyzer.test.ts:L10-L27'
  - symbol: createTestEvent
    kind: function
    at: 'src/runtime/__tests__/self-observation.test.ts:L11-L27'
  - symbol: makeRegistry
    kind: function
    at: 'src/runtime/__tests__/spawn-config.test.ts:L7-L25'
  - symbol: createDeps
    kind: function
    at: 'src/runtime/__tests__/spawn.test.ts:L15-L21'
  - symbol: makeRegistry
    kind: function
    at: 'src/runtime/__tests__/spawn.test.ts:L23-L41'
  - symbol: AgentConfig
    kind: interface
    at: 'src/runtime/agent-runtime.ts:L54-L71'
  - symbol: AgentState
    kind: interface
    at: 'src/runtime/agent-runtime.ts:L74-L79'
  - symbol: AgentEvents
    kind: interface
    at: 'src/runtime/agent-runtime.ts:L82-L90'
  - symbol: AgentError
    kind: class
    at: 'src/runtime/agent-runtime.ts:L96-L107'
  - symbol: constructor
    kind: method
    at: 'src/runtime/agent-runtime.ts:L99-L106'
  - symbol: AgentNotRunningError
    kind: class
    at: 'src/runtime/agent-runtime.ts:L109-L114'
  - symbol: constructor
    kind: method
    at: 'src/runtime/agent-runtime.ts:L110-L113'
  - symbol: ContextManager
    kind: class
    at: 'src/runtime/agent-runtime.ts:L123-L182'
  - symbol: constructor
    kind: method
    at: 'src/runtime/agent-runtime.ts:L127-L129'
  - symbol: add
    kind: method
    at: 'src/runtime/agent-runtime.ts:L134-L137'
  - symbol: getAll
    kind: method
    at: 'src/runtime/agent-runtime.ts:L142-L144'
  - symbol: length
    kind: method
    at: 'src/runtime/agent-runtime.ts:L149-L151'
  - symbol: clear
    kind: method
    at: 'src/runtime/agent-runtime.ts:L156-L158'
  - symbol: trim
    kind: method
    at: 'src/runtime/agent-runtime.ts:L163-L181'
  - symbol: AgentRuntime
    kind: class
    at: 'src/runtime/agent-runtime.ts:L192-L1092'
  - symbol: constructor
    kind: method
    at: 'src/runtime/agent-runtime.ts:L223-L261'
  - symbol: start
    kind: method
    at: 'src/runtime/agent-runtime.ts:L266-L317'
  - symbol: stop
    kind: method
    at: 'src/runtime/agent-runtime.ts:L322-L346'
  - symbol: processInput
    kind: method
    at: 'src/runtime/agent-runtime.ts:L351-L383'
  - symbol: processInputStreaming
    kind: method
    at: 'src/runtime/agent-runtime.ts:L388-L422'
  - symbol: getState
    kind: method
    at: 'src/runtime/agent-runtime.ts:L427-L429'
  - symbol: getContext
    kind: method
    at: 'src/runtime/agent-runtime.ts:L434-L436'
  - symbol: getHookRegistry
    kind: method
    at: 'src/runtime/agent-runtime.ts:L441-L443'
  - symbol: runLoop
    kind: method
    at: 'src/runtime/agent-runtime.ts:L452-L615'
  - symbol: runLoopStreaming
    kind: method
    at: 'src/runtime/agent-runtime.ts:L620-L827'
  - symbol: buildModelRequest
    kind: method
    at: 'src/runtime/agent-runtime.ts:L832-L858'
  - symbol: executeToolCalls
    kind: method
    at: 'src/runtime/agent-runtime.ts:L865-L967'
  - symbol: toolTimeoutPromise
    kind: method
    at: 'src/runtime/agent-runtime.ts:L973-L979'
  - symbol: retrieveMemory
    kind: method
    at: 'src/runtime/agent-runtime.ts:L989-L995'
  - symbol: storeMemory
    kind: method
    at: 'src/runtime/agent-runtime.ts:L1000-L1005'
  - symbol: autoStoreMemory
    kind: method
    at: 'src/runtime/agent-runtime.ts:L1010-L1015'
  - symbol: updateMemory
    kind: method
    at: 'src/runtime/agent-runtime.ts:L1020-L1025'
  - symbol: getMemorySnapshot
    kind: method
    at: 'src/runtime/agent-runtime.ts:L1030-L1035'
  - symbol: referenceMemory
    kind: method
    at: 'src/runtime/agent-runtime.ts:L1040-L1045'
  - symbol: hasMemory
    kind: method
    at: 'src/runtime/agent-runtime.ts:L1050-L1055'
  - symbol: setMemoryComponents
    kind: method
    at: 'src/runtime/agent-runtime.ts:L1060-L1070'
  - symbol: appendEvent
    kind: method
    at: 'src/runtime/agent-runtime.ts:L1075-L1091'
  - symbol: ToolState
    kind: interface
    at: 'src/runtime/dynamic-tool-registry.ts:L17-L23'
  - symbol: ToolAction
    kind: interface
    at: 'src/runtime/dynamic-tool-registry.ts:L26-L31'
  - symbol: PatternMapping
    kind: interface
    at: 'src/runtime/dynamic-tool-registry.ts:L34-L38'
  - symbol: ToolLifecycleHooks
    kind: interface
    at: 'src/runtime/dynamic-tool-registry.ts:L41-L45'
  - symbol: IDynamicToolRegistry
    kind: interface
    at: 'src/runtime/dynamic-tool-registry.ts:L51-L58'
  - symbol: DynamicToolRegistry
    kind: class
    at: 'src/runtime/dynamic-tool-registry.ts:L64-L232'
  - symbol: constructor
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L86-L92'
  - symbol: evaluatePatterns
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L94-L129'
  - symbol: enableTool
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L131-L157'
  - symbol: disableTool
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L159-L191'
  - symbol: updateTool
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L193-L209'
  - symbol: getToolState
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L211-L213'
  - symbol: getAllToolStates
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L215-L217'
  - symbol: executeAction
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L219-L231'
  - symbol: HookPoint
    kind: enum
    at: 'src/runtime/hooks.ts:L13-L19'
  - symbol: BeforeModelCallContext
    kind: interface
    at: 'src/runtime/hooks.ts:L22-L27'
  - symbol: AfterToolExecutionContext
    kind: interface
    at: 'src/runtime/hooks.ts:L30-L37'
  - symbol: TurnEndContext
    kind: interface
    at: 'src/runtime/hooks.ts:L40-L45'
  - symbol: SessionStartContext
    kind: interface
    at: 'src/runtime/hooks.ts:L48-L51'
  - symbol: SessionEndContext
    kind: interface
    at: 'src/runtime/hooks.ts:L54-L59'
  - symbol: HookContext
    kind: type
    at: 'src/runtime/hooks.ts:L62-L67'
  - symbol: HookFunction
    kind: type
    at: 'src/runtime/hooks.ts:L70-L70'
  - symbol: HookEntry
    kind: interface
    at: 'src/runtime/hooks.ts:L73-L79'
  - symbol: HookRegistry
    kind: class
    at: 'src/runtime/hooks.ts:L88-L219'
  - symbol: register
    kind: method
    at: 'src/runtime/hooks.ts:L100-L115'
  - symbol: unregister
    kind: method
    at: 'src/runtime/hooks.ts:L123-L125'
  - symbol: getHooks
    kind: method
    at: 'src/runtime/hooks.ts:L134-L145'
  - symbol: dispatch
    kind: method
    at: 'src/runtime/hooks.ts:L157-L175'
  - symbol: executeWithTimeout
    kind: method
    at: 'src/runtime/hooks.ts:L180-L204'
  - symbol: size
    kind: method
    at: 'src/runtime/hooks.ts:L209-L211'
  - symbol: clear
    kind: method
    at: 'src/runtime/hooks.ts:L216-L218'
  - symbol: MessageRole
    kind: type
    at: 'src/runtime/model-provider.ts:L13-L13'
  - symbol: Message
    kind: interface
    at: 'src/runtime/model-provider.ts:L16-L21'
  - symbol: ToolDefinition
    kind: interface
    at: 'src/runtime/model-provider.ts:L24-L28'
  - symbol: ModelRequest
    kind: interface
    at: 'src/runtime/model-provider.ts:L31-L38'
  - symbol: ToolCall
    kind: interface
    at: 'src/runtime/model-provider.ts:L41-L45'
  - symbol: ModelResponse
    kind: interface
    at: 'src/runtime/model-provider.ts:L48-L57'
  - symbol: StreamDelta
    kind: interface
    at: 'src/runtime/model-provider.ts:L60-L64'
  - symbol: ModelProviderConfig
    kind: interface
    at: 'src/runtime/model-provider.ts:L67-L72'
  - symbol: IModelProvider
    kind: interface
    at: 'src/runtime/model-provider.ts:L81-L90'
  - symbol: ModelError
    kind: class
    at: 'src/runtime/model-provider.ts:L96-L110'
  - symbol: constructor
    kind: method
    at: 'src/runtime/model-provider.ts:L100-L109'
  - symbol: ProviderNotFoundError
    kind: class
    at: 'src/runtime/model-provider.ts:L112-L117'
  - symbol: constructor
    kind: method
    at: 'src/runtime/model-provider.ts:L113-L116'
  - symbol: ModelTimeoutError
    kind: class
    at: 'src/runtime/model-provider.ts:L119-L124'
  - symbol: constructor
    kind: method
    at: 'src/runtime/model-provider.ts:L120-L123'
  - symbol: ModelManager
    kind: class
    at: 'src/runtime/model-provider.ts:L133-L270'
  - symbol: register
    kind: method
    at: 'src/runtime/model-provider.ts:L141-L146'
  - symbol: setDefaultProvider
    kind: method
    at: 'src/runtime/model-provider.ts:L151-L156'
  - symbol: setFallbackProviders
    kind: method
    at: 'src/runtime/model-provider.ts:L161-L168'
  - symbol: getProvider
    kind: method
    at: 'src/runtime/model-provider.ts:L173-L183'
  - symbol: invoke
    kind: method
    at: 'src/runtime/model-provider.ts:L188-L209'
  - symbol: stream
    kind: method
    at: 'src/runtime/model-provider.ts:L214-L236'
  - symbol: getProviderChain
    kind: method
    at: 'src/runtime/model-provider.ts:L241-L269'
  - symbol: TrendDirection
    kind: type
    at: 'src/runtime/pattern-analyzer.ts:L16-L16'
  - symbol: ToolTrend
    kind: interface
    at: 'src/runtime/pattern-analyzer.ts:L19-L25'
  - symbol: SessionEfficiency
    kind: interface
    at: 'src/runtime/pattern-analyzer.ts:L28-L34'
  - symbol: ModelUsage
    kind: interface
    at: 'src/runtime/pattern-analyzer.ts:L37-L42'
  - symbol: ErrorCluster
    kind: interface
    at: 'src/runtime/pattern-analyzer.ts:L45-L50'
  - symbol: AnalysisReport
    kind: interface
    at: 'src/runtime/pattern-analyzer.ts:L53-L59'
  - symbol: IPatternAnalyzer
    kind: interface
    at: 'src/runtime/pattern-analyzer.ts:L65-L71'
  - symbol: PatternAnalyzerOptions
    kind: interface
    at: 'src/runtime/pattern-analyzer.ts:L77-L82'
  - symbol: PatternAnalyzer
    kind: class
    at: 'src/runtime/pattern-analyzer.ts:L84-L259'
  - symbol: constructor
    kind: method
    at: 'src/runtime/pattern-analyzer.ts:L88-L94'
  - symbol: analyzeToolTrends
    kind: method
    at: 'src/runtime/pattern-analyzer.ts:L96-L124'
  - symbol: analyzeSessionEfficiency
    kind: method
    at: 'src/runtime/pattern-analyzer.ts:L126-L148'
  - symbol: analyzeModelUsage
    kind: method
    at: 'src/runtime/pattern-analyzer.ts:L150-L173'
  - symbol: clusterErrors
    kind: method
    at: 'src/runtime/pattern-analyzer.ts:L175-L185'
  - symbol: generateReport
    kind: method
    at: 'src/runtime/pattern-analyzer.ts:L187-L202'
  - symbol: writePatternScenarios
    kind: method
    at: 'src/runtime/pattern-analyzer.ts:L207-L258'
  - symbol: ProfileError
    kind: class
    at: 'src/runtime/profile-registry.ts:L13-L18'
  - symbol: constructor
    kind: method
    at: 'src/runtime/profile-registry.ts:L14-L17'
  - symbol: ProfileNotFoundError
    kind: class
    at: 'src/runtime/profile-registry.ts:L20-L25'
  - symbol: constructor
    kind: method
    at: 'src/runtime/profile-registry.ts:L21-L24'
  - symbol: ProfileCycleError
    kind: class
    at: 'src/runtime/profile-registry.ts:L27-L32'
  - symbol: constructor
    kind: method
    at: 'src/runtime/profile-registry.ts:L28-L31'
  - symbol: ProfileRegistry
    kind: class
    at: 'src/runtime/profile-registry.ts:L44-L119'
  - symbol: register
    kind: method
    at: 'src/runtime/profile-registry.ts:L50-L52'
  - symbol: unregister
    kind: method
    at: 'src/runtime/profile-registry.ts:L58-L60'
  - symbol: get
    kind: method
    at: 'src/runtime/profile-registry.ts:L65-L67'
  - symbol: list
    kind: method
    at: 'src/runtime/profile-registry.ts:L72-L74'
  - symbol: resolve
    kind: method
    at: 'src/runtime/profile-registry.ts:L87-L89'
  - symbol: resolveInternal
    kind: method
    at: 'src/runtime/profile-registry.ts:L91-L118'
  - symbol: ObservationContext
    kind: interface
    at: 'src/runtime/self-observation.ts:L16-L25'
  - symbol: ISelfObservation
    kind: interface
    at: 'src/runtime/self-observation.ts:L28-L35'
  - symbol: PatternDetection
    kind: interface
    at: 'src/runtime/self-observation.ts:L38-L43'
  - symbol: SelfObservation
    kind: class
    at: 'src/runtime/self-observation.ts:L49-L134'
  - symbol: constructor
    kind: method
    at: 'src/runtime/self-observation.ts:L50-L53'
  - symbol: preTurn
    kind: method
    at: 'src/runtime/self-observation.ts:L55-L66'
  - symbol: postTurn
    kind: method
    at: 'src/runtime/self-observation.ts:L68-L101'
  - symbol: detectPatterns
    kind: method
    at: 'src/runtime/self-observation.ts:L103-L133'
  - symbol: SpawnConfigBuilder
    kind: class
    at: 'src/runtime/spawn-config.ts:L27-L130'
  - symbol: constructor
    kind: method
    at: 'src/runtime/spawn-config.ts:L33-L35'
  - symbol: fromProfile
    kind: method
    at: 'src/runtime/spawn-config.ts:L38-L42'
  - symbol: withModel
    kind: method
    at: 'src/runtime/spawn-config.ts:L45-L48'
  - symbol: withThinking
    kind: method
    at: 'src/runtime/spawn-config.ts:L51-L54'
  - symbol: withTools
    kind: method
    at: 'src/runtime/spawn-config.ts:L57-L60'
  - symbol: withContext
    kind: method
    at: 'src/runtime/spawn-config.ts:L63-L66'
  - symbol: withSystemPrompt
    kind: method
    at: 'src/runtime/spawn-config.ts:L69-L72'
  - symbol: withMaxContextMessages
    kind: method
    at: 'src/runtime/spawn-config.ts:L75-L78'
  - symbol: withMaxTokens
    kind: method
    at: 'src/runtime/spawn-config.ts:L81-L84'
  - symbol: withTemperature
    kind: method
    at: 'src/runtime/spawn-config.ts:L87-L90'
  - symbol: withStreaming
    kind: method
    at: 'src/runtime/spawn-config.ts:L93-L96'
  - symbol: withMaxIterations
    kind: method
    at: 'src/runtime/spawn-config.ts:L99-L102'
  - symbol: withToolTimeout
    kind: method
    at: 'src/runtime/spawn-config.ts:L105-L108'
  - symbol: build
    kind: method
    at: 'src/runtime/spawn-config.ts:L111-L129'
  - symbol: createSpawnConfig
    kind: function
    at: 'src/runtime/spawn-config.ts:L135-L137'
  - symbol: SpawnDependencies
    kind: interface
    at: 'src/runtime/spawn.ts:L23-L28'
  - symbol: spawn
    kind: function
    at: 'src/runtime/spawn.ts:L42-L132'
  - symbol: ToolContext
    kind: interface
    at: 'src/runtime/tool-registry.ts:L15-L19'
  - symbol: ToolResult
    kind: interface
    at: 'src/runtime/tool-registry.ts:L22-L28'
  - symbol: ToolHandler
    kind: type
    at: 'src/runtime/tool-registry.ts:L31-L34'
  - symbol: ToolRegistration
    kind: interface
    at: 'src/runtime/tool-registry.ts:L37-L43'
  - symbol: ToolError
    kind: class
    at: 'src/runtime/tool-registry.ts:L49-L63'
  - symbol: constructor
    kind: method
    at: 'src/runtime/tool-registry.ts:L53-L62'
  - symbol: ToolNotFoundError
    kind: class
    at: 'src/runtime/tool-registry.ts:L65-L70'
  - symbol: constructor
    kind: method
    at: 'src/runtime/tool-registry.ts:L66-L69'
  - symbol: ToolTimeoutError
    kind: class
    at: 'src/runtime/tool-registry.ts:L72-L77'
  - symbol: constructor
    kind: method
    at: 'src/runtime/tool-registry.ts:L73-L76'
  - symbol: ToolRegistry
    kind: class
    at: 'src/runtime/tool-registry.ts:L86-L225'
  - symbol: register
    kind: method
    at: 'src/runtime/tool-registry.ts:L92-L94'
  - symbol: unregister
    kind: method
    at: 'src/runtime/tool-registry.ts:L99-L101'
  - symbol: getDefinition
    kind: method
    at: 'src/runtime/tool-registry.ts:L106-L115'
  - symbol: getDefinitions
    kind: method
    at: 'src/runtime/tool-registry.ts:L120-L126'
  - symbol: has
    kind: method
    at: 'src/runtime/tool-registry.ts:L131-L133'
  - symbol: invoke
    kind: method
    at: 'src/runtime/tool-registry.ts:L138-L196'
  - symbol: invokeWithTimeout
    kind: method
    at: 'src/runtime/tool-registry.ts:L201-L224'
  - symbol: AgentProfile
    kind: interface
    at: 'src/runtime/types.ts:L13-L54'
  - symbol: SpawnConfig
    kind: interface
    at: 'src/runtime/types.ts:L61-L88'
---
<!-- context:generated:start -->
## Summary

Core execution loop integrating sessions, models, tools, hooks, and memory. Manages agent lifecycles with configurable profiles, dynamic tool registry based on performance patterns, and self-observation for introspection. Supports streaming responses, iteration limits, and fallback model providers.

## Related

- implements [[dynamic-tool-management]] — DynamicToolRegistry evaluates AnalysisReport patterns to disable failing tools or re-enable improving ones, emitting state change events.
- uses [[memory-system]] — AgentRuntime loads core memory (L3) via MemoryProvider; hooks inject memories before model calls; PatternAnalyzer writes scenarios to memory.
- implements [[profile-inheritance]] — ProfileRegistry resolves inheritance chains; SpawnConfigBuilder merges profile defaults with overrides; builtin profiles provide common defaults.
- produces [[projection-system]] — Runtime emits events via IEventStream that are consumed by projection protocols for UI surfaces.
- uses [[provenance-graph-system]] — AgentRuntime attaches provenance graph to sessions; tool calls are classified and added as nodes; graph tracks commitment-verification chains.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
