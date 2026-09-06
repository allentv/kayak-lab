/**
 * Metric collector for evaluation metrics.
 *
 * Records and retrieves evaluation metrics, computes derived metrics
 * like task completion rate, response quality, and tool usage efficiency.
 */

import type {
  EvaluationMetric,
  MetricCollectorConfig,
} from "./types.ts";

// ============================================================================
// Metric Collector
// ============================================================================

/**
 * Collects and computes evaluation metrics.
 *
 * Metrics are stored in memory, keyed by metric name for efficient lookup.
 * Provides computed metrics that derive from raw recorded values.
 */
export class MetricCollector {
  private metrics: Map<string, EvaluationMetric[]> = new Map();
  private readonly config: MetricCollectorConfig;

  constructor(config?: MetricCollectorConfig) {
    this.config = config ?? {};
  }

  getConfig(): MetricCollectorConfig {
    return { ...this.config };
  }

  /**
   * Record a metric. Timestamp is set automatically.
   */
  record(metric: Omit<EvaluationMetric, "timestamp">): void {
    const entry: EvaluationMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    const list = this.metrics.get(metric.metric_name) ?? [];
    list.push(entry);
    this.metrics.set(metric.metric_name, list);
  }

  /**
   * Get all metrics for a given session.
   */
  getMetrics(sessionId: string): EvaluationMetric[] {
    const result: EvaluationMetric[] = [];
    for (const list of this.metrics.values()) {
      for (const m of list) {
        if (m.session_id === sessionId) {
          result.push(m);
        }
      }
    }
    return result;
  }

  /**
   * Get all metrics with a given name across all sessions.
   */
  getMetricsByName(metricName: string): EvaluationMetric[] {
    return this.metrics.get(metricName) ?? [];
  }

  // ---------------------------------------------------------------------------
  // Computed Metrics
  // ---------------------------------------------------------------------------

  /**
   * Compute the task completion rate for a session.
   *
   * Returns the fraction of "task.completed" metrics where value >= 1
   * out of all "task.started" metrics. Defaults to 0 if no tasks started.
   */
  getTaskCompletionRate(sessionId: string): number {
    const sessionMetrics = this.getMetrics(sessionId);
    const started = sessionMetrics.filter(
      (m) => m.metric_name === "task.started",
    );
    const completed = sessionMetrics.filter(
      (m) => m.metric_name === "task.completed",
    );

    if (started.length === 0) return 0;
    const successful = completed.filter((m) => m.value >= 1).length;
    return successful / started.length;
  }

  /**
   * Compute the response quality score for a session.
   *
   * Averages all "response.quality" metric values. Returns 0 if none exist.
   */
  getResponseQuality(sessionId: string): number {
    const sessionMetrics = this.getMetrics(sessionId);
    const quality = sessionMetrics.filter(
      (m) => m.metric_name === "response.quality",
    );

    if (quality.length === 0) return 0;
    const sum = quality.reduce((acc, m) => acc + m.value, 0);
    return sum / quality.length;
  }

  /**
   * Compute the tool usage efficiency for a session.
   *
   * Measures the ratio of successful tool calls to total tool calls.
   * "tool.success" count / ("tool.success" + "tool.failure") count.
   * Returns 0 if no tool calls recorded.
   */
  getToolUsageEfficiency(sessionId: string): number {
    const sessionMetrics = this.getMetrics(sessionId);
    const successes = sessionMetrics.filter(
      (m) => m.metric_name === "tool.success",
    ).length;
    const failures = sessionMetrics.filter(
      (m) => m.metric_name === "tool.failure",
    ).length;

    const total = successes + failures;
    if (total === 0) return 0;
    return successes / total;
  }

  /**
   * Clear all recorded metrics.
   */
  clear(): void {
    this.metrics.clear();
  }
}
