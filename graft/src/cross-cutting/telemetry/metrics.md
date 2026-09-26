# src/cross-cutting/telemetry/metrics.ts · [[cross-cutting-telemetry]]

A metrics collector module that provides counters, gauges, and histograms for application telemetry with Prometheus export capability.

- MetricsCollector · class · L10-L144 — Collects and manages application metrics including counters, gauges, and histograms for monitoring system performance and behavior.
- constructor · method · L16-L18 — Initializes the metrics collector with optional configuration for customizing metric collection behavior.
- increment · method · L24-L27 — Increments a named counter metric to track occurrences of specific events or operations in the system.
- decrement · method · L29-L32 — Decrements a named counter metric to track reductions in specific event counts or operation frequencies.
- gauge · method · L38-L54 — Records a gauge metric representing a current value that can go up and down, such as memory usage or queue size.
- histogram · method · L60-L69 — Records histogram data points to analyze the distribution of values like request latencies or payload sizes.
- getCounter · method · L75-L77 — Retrieves the current value of a counter metric for monitoring or reporting purposes.
- getGauge · method · L79-L82 — Retrieves the most recent gauge value to monitor current system state metrics.
- getHistogram · method · L84-L89 — Calculates and returns statistical summary (count, sum, average) for histogram data to analyze value distributions.
- toPrometheus · method · L95-L121 — Exports all collected metrics in Prometheus text format for integration with monitoring systems.
- reset · method · L123-L127 — Clears all collected metrics to reset monitoring state for new measurement periods.
- metricKey · method · L133-L143 — Generates a unique key for metrics with labels by sorting and formatting label key-value pairs consistently.
