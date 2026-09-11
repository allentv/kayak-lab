## 1. DuckDB Setup & Configuration

- [x] 1.1 Add `duckdb` npm dependency to `deno.json` imports
  - **Verify:** `deno install npm:duckdb` succeeds and `duckdb.node` binary is downloaded

- [x] 1.2 Create `scripts/setup-duckdb.sh` to automate `node-pre-gyp install`
  - **Verify:** Script runs successfully and downloads native binary

- [x] 1.3 Add DuckDB setup step to README.md
  - **Verify:** Documentation is clear and setup works on fresh clone

## 2. DuckDB Persistence Backend

- [x] 2.1 Create `src/store/duckdb-backend.ts` with `DuckDBPersistenceBackend` class
  - Implement `IPersistenceBackend` interface methods: `write()`, `readLines()`, `writeSnapshot()`, `readSnapshot()`, `listSessions()`, `exists()`
  - **Verify:** Unit tests pass for all interface methods

- [x] 2.2 Implement DuckDB schema creation in `DuckDBPersistenceBackend` constructor
  - Create `events`, `memories`, and `snapshots` tables
  - **Verify:** Tables are created on first initialization

- [x] 2.3 Implement event append (`write()` method)
  - Insert event into `events` table with session_id, sequence, event_type, payload, timestamp
  - **Verify:** Events are persisted to DuckDB file

- [x] 2.4 Implement event retrieval (`readLines()` method)
  - Query events by session_id, return in sequence order
  - **Verify:** Events are returned correctly for existing sessions; empty array for non-existent sessions

- [x] 2.5 Implement snapshot persistence (`writeSnapshot()` and `readSnapshot()` methods)
  - Store snapshots in `snapshots` table
  - **Verify:** Snapshots are persisted and retrieved correctly

- [x] 2.6 Implement `listSessions()` and `exists()` methods
  - Query distinct session_ids from events table
  - **Verify:** Returns correct session list and existence checks

- [x] 2.7 Implement memory storage methods (`store()`, `retrieve()`, `delete()`, `list()`)
  - CRUD operations on `memories` table
  - **Verify:** All memory operations work correctly

- [x] 2.8 Implement connection management and graceful shutdown
  - Single connection per instance, clean close on shutdown
  - **Verify:** Connection is properly closed when store is disposed

## 3. Integration with Existing Code

- [x] 3.1 Update `PersistentEventStore` to accept `DuckDBPersistenceBackend`
  - Ensure `IPersistenceBackend` interface is satisfied
  - **Verify:** `PersistentEventStore` works with both file and DuckDB backends

- [x] 3.2 Update `MemoryProvider` to accept `DuckDBPersistenceBackend`
  - Ensure `IMemoryStorage` interface is satisfied
  - **Verify:** `MemoryProvider` works with both in-memory and DuckDB storage

- [x] 3.3 Add configuration option to select DuckDB backend
  - Update `PersistenceConfig` to include backend choice
  - **Verify:** Configuration correctly selects DuckDB vs file backend

## 4. JSONL Migration

- [x] 4.1 Create `scripts/migrate-jsonl-to-duckdb.ts` migration script
  - Read existing JSONL files from `data/events/` directory
  - Load into DuckDB using `read_json_auto()`
  - **Verify:** All events from JSONL files are migrated to DuckDB

- [x] 4.2 Implement idempotent migration (deduplication)
  - Skip events that already exist in DuckDB (by session_id + sequence)
  - **Verify:** Running migration twice doesn't create duplicates

- [x] 4.3 Add migration verification step
  - Compare event counts between JSONL and DuckDB
  - **Verify:** Event counts match after migration

## 5. SQL Query Engine

- [x] 5.1 Create `src/store/duckdb-query-engine.ts` with SQL-based queries
  - Implement `IEventQueryEngine` interface methods using SQL
  - **Verify:** All query methods return correct results

