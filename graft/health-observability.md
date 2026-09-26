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
