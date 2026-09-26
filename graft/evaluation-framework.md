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
