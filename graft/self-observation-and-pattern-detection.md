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
covers:
  - symbol: createTestEvent
    kind: function
    at: 'src/runtime/__tests__/self-observation.test.ts:L11-L27'
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
---
<!-- context:generated:start -->
## Summary

Agent introspects its own event history before/after each turn, gathering tool performance metrics, error patterns, and session summaries. Automatically detects patterns like repeated tool failures or low success rates, emitting self_observed and pattern_detected events.

## Related

- part of [[runtime-orchestration]] — SelfObservation hooks into runtime turns; PatternAnalyzer used by DynamicToolRegistry and for writing L2 scenarios.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
