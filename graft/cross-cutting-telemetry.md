---
name: Cross-Cutting Telemetry
slug: cross-cutting-telemetry
type: system
sources:
  - path: src/cross-cutting/telemetry/logger.ts
    hash: 3ad39db92ac2c69cf07f6230498fbcd06305c43b2b73b4950e1f0dd8b1586f74
  - path: src/cross-cutting/telemetry/metrics.ts
    hash: dca4e983f2782a177cf53ebd59ec20ddb8ef00c87c18f47408728094a07b65bd
  - path: src/cross-cutting/telemetry/mod.ts
    hash: 2ff1e54954e8d762b15db008508704b75339604818d418d2dfcf024d2d080987
  - path: src/cross-cutting/telemetry/tracing.ts
    hash: 10f4377bb473257694c202de4f8087cdf0bc1d18595adcd37a488a3df4b90ca9
  - path: src/cross-cutting/telemetry/types.ts
    hash: 7ca7bd532a30c7efee92dcf5702290cc62dfe31ba3b3722c47b43b0142595677
sources_digest: c554afd748e5b8fb20717b7d89eae04aeb0d64dfa93017d61e14e4a2e64d9c99
links:
  - to: event-sourcing-session-lifecycle
    relation: validates
    description: >-
      Telemetry logs and traces capture all event emissions and session state
      transitions.
  - to: identity-authorization
    relation: uses
    description: >-
      Logger and traces can attach user identity from middleware via
      attachUserToMetadata.
generator:
  version: 1
covers:
  - symbol: StructuredLogger
    kind: class
    at: 'src/cross-cutting/telemetry/logger.ts:L17-L91'
  - symbol: constructor
    kind: method
    at: 'src/cross-cutting/telemetry/logger.ts:L21-L26'
  - symbol: debug
    kind: method
    at: 'src/cross-cutting/telemetry/logger.ts:L28-L30'
  - symbol: info
    kind: method
    at: 'src/cross-cutting/telemetry/logger.ts:L32-L34'
  - symbol: warn
    kind: method
    at: 'src/cross-cutting/telemetry/logger.ts:L36-L38'
  - symbol: error
    kind: method
    at: 'src/cross-cutting/telemetry/logger.ts:L40-L42'
  - symbol: setSessionId
    kind: method
    at: 'src/cross-cutting/telemetry/logger.ts:L44-L46'
  - symbol: getEntries
    kind: method
    at: 'src/cross-cutting/telemetry/logger.ts:L48-L50'
  - symbol: clear
    kind: method
    at: 'src/cross-cutting/telemetry/logger.ts:L52-L54'
  - symbol: log
    kind: method
    at: 'src/cross-cutting/telemetry/logger.ts:L56-L86'
  - symbol: formatJson
    kind: method
    at: 'src/cross-cutting/telemetry/logger.ts:L88-L90'
  - symbol: MetricsCollector
    kind: class
    at: 'src/cross-cutting/telemetry/metrics.ts:L10-L144'
  - symbol: constructor
    kind: method
    at: 'src/cross-cutting/telemetry/metrics.ts:L16-L18'
  - symbol: increment
    kind: method
    at: 'src/cross-cutting/telemetry/metrics.ts:L24-L27'
  - symbol: decrement
    kind: method
    at: 'src/cross-cutting/telemetry/metrics.ts:L29-L32'
  - symbol: gauge
    kind: method
    at: 'src/cross-cutting/telemetry/metrics.ts:L38-L54'
  - symbol: histogram
    kind: method
    at: 'src/cross-cutting/telemetry/metrics.ts:L60-L69'
  - symbol: getCounter
    kind: method
    at: 'src/cross-cutting/telemetry/metrics.ts:L75-L77'
  - symbol: getGauge
    kind: method
    at: 'src/cross-cutting/telemetry/metrics.ts:L79-L82'
  - symbol: getHistogram
    kind: method
    at: 'src/cross-cutting/telemetry/metrics.ts:L84-L89'
  - symbol: toPrometheus
    kind: method
    at: 'src/cross-cutting/telemetry/metrics.ts:L95-L121'
  - symbol: reset
    kind: method
    at: 'src/cross-cutting/telemetry/metrics.ts:L123-L127'
  - symbol: metricKey
    kind: method
    at: 'src/cross-cutting/telemetry/metrics.ts:L133-L143'
  - symbol: TraceManager
    kind: class
    at: 'src/cross-cutting/telemetry/tracing.ts:L10-L115'
  - symbol: createTrace
    kind: method
    at: 'src/cross-cutting/telemetry/tracing.ts:L13-L17'
  - symbol: startSpan
    kind: method
    at: 'src/cross-cutting/telemetry/tracing.ts:L19-L39'
  - symbol: endSpan
    kind: method
    at: 'src/cross-cutting/telemetry/tracing.ts:L41-L54'
  - symbol: getTrace
    kind: method
    at: 'src/cross-cutting/telemetry/tracing.ts:L56-L58'
  - symbol: getTraceContext
    kind: method
    at: 'src/cross-cutting/telemetry/tracing.ts:L60-L65'
  - symbol: toOpenTelemetry
    kind: method
    at: 'src/cross-cutting/telemetry/tracing.ts:L67-L110'
  - symbol: generateId
    kind: method
    at: 'src/cross-cutting/telemetry/tracing.ts:L112-L114'
  - symbol: LogLevel
    kind: type
    at: 'src/cross-cutting/telemetry/types.ts:L10-L10'
  - symbol: LogEntry
    kind: interface
    at: 'src/cross-cutting/telemetry/types.ts:L13-L20'
  - symbol: LoggerConfig
    kind: interface
    at: 'src/cross-cutting/telemetry/types.ts:L23-L27'
  - symbol: MetricValue
    kind: interface
    at: 'src/cross-cutting/telemetry/types.ts:L34-L39'
  - symbol: MetricsConfig
    kind: interface
    at: 'src/cross-cutting/telemetry/types.ts:L42-L44'
  - symbol: Span
    kind: interface
    at: 'src/cross-cutting/telemetry/types.ts:L51-L60'
  - symbol: TraceContext
    kind: interface
    at: 'src/cross-cutting/telemetry/types.ts:L63-L66'
---
<!-- context:generated:start -->
## Summary

Unified observability suite: structured logging (JSON to stderr), metrics (Prometheus format), and distributed tracing (OpenTelemetry-compatible). Logger stores entries in memory for programmatic access; metrics collector handles counters, gauges, histograms with label sorting; trace manager uses in-memory maps. Designed to be lightweight with no external SDKs.

## Related

- validates [[event-sourcing-session-lifecycle]] — Telemetry logs and traces capture all event emissions and session state transitions.
- uses [[identity-authorization]] — Logger and traces can attach user identity from middleware via attachUserToMetadata.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
