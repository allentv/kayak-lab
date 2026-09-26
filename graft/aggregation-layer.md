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
