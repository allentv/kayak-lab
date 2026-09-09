## Why

kayak-lab's current persistence layer uses flat JSONL files per session (`data/events/<session_id>.jsonl`). As sessions accumulate, this creates N+1 file proliferation, prevents cross-session analytical queries, and forces full-directory scans on startup. The query engine (`src/store/query-engine.ts`) performs aggregations, distributions, and trend analysis that are OLAP workloads — poorly suited to row-oriented storage. DuckDB provides columnar analytics, native JSON ingestion, and SQL-based multi-dimensional queries while remaining embedded (no server process).

## What Changes

- Add DuckDB as the primary persistence backend for events and memories
- Implement `DuckDBPersistenceBackend` satisfying `IPersistenceBackend` interface
- Implement `DuckDBMemoryStorage` satisfying `IMemoryStorage` interface
- Add SQL-based query engine replacing hand-rolled JavaScript aggregation in `web/lib/aggregation.ts`
- Support JSONL ingestion via DuckDB's `read_json_auto()` for migrating existing data
- Keep `FilePersistenceBackend` as fallback for users preferring inspectable files
- Add setup script for DuckDB native binding (`node-pre-gyp install`)

## Capabilities

### New Capabilities

- `storage/duckdb-backend`: DuckDB persistence backend for event store and memory storage, including schema design, connection management, and migration from JSONL
- `storage/duckdb-query-engine`: SQL-based analytical query layer replacing JavaScript aggregation, supporting dashboard queries, time-series analysis, and cross-session joins

### Modified Capabilities

- `storage/persistence`: Existing `IPersistenceBackend` interface gains DuckDB implementation; `PersistentEventStore` and `MemoryProvider` gain DuckDB backend option
- `web/dashboard`: Dashboard island switches from in-memory aggregation to SQL-backed API endpoints

### Unchanged Capabilities

- Event sourcing semantics (append-only, ordered, session-isolated)
- Memory types (episodic, semantic, procedural, working)
- MCP integration
- Tool calling module
