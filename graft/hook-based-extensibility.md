---
name: Hook-Based Extensibility
slug: hook-based-extensibility
type: concept
sources:
  - path: src/runtime/__tests__/hooks.test.ts
    hash: 3aa309db06f0112b752fd20317ef16c38198135d64d19ebf25b7435b5a964bba
  - path: src/runtime/agent-runtime.ts
    hash: 7d7c326dcd7435ab4ed084c5d4510efcd6101ca049cacd887f9510aa2dc5cb04
  - path: src/runtime/hooks.ts
    hash: fa1df80a31102431e033364151bc92edc3b36a2575d2a23909e374c1835a86db
sources_digest: dd5f344b0d381271921684aeddbc1c66dbc083bef8253746ca61589781c4e88b
links:
  - to: runtime-orchestration
    relation: part_of
    description: >-
      HookRegistry is integrated into AgentRuntime; hooks can be registered via
      spawn configuration.
generator:
  version: 1
covers:
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
---
<!-- context:generated:start -->
## Summary

Lifecycle hooks at points like SessionStart, BeforeModelCall, AfterToolExecution allow interception and modification of runtime behavior. Hooks are isolated (errors don't propagate), can be session-scoped, and have timeout enforcement. Used for model selection, memory injection, and custom logic.

## Related

- part of [[runtime-orchestration]] — HookRegistry is integrated into AgentRuntime; hooks can be registered via spawn configuration.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
