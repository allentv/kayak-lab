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
