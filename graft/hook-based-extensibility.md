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
---
<!-- context:generated:start -->
## Summary

Lifecycle hooks at points like SessionStart, BeforeModelCall, AfterToolExecution allow interception and modification of runtime behavior. Hooks are isolated (errors don't propagate), can be session-scoped, and have timeout enforcement. Used for model selection, memory injection, and custom logic.

## Related

- part of [[runtime-orchestration]] — HookRegistry is integrated into AgentRuntime; hooks can be registered via spawn configuration.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
