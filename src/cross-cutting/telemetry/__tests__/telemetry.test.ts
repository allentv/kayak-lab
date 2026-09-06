/**
 * Tests for the Telemetry module.
 */

import { assertEquals, assertExists } from "@std/assert";
import { StructuredLogger } from "../logger.ts";
import { MetricsCollector } from "../metrics.ts";
import { TraceManager } from "../tracing.ts";

// ============================================================================
// Logger Tests
// ============================================================================

Deno.test("Logger - outputs valid JSON with required fields", () => {
  const logger = new StructuredLogger({ component: "test" });
  logger.info("hello world");

  const entries = logger.getEntries();
  assertEquals(entries.length, 1);

  const entry = entries[0];
  assertExists(entry.timestamp);
  assertEquals(entry.level, "info");
  assertEquals(entry.component, "test");
  assertEquals(entry.message, "hello world");

  // Verify it is valid JSON
  const json = JSON.stringify(entry);
  JSON.parse(json);
});

Deno.test("Logger - respects minLevel filter", () => {
  const logger = new StructuredLogger({ component: "test", minLevel: "warn" });

  logger.debug("suppressed");
  logger.info("suppressed");
  logger.warn("visible");
  logger.error("visible");

  const entries = logger.getEntries();
  assertEquals(entries.length, 2);
  assertEquals(entries[0].level, "warn");
  assertEquals(entries[1].level, "error");
});

Deno.test("Logger - includes session_id when set", () => {
  const logger = new StructuredLogger({
    component: "test",
    sessionId: "sess-123",
  });
  logger.info("with session");

  const entries = logger.getEntries();
  assertEquals(entries[0].session_id, "sess-123");
});

Deno.test("Logger - includes metadata in output", () => {
  const logger = new StructuredLogger({ component: "test" });
  logger.info("with meta", { requestId: "abc", count: 42 });

  const entries = logger.getEntries();
  assertExists(entries[0].metadata);
  assertEquals(entries[0].metadata!["requestId"], "abc");
  assertEquals(entries[0].metadata!["count"], 42);
});

Deno.test("Logger - setSessionId updates subsequent entries", () => {
  const logger = new StructuredLogger({ component: "test" });
  logger.info("before");

  logger.setSessionId("new-session");
  logger.info("after");

  const entries = logger.getEntries();
  assertEquals(entries[0].session_id, undefined);
  assertEquals(entries[1].session_id, "new-session");
});

// ============================================================================
// Metrics Tests
// ============================================================================

Deno.test("Metrics - increment and decrement counters", () => {
  const metrics = new MetricsCollector();

  metrics.increment("requests");
  metrics.increment("requests");
  metrics.increment("requests");
  metrics.decrement("requests");

  assertEquals(metrics.getCounter("requests"), 2);
});

Deno.test("Metrics - counter with labels", () => {
  const metrics = new MetricsCollector();

  metrics.increment("requests", { method: "GET" });
  metrics.increment("requests", { method: "GET" });
  metrics.increment("requests", { method: "POST" });

  assertEquals(metrics.getCounter("requests{method=\"GET\"}"), 2);
  assertEquals(metrics.getCounter("requests{method=\"POST\"}"), 1);
});

Deno.test("Metrics - gauge values", () => {
  const metrics = new MetricsCollector();

  metrics.gauge("temperature", 20.5);
  metrics.gauge("temperature", 21.0);

  const gauge = metrics.getGauge("temperature");
  assertExists(gauge);
  assertEquals(gauge.value, 21.0);
});

Deno.test("Metrics - histogram compute stats", () => {
  const metrics = new MetricsCollector();

  metrics.histogram("latency", 10);
  metrics.histogram("latency", 20);
  metrics.histogram("latency", 30);

  const stats = metrics.getHistogram("latency");
  assertEquals(stats.count, 3);
  assertEquals(stats.sum, 60);
  assertEquals(stats.avg, 20);
});

Deno.test("Metrics - histogram empty returns zeros", () => {
  const metrics = new MetricsCollector();

  const stats = metrics.getHistogram("nonexistent");
  assertEquals(stats.count, 0);
  assertEquals(stats.sum, 0);
  assertEquals(stats.avg, 0);
});

Deno.test("Metrics - toPrometheus returns valid format", () => {
  const metrics = new MetricsCollector({ prefix: "app" });

  metrics.increment("requests_total");
  metrics.gauge("queue_depth", 5);
  metrics.histogram("duration_seconds", 0.5);
  metrics.histogram("duration_seconds", 1.5);

  const output = metrics.toPrometheus();

  // Check counter
  assertEquals(output.includes("# TYPE app_requests_total counter"), true);
  assertEquals(output.includes("app_requests_total 1"), true);

  // Check gauge
  assertEquals(output.includes("# TYPE app_queue_depth gauge"), true);
  assertEquals(output.includes("app_queue_depth 5"), true);

  // Check histogram
  assertEquals(output.includes("# TYPE app_duration_seconds histogram"), true);
  assertEquals(output.includes("app_duration_seconds_count 2"), true);
  assertEquals(output.includes("app_duration_seconds_sum 2"), true);
});

