# src/cross-cutting/telemetry/tracing.ts · [[cross-cutting-telemetry]]

Distributed tracing manager that provides OpenTelemetry-compatible trace and span management for application observability.

- TraceManager · class · L10-L115 — Manages distributed traces and spans with OpenTelemetry-compatible export for application monitoring and debugging.
- createTrace · method · L13-L17 — Creates a new trace with a unique identifier and initializes an empty span collection for it.
- startSpan · method · L19-L39 — Creates and records a new span within a trace, establishing parent-child relationships for distributed tracing.
- endSpan · method · L41-L54 — Finalizes a span by recording its end time and status, marking the completion of a traced operation.
- getTrace · method · L56-L58 — Retrieves all spans belonging to a specific trace for inspection or export purposes.
- getTraceContext · method · L60-L65 — Generates a new trace context with both trace and span identifiers for propagating tracing across service boundaries.
- toOpenTelemetry · method · L67-L110 — Converts internal trace data to OpenTelemetry-compatible format for integration with standard observability tools.
- generateId · method · L112-L114 — Generates unique identifiers for traces and spans using cryptographically secure random UUIDs.
