---
name: Health & Observability
slug: health-observability
type: system
sources:
  - path: src/core/component-health.ts
    hash: 16813d80745df9dcee62351f6315a7befed961b93857f3c574948e3c3749f17c
  - path: src/core/health.ts
    hash: 7682940e4caa372a30b75cc8aac7e605d2177d6db7c232e07b14a30093e85efc
sources_digest: 1fdf97fc40e23852c6812966d1c6db43babcb771c15006babf82b8be22185b92
links:
  - to: cross-cutting-telemetry
    relation: produces
    description: >-
      Health check results and errors are logged via the telemetry system for
      monitoring.
  - to: event-sourcing-session-lifecycle
    relation: uses
    description: >-
      Health checks query the EventStore and CapabilityRegistry to verify they
      are operational.
generator:
  version: 1
covers:
  - symbol: createEventStoreHealthCheck
    kind: function
    at: 'src/core/component-health.ts:L16-L39'
  - symbol: createCapabilityHealthCheck
    kind: function
    at: 'src/core/component-health.ts:L45-L79'
  - symbol: createWebSocketHealthCheck
    kind: function
    at: 'src/core/component-health.ts:L85-L126'
  - symbol: ComponentHealth
    kind: interface
    at: 'src/core/health.ts:L13-L22'
  - symbol: AggregateStatus
    kind: type
    at: 'src/core/health.ts:L25-L25'
  - symbol: HealthCheckResult
    kind: interface
    at: 'src/core/health.ts:L28-L35'
  - symbol: ErrorResponse
    kind: interface
    at: 'src/core/health.ts:L38-L45'
  - symbol: HealthCheckFn
    kind: type
    at: 'src/core/health.ts:L52-L52'
  - symbol: HealthRegistry
    kind: class
    at: 'src/core/health.ts:L63-L158'
  - symbol: constructor
    kind: method
    at: 'src/core/health.ts:L67-L69'
  - symbol: register
    kind: method
    at: 'src/core/health.ts:L74-L76'
  - symbol: deregister
    kind: method
    at: 'src/core/health.ts:L81-L83'
  - symbol: check
    kind: method
    at: 'src/core/health.ts:L89-L117'
  - symbol: runCheck
    kind: method
    at: 'src/core/health.ts:L122-L146'
  - symbol: timeoutPromise
    kind: method
    at: 'src/core/health.ts:L151-L157'
  - symbol: createHealthHandler
    kind: function
    at: 'src/core/health.ts:L167-L187'
  - symbol: handleHealth
    kind: function
    at: 'src/core/health.ts:L189-L200'
  - symbol: handleReady
    kind: function
    at: 'src/core/health.ts:L202-L213'
  - symbol: handleAlive
    kind: function
    at: 'src/core/health.ts:L215-L223'
  - symbol: errorResponse
    kind: function
    at: 'src/core/health.ts:L232-L245'
  - symbol: errorHttpResponse
    kind: function
    at: 'src/core/health.ts:L250-L263'
---
<!-- context:generated:start -->
## Summary

Provides component-level health checks with parallel execution and timeouts, plus HTTP endpoints (/health, /ready, /alive) for Kubernetes compatibility. HealthRegistry aggregates statuses (healthy/degraded/unhealthy) and integrates with core components (EventStore, CapabilityRegistry, WebSocket). Designed for minimal dependencies, using native Web APIs.

## Related

- produces [[cross-cutting-telemetry]] — Health check results and errors are logged via the telemetry system for monitoring.
- uses [[event-sourcing-session-lifecycle]] — Health checks query the EventStore and CapabilityRegistry to verify they are operational.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
