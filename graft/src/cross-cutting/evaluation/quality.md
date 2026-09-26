# src/cross-cutting/evaluation/quality.ts · [[evaluation-framework]]

Quality scorer for session evaluation that computes quality scores from collected metrics and tracks quality trends over time.

- QualityScorer · class · L24-L197 — Computes and tracks quality scores from evaluation metrics using weighted averages of task completion, response quality, tool efficiency, and error rate.
- constructor · method · L28-L30 — Initializes the quality scorer with a metric collector for gathering evaluation data.
- computeScore · method · L41-L60 — Computes the overall quality score for a session by gathering individual metrics and calculating a weighted average.
- getScore · method · L65-L67 — Retrieves the last computed quality score for a session from the internal cache.
- getTrend · method · L75-L85 — Analyzes the trend direction (improving, stable, or declining) for a specific quality metric over time.
- getAllTrends · method · L90-L99 — Generates trend analysis for all tracked quality metrics including overall score and individual components.
- computeErrorRate · method · L110-L115 — Calculates the error rate for a session as the fraction of error metrics out of total activity metrics.
- calculateOverallScore · method · L120-L129 — Computes the weighted average quality score using predefined weights for each metric component.
- collectDataPoints · method · L134-L150 — Collects historical data points for a specific metric from stored scores, optionally limited by a time window.
- determineTrend · method · L158-L196 — Determines trend direction using simple linear regression to classify metrics as improving, stable, or declining.
