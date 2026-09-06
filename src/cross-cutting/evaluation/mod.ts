/**
 * Evaluation framework module.
 *
 * Provides metric collection, benchmarking, and quality scoring
 * for system evaluation.
 */

export type {
  BenchmarkCriteria,
  BenchmarkDefinition,
  BenchmarkResult,
  BenchmarkTestCase,
  EvaluationMetric,
  MetricCollectorConfig,
  QualityScore,
  QualityTrend,
  TestCaseResult,
} from "./types.ts";

export { MetricCollector } from "./metrics.ts";
export { BenchmarkRunner } from "./benchmark.ts";
export { QualityScorer } from "./quality.ts";
