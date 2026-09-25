---
name: Self-Observation and Pattern Detection
slug: self-observation-and-pattern-detection
type: concept
sources:
  - path: src/runtime/__tests__/self-observation.test.ts
    hash: 2888fccad79a71404f70abaa37a8a18bcb8ff6a005fa622c7d6a4fad021dfe27
  - path: src/runtime/pattern-analyzer.ts
    hash: e260254e00101782762612c24a7a7e4ed63a76bb7c79ab1bd9d45bcb16160527
  - path: src/runtime/self-observation.ts
    hash: cce70c21d21ace25e8ad48b852d6846a05d3caa93bc3b29a41ffd16fcde7736f
sources_digest: b8ac6e01de93a2991f9165fbdb5f31c6bf0e42176ce469b8dd9f79b56415b754
links:
  - to: runtime-orchestration
    relation: part_of
    description: >-
      SelfObservation hooks into runtime turns; PatternAnalyzer used by
      DynamicToolRegistry and for writing L2 scenarios.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Agent introspects its own event history before/after each turn, gathering tool performance metrics, error patterns, and session summaries. Automatically detects patterns like repeated tool failures or low success rates, emitting self_observed and pattern_detected events.

## Related

- part of [[runtime-orchestration]] — SelfObservation hooks into runtime turns; PatternAnalyzer used by DynamicToolRegistry and for writing L2 scenarios.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
