---
name: SQLite Query Engine
slug: sqlite-query-engine
type: file
sources:
  - path: src/store/sqlite-query-engine.ts
    hash: d1e3b544871e2a2905bb9ae8a944426c083431a11b24bdabfb9f7160d109623e
sources_digest: fb80d9c916ee0879947844a6996eb71b42c9096ffe5127270155932c340e24a9
links:
  - to: analytics-query-engines
    relation: part_of
    description: Implements IEventQueryEngine interface alongside EventQueryEngine.
  - to: event-sourcing-persistence-system
    relation: depends_on
    description: Requires SQLitePersistenceBackend as data source for SQL queries.
generator:
  version: 1
covers:
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

Specialized query engine that executes complex SQL analytics (window functions, JSON extraction) against SQLite event store. Provides advanced metrics like rolling error rates and session duration trends that require SQL capabilities beyond in-memory processing.

## Related

- part of [[analytics-query-engines]] — Implements IEventQueryEngine interface alongside EventQueryEngine.
- depends on [[event-sourcing-persistence-system]] — Requires SQLitePersistenceBackend as data source for SQL queries.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