Deno.test("Metrics - reset clears all data", () => {
  const metrics = new MetricsCollector();

  metrics.increment("counter");
  metrics.gauge("gauge", 42);
  metrics.histogram("histogram", 10);

  metrics.reset();

  assertEquals(metrics.getCounter("counter"), 0);
  assertEquals(metrics.getGauge("gauge"), undefined);
  assertEquals(metrics.getHistogram("histogram").count, 0);
});

// ============================================================================
// Tracing Tests
// ============================================================================

Deno.test("Tracing - create trace returns traceId", () => {
  const tracing = new TraceManager();

  const traceId = tracing.createTrace();
  assertExists(traceId);
  assertEquals(typeof traceId, "string");
  assertEquals(traceId.length > 0, true);
});

Deno.test("Tracing - start and end span records timing", () => {
  const tracing = new TraceManager();

  const traceId = tracing.createTrace();
  const span = tracing.startSpan(traceId, "op-1");

  assertEquals(span.name, "op-1");
  assertEquals(span.status, "unset");
  assertEquals(span.startTime > 0, true);

  tracing.endSpan(traceId, span.spanId, "ok");

  const trace = tracing.getTrace(traceId);
  assertEquals(trace.length, 1);
  assertEquals(trace[0].status, "ok");
  assertExists(trace[0].endTime);
  assertEquals(trace[0].endTime! >= trace[0].startTime, true);
});

Deno.test("Tracing - nested spans with parentSpanId", () => {
  const tracing = new TraceManager();

  const traceId = tracing.createTrace();
  const parent = tracing.startSpan(traceId, "parent");
  const child = tracing.startSpan(traceId, "child", parent.spanId);

  assertEquals(child.parentSpanId, parent.spanId);

  tracing.endSpan(traceId, child.spanId, "ok");
  tracing.endSpan(traceId, parent.spanId, "ok");

  const trace = tracing.getTrace(traceId);
  assertEquals(trace.length, 2);
  assertEquals(trace[0].name, "parent");
  assertEquals(trace[1].name, "child");
  assertEquals(trace[1].parentSpanId, trace[0].spanId);
});

Deno.test("Tracing - toOpenTelemetry exports trace", () => {
  const tracing = new TraceManager();

  const traceId = tracing.createTrace();
  const span = tracing.startSpan(traceId, "test-span");
  tracing.endSpan(traceId, span.spanId, "ok");

  const otel = tracing.toOpenTelemetry(traceId) as Record<string, unknown>;
  assertExists(otel.resourceSpans);

  const resourceSpans = otel.resourceSpans as Array<Record<string, unknown>>;
  assertEquals(resourceSpans.length, 1);

  const scopeSpans = resourceSpans[0].scopeSpans as Array<
    Record<string, unknown>
  >;
  assertEquals(scopeSpans.length, 1);

  const spans = scopeSpans[0].spans as Array<Record<string, unknown>>;
  assertEquals(spans.length, 1);
  assertEquals(spans[0].name, "test-span");
});

Deno.test("Tracing - getTraceContext creates new context", () => {
  const tracing = new TraceManager();

  const ctx = tracing.getTraceContext();
  assertExists(ctx.traceId);
  assertExists(ctx.spanId);
  assertEquals(ctx.traceId.length > 0, true);
  assertEquals(ctx.spanId.length > 0, true);
});

// ============================================================================
// Integration Test
// ============================================================================

Deno.test("Integration - all components work together", () => {
  const logger = new StructuredLogger({ component: "integration-test" });
  const metrics = new MetricsCollector({ prefix: "test" });
  const tracing = new TraceManager();

  // Start a trace
  const traceId = tracing.createTrace();
  const span = tracing.startSpan(traceId, "process-request");

  // Log the request
  logger.info("Processing request", { traceId });

  // Record metrics
  metrics.increment("requests_total");
  metrics.histogram("request_duration_ms", 42);

  // End the trace
  tracing.endSpan(traceId, span.spanId, "ok");

  // Verify everything was recorded
  assertEquals(logger.getEntries().length, 1);
  assertEquals(logger.getEntries()[0].metadata!["traceId"], traceId);
  assertEquals(metrics.getCounter("requests_total"), 1);
  assertEquals(metrics.getHistogram("request_duration_ms").count, 1);

  const trace = tracing.getTrace(traceId);
  assertEquals(trace.length, 1);
  assertEquals(trace[0].status, "ok");

  // Verify Prometheus export includes all metric types
  const prom = metrics.toPrometheus();
  assertEquals(prom.includes("test_requests_total"), true);
  assertEquals(prom.includes("test_request_duration_ms_count"), true);
});
