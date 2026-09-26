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
covers:
  - symbol: HarnessConnection
    kind: interface
    at: 'web/lib/harness-connection.ts:L8-L14'
  - symbol: HarnessState
    kind: interface
    at: 'web/lib/harness-connection.ts:L16-L19'
  - symbol: connectToHarness
    kind: function
    at: 'web/lib/harness-connection.ts:L29-L46'
  - symbol: connectWebSocket
    kind: function
    at: 'web/lib/harness-connection.ts:L51-L102'
  - symbol: scheduleReconnect
    kind: function
    at: 'web/lib/harness-connection.ts:L107-L118'
  - symbol: handleHarnessEvent
    kind: function
    at: 'web/lib/harness-connection.ts:L123-L128'
  - symbol: onHarnessStateChange
    kind: function
    at: 'web/lib/harness-connection.ts:L133-L140'
  - symbol: notifyListeners
    kind: function
    at: 'web/lib/harness-connection.ts:L145-L149'
  - symbol: getHarnessConnections
    kind: function
    at: 'web/lib/harness-connection.ts:L154-L156'
  - symbol: connectFromEnv
    kind: function
    at: 'web/lib/harness-connection.ts:L161-L171'
  - symbol: GET
    kind: method
    at: 'web/routes/api/harnesses.ts:L11-L19'
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
