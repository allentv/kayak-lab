---
name: Aggregation Layer
slug: aggregation-layer
type: system
sources:
  - path: web/lib/aggregation.ts
    hash: b9d4c11443cb6cdcefe519ac85368a294d216c112f39e0293813298f6c642bed
  - path: web/routes/api/health.ts
    hash: e7d0218877e9d1d699bce1ab184e0fc5e0dcd33368bfbe60e65d0f64606c4e86
  - path: web/routes/api/sessions.ts
    hash: 708ff1abab3a79c36686a8382cff7183693d44447248f1a233fe53582331c7f4
sources_digest: 61ea697f84618f93bc89d950deb5821e0ef6de4555b2d6383cf3ffba7ed4326e
links:
  - to: safe-sql-query-api
    relation: uses
    description: Fetches aggregated data via /api/query endpoint with read-only SQL.
  - to: web-monitoring-dashboard
    relation: produces
    description: Provides aggregated state data to dashboard components for rendering.
generator:
  version: 1
covers:
  - symbol: AggregatedSession
    kind: interface
    at: 'web/lib/aggregation.ts:L12-L18'
  - symbol: AggregatedEvent
    kind: interface
    at: 'web/lib/aggregation.ts:L20-L26'
  - symbol: AggregatedCapability
    kind: interface
    at: 'web/lib/aggregation.ts:L28-L33'
  - symbol: AggregatedState
    kind: interface
    at: 'web/lib/aggregation.ts:L35-L40'
  - symbol: HarnessStatus
    kind: interface
    at: 'web/lib/aggregation.ts:L42-L47'
  - symbol: querySql
    kind: function
    at: 'web/lib/aggregation.ts:L64-L71'
  - symbol: onHarnessEvent
    kind: function
    at: 'web/lib/aggregation.ts:L81-L83'
  - symbol: updateCapabilities
    kind: function
    at: 'web/lib/aggregation.ts:L89-L91'
  - symbol: updateHarnessStatus
    kind: function
    at: 'web/lib/aggregation.ts:L96-L108'
  - symbol: getAggregatedState
    kind: function
    at: 'web/lib/aggregation.ts:L113-L178'
  - symbol: onStateChange
    kind: function
    at: 'web/lib/aggregation.ts:L183-L190'
  - symbol: notifyListeners
    kind: function
    at: 'web/lib/aggregation.ts:L195-L201'
  - symbol: GET
    kind: method
    at: 'web/routes/api/health.ts:L12-L27'
  - symbol: GET
    kind: method
    at: 'web/routes/api/sessions.ts:L11-L14'
---
<!-- context:generated:start -->
## Summary

Delegates heavy data aggregation to DuckDB/SQLite backend via API calls, minimizing in-memory state in the web UI. Listener pattern notifies components of state changes asynchronously, ensuring UI updates reflect real-time data.

## Related

- uses [[safe-sql-query-api]] — Fetches aggregated data via /api/query endpoint with read-only SQL.
- produces [[web-monitoring-dashboard]] — Provides aggregated state data to dashboard components for rendering.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
