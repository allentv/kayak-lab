# src/cross-cutting/evaluation/metrics.ts · [[evaluation-framework]]

A metric collector module that records and computes evaluation metrics for tracking task completion, response quality, and tool usage efficiency across sessions.

- MetricCollector · class · L23-L138 — Collects and computes evaluation metrics in memory, providing derived metrics like task completion rate and tool usage efficiency for monitoring system performance.
- constructor · method · L27-L29 — Initializes the metric collector with optional configuration, defaulting to empty config if none provided.
- getConfig · method · L31-L33 — Returns a copy of the collector's configuration to prevent external mutation.
- record · method · L38-L47 — Records a metric by adding a timestamp and storing it in memory keyed by metric name for later retrieval.
- getMetrics · method · L52-L62 — Retrieves all metrics for a specific session by filtering through all stored metrics to support session-specific analysis.
- getMetricsByName · method · L67-L69 — Retrieves all metrics with a given name across all sessions for cross-session metric analysis.
- getTaskCompletionRate · method · L81-L93 — Computes the fraction of successfully completed tasks (value >= 1) out of all started tasks for a session to measure task completion effectiveness.
- getResponseQuality · method · L100-L109 — Calculates the average quality score of all responses in a session to assess response performance.
- getToolUsageEfficiency · method · L118-L130 — Measures the ratio of successful tool calls to total tool calls in a session to evaluate tool reliability and usage effectiveness.
- clear · method · L135-L137 — Clears all recorded metrics from memory to reset the collector state.
