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
covers:
  - symbol: createTestEvent
    kind: function
    at: 'src/store/__tests__/query-engine.test.ts:L9-L26'
  - symbol: createTestEvent
    kind: function
    at: 'src/store/__tests__/sqlite-query-engine.test.ts:L13-L24'
  - symbol: TimeRange
    kind: interface
    at: 'src/store/query-engine.ts:L16-L19'
  - symbol: ToolPerformanceMetrics
    kind: interface
    at: 'src/store/query-engine.ts:L22-L29'
  - symbol: ErrorPattern
    kind: interface
    at: 'src/store/query-engine.ts:L32-L37'
  - symbol: SessionSummary
    kind: interface
    at: 'src/store/query-engine.ts:L40-L49'
  - symbol: EventTypeDistribution
    kind: interface
    at: 'src/store/query-engine.ts:L52-L56'
  - symbol: AggregateToolUsage
    kind: interface
    at: 'src/store/query-engine.ts:L59-L63'
  - symbol: SessionDurationTrends
    kind: interface
    at: 'src/store/query-engine.ts:L66-L71'
  - symbol: IEventQueryEngine
    kind: interface
    at: 'src/store/query-engine.ts:L77-L85'
  - symbol: EventQueryEngine
    kind: class
    at: 'src/store/query-engine.ts:L91-L302'
  - symbol: constructor
    kind: method
    at: 'src/store/query-engine.ts:L92-L92'
  - symbol: getToolPerformance
    kind: method
    at: 'src/store/query-engine.ts:L94-L138'
  - symbol: getErrorPatterns
    kind: method
    at: 'src/store/query-engine.ts:L140-L169'
  - symbol: getSessionSummary
    kind: method
    at: 'src/store/query-engine.ts:L171-L198'
  - symbol: getRecentSessions
    kind: method
    at: 'src/store/query-engine.ts:L200-L212'
  - symbol: getEventTypeDistribution
    kind: method
    at: 'src/store/query-engine.ts:L214-L234'
  - symbol: getAggregateToolUsage
    kind: method
    at: 'src/store/query-engine.ts:L236-L260'
  - symbol: getSessionDurationTrends
    kind: method
    at: 'src/store/query-engine.ts:L262-L285'
  - symbol: getAllFilteredEvents
    kind: method
    at: 'src/store/query-engine.ts:L287-L301'
  - symbol: SQLiteQueryEngine
    kind: class
    at: 'src/store/sqlite-query-engine.ts:L30-L535'
  - symbol: constructor
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L33-L35'
  - symbol: buildTimeRange
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L41-L62'
  - symbol: getToolPerformance
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L68-L119'
  - symbol: getErrorPatterns
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L125-L165'
  - symbol: getSessionSummary
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L171-L210'
  - symbol: getRecentSessions
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L216-L256'
  - symbol: getEventTypeDistribution
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L262-L284'
  - symbol: getAggregateToolUsage
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L290-L331'
  - symbol: getSessionDurationTrends
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L337-L374'
  - symbol: getTimeSeriesAggregation
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L380-L417'
  - symbol: getSessionWithMemories
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L423-L450'
  - symbol: getToolUsageBySession
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L456-L493'
  - symbol: getRollingErrorRate
    kind: method
    at: 'src/store/sqlite-query-engine.ts:L499-L534'
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