- [x] 5.2 Implement tool performance metrics query
  - SQL aggregation: `GROUP BY tool_name` with COUNT, AVG
  - **Verify:** Results match expected format from `ToolPerformanceMetrics` type

- [x] 5.3 Implement session summary query
  - SQL aggregation: `GROUP BY session_id` with COUNT, MIN, MAX
  - **Verify:** Results match expected format from `SessionSummary` type

- [x] 5.4 Implement event type distribution query
  - SQL aggregation: `GROUP BY event_type` with COUNT and percentage calculation
  - **Verify:** Results match expected format from `EventTypeDistribution` type

- [x] 5.5 Implement error pattern analysis query
  - SQL filter and aggregation for error events
  - **Verify:** Results match expected format from `ErrorPattern` type

- [x] 5.6 Implement time-series aggregation query
  - SQL `date_trunc()` for hourly/daily granularity
  - **Verify:** Time-series data is correctly aggregated

- [x] 5.7 Implement cross-table join query (events × memories)
  - SQL JOIN between events and memories tables
  - **Verify:** Sessions with related memories are correctly returned

- [x] 5.8 Implement pivot table query (tool usage by session)
  - SQL CASE statements for pivot transformation
  - **Verify:** Pivot table is correctly generated

- [x] 5.9 Implement window function analytics (rolling error rate)
  - SQL window functions: `AVG() OVER (PARTITION BY ... ORDER BY ...)`
  - **Verify:** Rolling statistics are correctly calculated

## 6. API Endpoints

- [x] 6.1 Create `web/routes/api/query.ts` endpoint
  - POST `/api/query` with SQL in request body
  - GET `/api/query?sql=...` with SQL in query parameter
  - **Verify:** Endpoint executes SQL and returns JSON results

- [x] 6.2 Implement error handling for API endpoint
  - Return 500 status with error message on query failure
  - **Verify:** Invalid SQL returns meaningful error message

- [x] 6.3 Add input validation (prevent destructive operations)
  - Block DROP, DELETE, TRUNCATE statements
  - **Verify:** Destructive SQL is rejected with 403 status

## 7. Testing

- [x] 7.1 Create `src/store/__tests__/duckdb-backend.test.ts`
  - Unit tests for all `IPersistenceBackend` methods
  - **Verify:** All tests pass

- [x] 7.2 Create `src/store/__tests__/duckdb-query-engine.test.ts`
  - Unit tests for all query methods
  - **Verify:** All tests pass

- [x] 7.3 Create integration test for migration
  - Test JSONL → DuckDB migration end-to-end
  - **Verify:** Migration completes successfully with correct data

- [x] 7.4 Create performance benchmark test
  - Test bulk insert rate (target: 20k+ events/sec)
  - Test query latency (target: <100ms for aggregations)
  - **Verify:** Performance targets are met

## 8. Documentation

- [x] 8.1 Update `docs/architecture.md` with DuckDB backend
  - Document DuckDB as persistence option
  - **Verify:** Architecture docs reflect new backend

- [x] 8.2 Create `docs/duckdb-setup.md` with setup instructions
  - Document `node-pre-gyp install` step
  - **Verify:** Setup instructions are clear and complete

- [x] 8.3 Update `docs/capabilities.md` with query engine capabilities
  - Document SQL query patterns and examples
  - **Verify:** Query patterns are documented

## 9. Cleanup

- [x] 9.1 Remove in-memory aggregation from `web/lib/aggregation.ts`
  - Replace with SQL-backed queries
  - **Verify:** Dashboard still works with new backend

- [x] 9.2 Update `DashboardIsland.tsx` to use SQL-backed API
  - Fetch data from `/api/query` instead of WebSocket aggregation
  - **Verify:** Dashboard displays correct data

- [x] 9.3 Run full test suite
  - `deno test --allow-read --allow-env --allow-write --allow-net --allow-run`
  - **Verify:** All tests pass with no regressions
