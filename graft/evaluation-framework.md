---
name: Evaluation Framework
slug: evaluation-framework
type: system
sources:
  - path: src/cross-cutting/evaluation/benchmark.ts
    hash: ee162425c1ab24bc621e52a3f338af4d62d38bc9c3650bfdb1c285e77e319948
  - path: src/cross-cutting/evaluation/metrics.ts
    hash: d946a711ee6d8bc8e0a2b1f62bb31dd5f472b179637b9344ad24ea45fb18f5f6
  - path: src/cross-cutting/evaluation/mod.ts
    hash: 1ff51485fbcf40f3b71de943be38f992cab0715aee85cd6f7e42cd751199ac4a
  - path: src/cross-cutting/evaluation/quality.ts
    hash: b8770d9267c3fcebea6e112761bcb77eb957dea512a0bf98cc54af8295780c45
  - path: src/cross-cutting/evaluation/types.ts
    hash: 42fba63ed2da9854e19fc602992f0fb0fdcd1768417329c49c08c3f147bd18cf
sources_digest: bc25541b44177c7d70bd40fde91b410d4521d86a8d1cd8861f1f6915d9120900
links:
  - to: cross-cutting-telemetry
    relation: uses
    description: Evaluation results may be logged as structured telemetry for monitoring.
  - to: event-sourcing-session-lifecycle
    relation: produces
    description: >-
      Evaluation metrics are tied to session IDs for traceability across
      sessions.
generator:
  version: 1
covers:
  - symbol: BenchmarkRunner
    kind: class
    at: 'src/cross-cutting/evaluation/benchmark.ts:L27-L154'
  - symbol: constructor
    kind: method
    at: 'src/cross-cutting/evaluation/benchmark.ts:L30-L32'
  - symbol: runBenchmark
    kind: method
    at: 'src/cross-cutting/evaluation/benchmark.ts:L40-L96'
  - symbol: evaluateTestCase
    kind: method
    at: 'src/cross-cutting/evaluation/benchmark.ts:L105-L144'
  - symbol: calculateAggregateScore
    kind: method
    at: 'src/cross-cutting/evaluation/benchmark.ts:L149-L153'
  - symbol: stringSimilarity
    kind: function
    at: 'src/cross-cutting/evaluation/benchmark.ts:L164-L178'
  - symbol: bigrams
    kind: function
    at: 'src/cross-cutting/evaluation/benchmark.ts:L180-L186'
  - symbol: MetricCollector
    kind: class
    at: 'src/cross-cutting/evaluation/metrics.ts:L23-L138'
  - symbol: constructor
    kind: method
    at: 'src/cross-cutting/evaluation/metrics.ts:L27-L29'
  - symbol: getConfig
    kind: method
    at: 'src/cross-cutting/evaluation/metrics.ts:L31-L33'
  - symbol: record
    kind: method
    at: 'src/cross-cutting/evaluation/metrics.ts:L38-L47'
  - symbol: getMetrics
    kind: method
    at: 'src/cross-cutting/evaluation/metrics.ts:L52-L62'
  - symbol: getMetricsByName
    kind: method
    at: 'src/cross-cutting/evaluation/metrics.ts:L67-L69'
  - symbol: getTaskCompletionRate
    kind: method
    at: 'src/cross-cutting/evaluation/metrics.ts:L81-L93'
  - symbol: getResponseQuality
    kind: method
    at: 'src/cross-cutting/evaluation/metrics.ts:L100-L109'
  - symbol: getToolUsageEfficiency
    kind: method
    at: 'src/cross-cutting/evaluation/metrics.ts:L118-L130'
  - symbol: clear
    kind: method
    at: 'src/cross-cutting/evaluation/metrics.ts:L135-L137'
  - symbol: QualityScorer
    kind: class
    at: 'src/cross-cutting/evaluation/quality.ts:L24-L197'
  - symbol: constructor
    kind: method
    at: 'src/cross-cutting/evaluation/quality.ts:L28-L30'
  - symbol: computeScore
    kind: method
    at: 'src/cross-cutting/evaluation/quality.ts:L41-L60'
  - symbol: getScore
    kind: method
    at: 'src/cross-cutting/evaluation/quality.ts:L65-L67'
  - symbol: getTrend
    kind: method
    at: 'src/cross-cutting/evaluation/quality.ts:L75-L85'
  - symbol: getAllTrends
    kind: method
    at: 'src/cross-cutting/evaluation/quality.ts:L90-L99'
  - symbol: computeErrorRate
    kind: method
    at: 'src/cross-cutting/evaluation/quality.ts:L110-L115'
  - symbol: calculateOverallScore
    kind: method
    at: 'src/cross-cutting/evaluation/quality.ts:L120-L129'
  - symbol: collectDataPoints
    kind: method
    at: 'src/cross-cutting/evaluation/quality.ts:L134-L150'
  - symbol: determineTrend
    kind: method
    at: 'src/cross-cutting/evaluation/quality.ts:L158-L196'
  - symbol: EvaluationMetric
    kind: interface
    at: 'src/cross-cutting/evaluation/types.ts:L12-L18'
  - symbol: MetricCollectorConfig
    kind: interface
    at: 'src/cross-cutting/evaluation/types.ts:L21-L23'
  - symbol: BenchmarkCriteria
    kind: interface
    at: 'src/cross-cutting/evaluation/types.ts:L30-L34'
  - symbol: BenchmarkTestCase
    kind: interface
    at: 'src/cross-cutting/evaluation/types.ts:L37-L43'
  - symbol: BenchmarkDefinition
    kind: interface
    at: 'src/cross-cutting/evaluation/types.ts:L46-L51'
  - symbol: TestCaseResult
    kind: interface
    at: 'src/cross-cutting/evaluation/types.ts:L54-L60'
  - symbol: BenchmarkResult
    kind: interface
    at: 'src/cross-cutting/evaluation/types.ts:L63-L73'
  - symbol: QualityScore
    kind: interface
    at: 'src/cross-cutting/evaluation/types.ts:L80-L88'
  - symbol: QualityTrend
    kind: interface
    at: 'src/cross-cutting/evaluation/types.ts:L91-L96'
---
<!-- context:generated:start -->
## Summary

Cross-cutting system for collecting metrics, running benchmarks, and computing quality scores. MetricCollector records raw metrics; BenchmarkRunner executes test cases with multiple criteria (exact, substring, semantic similarity); QualityScorer computes weighted scores and trends. Designed for extensibility with custom metrics and benchmarks.

## Related

- uses [[cross-cutting-telemetry]] — Evaluation results may be logged as structured telemetry for monitoring.
- produces [[event-sourcing-session-lifecycle]] — Evaluation metrics are tied to session IDs for traceability across sessions.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
