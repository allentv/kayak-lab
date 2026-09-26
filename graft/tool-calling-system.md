---
name: Tool Calling System
slug: tool-calling-system
type: system
sources:
  - path: src/tools/__tests__/authoring.test.ts
    hash: b0666b7f701dda9bdcfbb17755f13c64085d9afc50360e181dad443814867414
  - path: src/tools/__tests__/calling-engine.test.ts
    hash: a3c3422d02b7f64e59c67e39d83ebeaf2607b3e3f1e6fcac4187d57bb801569b
  - path: src/tools/__tests__/registry.test.ts
    hash: cce0be24e4be3c758074c7856a0c41096de8988fa9fd6a15371046f86bd714e3
  - path: src/tools/__tests__/self-improvement.test.ts
    hash: 313134dc1c21ecfa4293105933fa5f66a8a63879e439842ade8b6a7fd3fe17d7
  - path: src/tools/__tests__/tool-definition.test.ts
    hash: 591f9ac41606115ae4ed5e05c0409174ae28145571e8681aa672b9553046b990
  - path: src/tools/authoring.ts
    hash: 7cf3bc8da36111244d1a70541faba46c366a7f42adaa11580a760d6abf47e18a
  - path: src/tools/calling-engine.ts
    hash: c92e37a2ea3d9614dd85d5bbcc8932aedcb2319dae0aeb8cd99e6500d191d5ec
  - path: src/tools/mod.ts
    hash: 7f1042aa69c6e6eff775aeaeb9e489e229462d2fbf74e6dc9273300a92c22039
  - path: src/tools/registry.ts
    hash: 9d4f51d9625af4828495f380f9170e4bdec49f6e39696c7f186f969c7bf19ca9
  - path: src/tools/self-improvement.ts
    hash: 714642dc034d070e48da98cd1459745eb992af94309dc730fb2f414d0e03cb5a
  - path: src/tools/tool-definition.ts
    hash: 2200f14d4bab685ec4d72f3088cdbccfb72fd4f0f22e6ed33bb6104d21755631
  - path: src/tools/types.ts
    hash: e9bd0618cf6f748ef4b75686668bf0bf43f8bdcc31d9027abc856db5715a9a1a
sources_digest: d4ddd9ed2b196af7cc37305b647c0b8c03a02744ef36f7c5c0b44e3f8b572bd1
links:
  - to: event-sourcing-persistence-system
    relation: uses
    description: >-
      ToolSelfImprovement queries event store for usage patterns to suggest
      optimizations.
  - to: event-type-taxonomy
    relation: produces
    description: Emits TOOL_EXECUTION_COMPLETED and related events to EventStore.
  - to: tool-self-improvement-feedback-loop
    relation: implements
    description: >-
      ToolSelfImprovement class analyzes tool performance and creates new tool
      proposals.
generator:
  version: 1
