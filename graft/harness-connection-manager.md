---
name: Harness Connection Manager
slug: harness-connection-manager
type: system
sources:
  - path: web/lib/harness-connection.ts
    hash: 28ef232b00e8ff46669af0065d3b22fc028f761cd983a6b8bc6d918d2f57039f
  - path: web/routes/api/harnesses.ts
    hash: ca6ebb65fec6e4dbfe18e94b0ce1a4a25a224b2b670c0eae3640919593df7e52
sources_digest: d16bf498ab7fb6bd3c09d672fa102a23c5dd138c03a8414ee9a8ce83d27846ab
links:
  - to: aggregation-layer
    relation: produces
    description: Forwards harness events to aggregation module for processing.
  - to: web-monitoring-dashboard
    relation: configures
    description: Provides connection status and event streams to dashboard components.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Manages WebSocket connections to multiple harness instances with exponential backoff reconnection, tracking connection status and forwarding events to aggregation layer. Singleton pattern ensures centralized connection state across the web UI.

## Related

- produces [[aggregation-layer]] — Forwards harness events to aggregation module for processing.
- configures [[web-monitoring-dashboard]] — Provides connection status and event streams to dashboard components.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
