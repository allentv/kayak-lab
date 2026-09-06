/**
 * Quality scorer for session evaluation.
 *
 * Computes quality scores from collected metrics and tracks
 * quality trends over time.
 */

import type {
  QualityScore,
  QualityTrend,
} from "./types.ts";
import type { MetricCollector } from "./metrics.ts";

// ============================================================================
// Quality Scorer
// ============================================================================

/**
 * Computes and tracks quality scores from evaluation metrics.
 *
 * Scores are derived from task completion, response quality,
 * tool efficiency, and error rate metrics.
 */
export class QualityScorer {
  private metricCollector: MetricCollector;
  private scores: Map<string, QualityScore> = new Map();

  constructor(metricCollector: MetricCollector) {
    this.metricCollector = metricCollector;
  }

  /**
   * Compute the quality score for a session.
   *
   * Overall score is a weighted average of:
   * - taskCompletion (weight 0.3)
   * - responseQuality (weight 0.3)
   * - toolEfficiency (weight 0.25)
   * - 1 - errorRate (weight 0.15)
   */
  computeScore(sessionId: string): QualityScore {
    const taskCompletion = this.metricCollector.getTaskCompletionRate(sessionId);
    const responseQuality = this.metricCollector.getResponseQuality(sessionId);
    const toolEfficiency = this.metricCollector.getToolUsageEfficiency(sessionId);
    const errorRate = this.computeErrorRate(sessionId);

    const score: QualityScore = {
      sessionId,
      overallScore: 0,
      taskCompletion,
      responseQuality,
      toolEfficiency,
      errorRate,
      computedAt: Date.now(),
    };

    score.overallScore = this.calculateOverallScore(score);
    this.scores.set(sessionId, score);
    return score;
  }

  /**
   * Get the last computed score for a session.
   */
  getScore(sessionId: string): QualityScore | undefined {
    return this.scores.get(sessionId);
  }

  /**
   * Get the trend for a specific metric over time.
   *
   * Collects data points from computed scores and determines whether
   * the metric is improving, stable, or declining.
   */
  getTrend(metricName: string, windowSize?: number): QualityTrend {
    const dataPoints = this.collectDataPoints(metricName, windowSize);
    const { trend, changeRate } = this.determineTrend(dataPoints);

    return {
      metricName,
      dataPoints,
      trend,
      changeRate,
    };
  }

  /**
   * Get trends for all tracked quality metrics.
   */
  getAllTrends(windowSize?: number): QualityTrend[] {
    const metricNames = [
      "overallScore",
      "taskCompletion",
      "responseQuality",
      "toolEfficiency",
      "errorRate",
    ];
    return metricNames.map((name) => this.getTrend(name, windowSize));
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Calculate the error rate for a session.
   *
   * Returns the fraction of error metrics out of total activity metrics.
   */
  private computeErrorRate(sessionId: string): number {
    const sessionMetrics = this.metricCollector.getMetrics(sessionId);
    const errors = sessionMetrics.filter((m) => m.metric_name === "error").length;
    if (sessionMetrics.length === 0) return 0;
    return errors / sessionMetrics.length;
  }

  /**
   * Calculate the overall quality score as a weighted average.
   */
  private calculateOverallScore(
    score: Omit<QualityScore, "overallScore" | "computedAt">,
  ): number {
    return (
      score.taskCompletion * 0.3 +
      score.responseQuality * 0.3 +
      score.toolEfficiency * 0.25 +
      (1 - score.errorRate) * 0.15
    );
  }

  /**
   * Collect data points for a metric from stored scores.
   */
  private collectDataPoints(
    metricName: string,
    windowSize?: number,
  ): Array<{ timestamp: number; value: number }> {
    const allScores = Array.from(this.scores.values());
    const points = allScores.map((s) => ({
      timestamp: s.computedAt,
      value: (s as unknown as Record<string, unknown>)[metricName] as number,
    }));

    points.sort((a, b) => a.timestamp - b.timestamp);

    if (windowSize && points.length > windowSize) {
      return points.slice(-windowSize);
    }
    return points;
  }

  /**
   * Determine the trend direction using simple linear regression.
   *
   * Returns "improving" for positive slope, "stable" for near-zero,
   * and "declining" for negative slope.
   */
  determineTrend(
    dataPoints: Array<{ timestamp: number; value: number }>,
  ): { trend: QualityTrend["trend"]; changeRate: number } {
    if (dataPoints.length < 2) {
      return { trend: "stable", changeRate: 0 };
    }

    // Simple linear regression slope
    const n = dataPoints.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      const x = i; // Use index as x for simplicity
      const y = dataPoints[i].value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Threshold for "stable" — slope magnitude < 0.01
    const STABLE_THRESHOLD = 0.01;

    let trend: QualityTrend["trend"];
    if (slope > STABLE_THRESHOLD) {
      trend = "improving";
    } else if (slope < -STABLE_THRESHOLD) {
      trend = "declining";
    } else {
      trend = "stable";
    }

    return { trend, changeRate: slope };
  }
}
