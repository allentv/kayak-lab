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

## Decision: Switch from DuckDB to SQLite (2026-09-11)

**Status:** Accepted

### Context

The DuckDB persistence layer was implemented and working, but hit a hard blocker when preparing for single-binary distribution via `deno compile`.

### Problem

DuckDB's npm package (`duckdb@1.4.4`) ships pre-built native binaries only for **node-v137** (Node.js 24.x). Deno's bundled Node.js runtime is **v26.3.0** (node-v147 ABI). This ABI mismatch causes a segfault at load time. Source compilation from node-gyp also fails (missing `.deps` directory, 300s+ build times, linker errors).

### Alternatives Evaluated

| Option | Result |
|--------|--------|
| `@duckdb/duckdb-wasm` | Browser-only; requires Worker globals Deno doesn't provide |
| `@proj-airi/duckdb-wasm` | Same issue — wraps `@duckdb/duckdb-wasm`, fails in Deno workers |
| Pin Deno to Node 24 | Limits Deno version, not sustainable |
| Bundle `.node` binary | Still requires FFI, same ABI mismatch at runtime |
| `deno compile` + native duckdb | FFI permission required, binary not embeddable |

### Decision

Replace DuckDB with **SQLite** via `jsr:@db/sqlite@0.12`. SQLite is:
- **Zero native deps** — `@db/sqlite` downloads `libsqlite3.so` automatically
- **Single-binary friendly** — `deno compile` includes everything
- **Same SQL core** — all existing queries (aggregations, time-series, joins) work with minor syntax adjustments
- **Battle-tested** — embedded database with MVCC, WAL mode, JSON functions

### Impact

- `DuckDBPersistenceBackend` → rewritten as `SQLitePersistenceBackend`
- `DuckDBQueryEngine` → rewritten as `SQLiteQueryEngine`
- SQL syntax: `json_extract(payload, '$.key')` → SQLite's `json_extract(payload, '$.key')` (compatible)
- No `node_modules` or `node-pre-gyp` setup required
- Test setup simplified: no `globalThis.__duckdb` hack needed
- `deno task test` no longer needs `--allow-ffi` for DuckDB

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
