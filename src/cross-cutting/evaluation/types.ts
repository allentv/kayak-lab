/**
 * Evaluation framework types.
 *
 * Defines interfaces for metrics collection, benchmarking, and quality scoring.
 */

// ============================================================================
// Metric Types
// ============================================================================

/** A single recorded metric. */
export interface EvaluationMetric {
  metric_name: string;
  value: number;
  timestamp: number;
  session_id: string;
  context?: Record<string, unknown>;
}

/** Configuration for metric collection. */
export interface MetricCollectorConfig {
  windowSize?: number; // for trend calculation
}

// ============================================================================
// Benchmark Types
// ============================================================================

/** How to evaluate a test case output. */
export interface BenchmarkCriteria {
  type: "exact" | "contains" | "semantic" | "custom";
  customFn?: (actual: unknown, expected: unknown) => boolean;
  threshold?: number;
}

/** A single test case within a benchmark. */
export interface BenchmarkTestCase {
  id: string;
  name: string;
  input: unknown;
  expectedOutput: unknown;
  criteria: BenchmarkCriteria;
}

/** Full benchmark definition. */
export interface BenchmarkDefinition {
  id: string;
  name: string;
  description: string;
  testCases: BenchmarkTestCase[];
}

/** Result of a single test case execution. */
export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  score: number;
  actualOutput?: unknown;
  duration_ms: number;
}

/** Aggregate result of running a benchmark. */
export interface BenchmarkResult {
  benchmarkId: string;
  sessionId: string;
  startTime: number;
  endTime: number;
  testCaseResults: TestCaseResult[];
  aggregateScore: number;
  passed: number;
  failed: number;
  total: number;
}

// ============================================================================
// Quality Scoring Types
// ============================================================================

/** Quality score for a session. */
export interface QualityScore {
  sessionId: string;
  overallScore: number;
  taskCompletion: number;
  responseQuality: number;
  toolEfficiency: number;
  errorRate: number;
  computedAt: number;
}

/** Trend data for a quality metric over time. */
export interface QualityTrend {
  metricName: string;
  dataPoints: Array<{ timestamp: number; value: number }>;
  trend: "improving" | "stable" | "declining";
  changeRate: number;
}
