---
name: Analytics Query Engines
slug: analytics-query-engines
type: system
sources:
  - path: src/store/__tests__/query-engine.test.ts
    hash: 5a7bade661ef2e7124fb8019e6e2c6eebc370e750070547a1a3ed21f501ec48b
  - path: src/store/__tests__/sqlite-query-engine.test.ts
    hash: 2f67c5300b7bb2ca798acb7cec8d7ab3e3363bfa7b7b48a5cb19fdf26930bf2d
  - path: src/store/query-engine.ts
    hash: 75486bd3ea10cd1753d2d76a2720022ecd2964e20010ba6a7c87fd4a94e9342b
  - path: src/store/sqlite-query-engine.ts
    hash: d1e3b544871e2a2905bb9ae8a944426c083431a11b24bdabfb9f7160d109623e
sources_digest: e586880285acc16fc159164a2fa798ace6459f1cbaa80a8fd9d47465d5c2bbd2
links:
  - to: event-sourcing-persistence-system
    relation: uses
    description: Queries EventStore or SQLite backend for event data aggregation.
  - to: event-type-taxonomy
    relation: depends_on
    description: Filters events by EventType categories for metric calculations.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Dual-engine analytics layer: EventQueryEngine for in-memory aggregation and SQLiteQueryEngine for SQL-based analytics over persisted events. Provides performance metrics, error patterns, session summaries, and time-series aggregations for monitoring and self-observation.

## Related

- uses [[event-sourcing-persistence-system]] — Queries EventStore or SQLite backend for event data aggregation.
- depends on [[event-type-taxonomy]] — Filters events by EventType categories for metric calculations.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
