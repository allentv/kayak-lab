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
