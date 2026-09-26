---
name: Safe SQL Query API
slug: safe-sql-query-api
type: concept
sources:
  - path: web/routes/api/query.ts
    hash: 107a42222beebedd1f9abd65c0ce961e864d651b8b6aa19fc9821a02ae39a2bc
sources_digest: 344452593ace15c0baaa867a7fde2aae0b43aefb7a0c25a8c5274fc8a1b73997
links:
  - to: aggregation-layer
    relation: implements
    description: Provides the query endpoint that aggregation.ts calls for data fetching.
  - to: event-sourcing-persistence-system
    relation: depends_on
    description: Uses same SQLite database backend for query execution.
generator:
  version: 1
covers:
  - symbol: isDestructiveSql
    kind: function
    at: 'web/routes/api/query.ts:L25-L28'
  - symbol: getDatabase
    kind: function
    at: 'web/routes/api/query.ts:L30-L32'
  - symbol: GET
    kind: method
    at: 'web/routes/api/query.ts:L39-L60'
  - symbol: POST
    kind: method
    at: 'web/routes/api/query.ts:L62-L89'
---
<!-- context:generated:start -->
## Summary

Read-only SQL API endpoint that validates queries for destructive operations (DROP, DELETE) before execution. Centralizes database connection logic and prevents data corruption while enabling flexible analytics for the web UI.

## Related

- implements [[aggregation-layer]] — Provides the query endpoint that aggregation.ts calls for data fetching.
- depends on [[event-sourcing-persistence-system]] — Uses same SQLite database backend for query execution.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
