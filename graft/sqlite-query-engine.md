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
