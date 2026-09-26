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
