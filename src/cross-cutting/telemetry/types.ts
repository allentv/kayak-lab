/**
 * Telemetry types for structured logging, metrics collection, and distributed tracing.
 */

// ============================================================================
// Log Types
// ============================================================================

/** Log severity level. */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** Structured log entry. */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  session_id?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/** Logger configuration. */
export interface LoggerConfig {
  component: string;
  minLevel?: LogLevel;
  sessionId?: string;
}

// ============================================================================
// Metric Types
// ============================================================================

/** A single metric data point. */
export interface MetricValue {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

/** Metrics collector configuration. */
export interface MetricsConfig {
  prefix?: string;
}

// ============================================================================
// Tracing Types
// ============================================================================

/** A single span within a trace. */
export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: "ok" | "error" | "unset";
  attributes?: Record<string, unknown>;
}

/** Trace context for propagating trace/span IDs. */
export interface TraceContext {
  traceId: string;
  spanId: string;
}
