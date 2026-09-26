# src/cross-cutting/evaluation/types.ts · [[evaluation-framework]]

Defines the core type system for evaluation framework including metrics collection, benchmarking, and quality scoring components.

- EvaluationMetric · interface · L12-L18 — Represents a single recorded metric with contextual data for tracking system performance over time.
- MetricCollectorConfig · interface · L21-L23 — Configures metric collection behavior, particularly for trend calculation windows.
- BenchmarkCriteria · interface · L30-L34 — Defines how to evaluate test case outputs through various matching strategies and thresholds.
- BenchmarkTestCase · interface · L37-L43 — Represents a single test case within a benchmark with input, expected output, and evaluation criteria.
- BenchmarkDefinition · interface · L46-L51 — Defines a complete benchmark with multiple test cases for systematic evaluation of system capabilities.
- TestCaseResult · interface · L54-L60 — Captures the outcome of executing a single test case including pass/fail status and performance metrics.
- BenchmarkResult · interface · L63-L73 — Aggregates results from running a full benchmark with comprehensive statistics on performance and success rates.
- QualityScore · interface · L80-L88 — Represents a comprehensive quality assessment for a session across multiple dimensions including task completion and error rates.
- QualityTrend · interface · L91-L96 — Tracks the evolution of quality metrics over time with trend analysis and change rate calculations.
