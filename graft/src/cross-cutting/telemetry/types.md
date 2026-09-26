# src/cross-cutting/telemetry/types.ts · [[cross-cutting-telemetry]]

Central type definitions for telemetry including structured logging, metrics collection, and distributed tracing across the application.

- LogLevel · type · L10-L10 — Defines the severity levels for log messages to standardize logging verbosity across the system.
- LogEntry · interface · L13-L20 — Represents a structured log entry with timestamp, severity, component context, and optional metadata for comprehensive logging.
- LoggerConfig · interface · L23-L27 — Configures logger instances with component identification and minimum severity filtering for targeted logging.
- MetricValue · interface · L34-L39 — Encapsulates a single metric data point with name, numeric value, optional labels, and timestamp for monitoring system performance.
- MetricsConfig · interface · L42-L44 — Configures metrics collection with optional prefixing for organizing metric names across different system components.
- Span · interface · L51-L60 — Represents a single operation within a distributed trace, capturing timing, status, and attributes for performance analysis.
- TraceContext · interface · L63-L66 — Carries trace and span identifiers across service boundaries to maintain distributed tracing context in microservices.
