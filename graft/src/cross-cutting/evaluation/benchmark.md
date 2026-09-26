# src/cross-cutting/evaluation/benchmark.ts · [[evaluation-framework]]

Benchmark runner for evaluating system performance by executing test cases against an executor function, scoring results using configurable criteria, and recording metrics.

- BenchmarkRunner · class · L27-L154 — Core benchmark execution engine that orchestrates test case runs, evaluates results against criteria, and aggregates performance scores.
- constructor · method · L30-L32 — Initializes the benchmark runner with a metric collector for recording performance measurements.
- runBenchmark · method · L40-L96 — Executes all test cases in a benchmark definition sequentially, scores each result, records per-case metrics, and returns aggregate performance results.
- evaluateTestCase · method · L105-L144 — Evaluates a single test case's actual output against its criteria (exact match, contains, semantic similarity, or custom function) to determine pass/fail and score.
- calculateAggregateScore · method · L149-L153 — Computes the overall benchmark score as the average of all individual test case scores.
- stringSimilarity · function · L164-L178 — Calculates string similarity using bigram overlap (Sorensen–Dice style) for semantic matching in benchmark evaluations.
- bigrams · function · L180-L186 — Extracts all consecutive two-character substrings from a string for use in similarity calculations.