covers:
  - symbol: testHandler
    kind: function
    at: 'src/tools/__tests__/authoring.test.ts:L16-L24'
  - symbol: ctx
    kind: function
    at: 'src/tools/__tests__/calling-engine.test.ts:L18-L22'
  - symbol: echoHandler
    kind: function
    at: 'src/tools/__tests__/registry.test.ts:L17-L27'
  - symbol: AuthoringDecision
    kind: type
    at: 'src/tools/authoring.ts:L17-L20'
  - symbol: ProposalContext
    kind: interface
    at: 'src/tools/authoring.ts:L23-L30'
  - symbol: ToolProposal
    kind: interface
    at: 'src/tools/authoring.ts:L33-L40'
  - symbol: ToolAuthoringEvents
    kind: interface
    at: 'src/tools/authoring.ts:L47-L51'
  - symbol: IToolAuthoring
    kind: interface
    at: 'src/tools/authoring.ts:L60-L67'
  - symbol: ToolAuthoring
    kind: class
    at: 'src/tools/authoring.ts:L76-L137'
  - symbol: constructor
    kind: method
    at: 'src/tools/authoring.ts:L81-L84'
  - symbol: propose
    kind: method
    at: 'src/tools/authoring.ts:L86-L95'
  - symbol: decide
    kind: method
    at: 'src/tools/authoring.ts:L97-L132'
  - symbol: pending
    kind: method
    at: 'src/tools/authoring.ts:L134-L136'
  - symbol: ToolCallingError
    kind: class
    at: 'src/tools/calling-engine.ts:L20-L32'
  - symbol: constructor
    kind: method
    at: 'src/tools/calling-engine.ts:L23-L31'
  - symbol: ToolInvocationTimeoutError
    kind: class
    at: 'src/tools/calling-engine.ts:L34-L39'
  - symbol: constructor
    kind: method
    at: 'src/tools/calling-engine.ts:L35-L38'
  - symbol: IToolCallingEngine
    kind: interface
    at: 'src/tools/calling-engine.ts:L48-L84'
  - symbol: ToolCallingEngine
    kind: class
    at: 'src/tools/calling-engine.ts:L93-L215'
  - symbol: validate
    kind: method
    at: 'src/tools/calling-engine.ts:L94-L97'
  - symbol: invoke
    kind: method
    at: 'src/tools/calling-engine.ts:L99-L156'
  - symbol: formatSuccess
    kind: method
    at: 'src/tools/calling-engine.ts:L158-L173'
  - symbol: formatError
    kind: method
    at: 'src/tools/calling-engine.ts:L175-L190'
  - symbol: invokeWithTimeout
    kind: method
    at: 'src/tools/calling-engine.ts:L192-L214'
  - symbol: ToolRegistryError
    kind: class
    at: 'src/tools/registry.ts:L22-L27'
  - symbol: constructor
    kind: method
    at: 'src/tools/registry.ts:L23-L26'
  - symbol: ToolNotRegisteredError
    kind: class
    at: 'src/tools/registry.ts:L29-L34'
  - symbol: constructor
    kind: method
    at: 'src/tools/registry.ts:L30-L33'
  - symbol: ToolRegistryEvents
    kind: interface
    at: 'src/tools/registry.ts:L41-L53'
  - symbol: IToolRegistry
    kind: interface
    at: 'src/tools/registry.ts:L62-L79'
  - symbol: ToolRegistry
    kind: class
    at: 'src/tools/registry.ts:L89-L216'
  - symbol: constructor
    kind: method
    at: 'src/tools/registry.ts:L94-L97'
  - symbol: register
    kind: method
    at: 'src/tools/registry.ts:L99-L111'
  - symbol: unregister
    kind: method
    at: 'src/tools/registry.ts:L113-L119'
  - symbol: list
    kind: method
    at: 'src/tools/registry.ts:L121-L123'
  - symbol: get
    kind: method
    at: 'src/tools/registry.ts:L125-L131'
  - symbol: has
    kind: method
    at: 'src/tools/registry.ts:L133-L135'
  - symbol: enable
    kind: method
    at: 'src/tools/registry.ts:L137-L146'
  - symbol: disable
    kind: method
    at: 'src/tools/registry.ts:L148-L157'
  - symbol: isEnabled
    kind: method
    at: 'src/tools/registry.ts:L159-L162'
  - symbol: findByCapability
    kind: method
    at: 'src/tools/registry.ts:L164-L170'
  - symbol: findByCategory
    kind: method
    at: 'src/tools/registry.ts:L172-L176'
  - symbol: invoke
    kind: method
    at: 'src/tools/registry.ts:L178-L215'
  - symbol: SelfImprovementConfig
    kind: interface
    at: 'src/tools/self-improvement.ts:L17-L24'
  - symbol: ToolSuggestion
    kind: interface
    at: 'src/tools/self-improvement.ts:L37-L48'
  - symbol: ToolUsageRecord
    kind: interface
    at: 'src/tools/self-improvement.ts:L51-L57'
  - symbol: SelfImprovementEvents
    kind: interface
    at: 'src/tools/self-improvement.ts:L64-L68'
  - symbol: IToolSelfImprovement
    kind: interface
    at: 'src/tools/self-improvement.ts:L77-L86'
  - symbol: ToolSelfImprovement
    kind: class
    at: 'src/tools/self-improvement.ts:L95-L280'
  - symbol: constructor
    kind: method
    at: 'src/tools/self-improvement.ts:L102-L112'
  - symbol: recordUsage
    kind: method
    at: 'src/tools/self-improvement.ts:L114-L116'
  - symbol: analyze
    kind: method
    at: 'src/tools/self-improvement.ts:L118-L154'
  - symbol: getConfig
    kind: method
    at: 'src/tools/self-improvement.ts:L156-L158'
  - symbol: setConfig
    kind: method
    at: 'src/tools/self-improvement.ts:L160-L162'
  - symbol: analyzeFailurePatterns
    kind: method
    at: 'src/tools/self-improvement.ts:L164-L194'
  - symbol: analyzeSlowTools
    kind: method
    at: 'src/tools/self-improvement.ts:L196-L225'
  - symbol: analyzeMissingCapabilities
    kind: method
    at: 'src/tools/self-improvement.ts:L227-L256'
  - symbol: autoCreate
    kind: method
    at: 'src/tools/self-improvement.ts:L258-L273'
  - symbol: handler
    kind: function
    at: 'src/tools/self-improvement.ts:L261-L269'
  - symbol: autoImprove
    kind: method
    at: 'src/tools/self-improvement.ts:L275-L279'
  - symbol: ToolDefinitionError
    kind: class
    at: 'src/tools/tool-definition.ts:L14-L22'
  - symbol: constructor
    kind: method
    at: 'src/tools/tool-definition.ts:L15-L21'
  - symbol: ParameterValidationError
    kind: class
    at: 'src/tools/tool-definition.ts:L24-L35'
  - symbol: constructor
    kind: method
    at: 'src/tools/tool-definition.ts:L27-L34'
  - symbol: ToolDefinition
    kind: class
    at: 'src/tools/tool-definition.ts:L47-L256'
  - symbol: constructor
    kind: method
    at: 'src/tools/tool-definition.ts:L50-L52'
  - symbol: create
    kind: method
    at: 'src/tools/tool-definition.ts:L59-L68'
  - symbol: validate
    kind: method
    at: 'src/tools/tool-definition.ts:L74-L95'
  - symbol: validateParameters
    kind: method
    at: 'src/tools/tool-definition.ts:L100-L138'
  - symbol: validateParameters
    kind: method
    at: 'src/tools/tool-definition.ts:L145-L175'
  - symbol: validateProperty
    kind: method
    at: 'src/tools/tool-definition.ts:L180-L216'
  - symbol: matchType
    kind: method
    at: 'src/tools/tool-definition.ts:L221-L238'
  - symbol: definition
    kind: method
    at: 'src/tools/tool-definition.ts:L241-L243'
  - symbol: name
    kind: method
    at: 'src/tools/tool-definition.ts:L246-L248'
  - symbol: toJSON
    kind: method
    at: 'src/tools/tool-definition.ts:L253-L255'
  - symbol: ParameterSchema
    kind: interface
    at: 'src/tools/types.ts:L13-L22'
  - symbol: ParameterProperty
    kind: interface
    at: 'src/tools/types.ts:L25-L34'
  - symbol: ToolCapability
    kind: interface
    at: 'src/tools/types.ts:L37-L44'
  - symbol: ToolCategory
    kind: interface
    at: 'src/tools/types.ts:L47-L52'
  - symbol: IToolDefinition
    kind: interface
    at: 'src/tools/types.ts:L58-L73'
  - symbol: ToolResult
    kind: interface
    at: 'src/tools/types.ts:L80-L95'
  - symbol: ToolHandlerContext
    kind: interface
    at: 'src/tools/types.ts:L102-L109'
  - symbol: ToolHandler
    kind: type
    at: 'src/tools/types.ts:L112-L115'
  - symbol: ToolRegistration
    kind: interface
    at: 'src/tools/types.ts:L122-L129'
---
<!-- context:generated:start -->
## Summary

Comprehensive tool management framework following OpenAI's function-calling pattern, with registry, validation, execution engine, authoring, and self-improvement capabilities. Handles tool lifecycle from definition to invocation with structured error handling and performance monitoring.

## Related

- uses [[event-sourcing-persistence-system]] — ToolSelfImprovement queries event store for usage patterns to suggest optimizations.
- produces [[event-type-taxonomy]] — Emits TOOL_EXECUTION_COMPLETED and related events to EventStore.
- implements [[tool-self-improvement-feedback-loop]] — ToolSelfImprovement class analyzes tool performance and creates new tool proposals.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
