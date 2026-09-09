## Context

kayak-lab currently uses `FilePersistenceBackend` (JSONL per session) and `InMemoryStorage` for memories. The architecture already defines `IPersistenceBackend` and `IMemoryStorage` interfaces designed for backend substitution. DuckDB was explored and confirmed to work with Deno 2.9 via native binding (after manual `node-pre-gyp install`). Query ergonomics were validated: all kayak-lab query engine patterns translate cleanly to SQL with `json_extract()` for JSON payloads.

## Goals / Non-Goals

**Goals:**
- Replace file-based persistence with DuckDB for events and memories
- Provide SQL-based analytical queries replacing JavaScript aggregation
- Maintain backward compatibility via `IPersistenceBackend` interface
- Support migration from existing JSONL files
- Keep DuckDB embedded (no separate server process)

**Non-Goals:**
- Distributed/clustered DuckDB deployment
- Real-time streaming analytics (future enhancement)
- Replacing `better-sqlite3` for operational workloads (separate decision)
- Dashboard UI implementation (data layer only)

## Decisions

### Decision 1: Single `DuckDBPersistenceBackend` class

**Choice:** One class implementing both `IPersistenceBackend` and `IMemoryStorage` interfaces.

**Rationale:** DuckDB handles both events and memories in a single database file. Splitting into separate classes adds complexity without benefit — both share the same connection and database.

**Alternatives considered:**
- Separate `DuckDBEventBackend` and `DuckDBMemoryStorage`: More modular but unnecessary overhead for embedded use case.

### Decision 2: Schema design

**Choice:**
```sql
CREATE TABLE events (
  id VARCHAR DEFAULT (uuid()),
  session_id VARCHAR NOT NULL,
  sequence INTEGER NOT NULL,
  event_type VARCHAR NOT NULL,
  payload JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON
);

CREATE TABLE memories (
  id VARCHAR DEFAULT (uuid()),
  type VARCHAR NOT NULL,
  session_id VARCHAR,
  content VARCHAR NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE snapshots (
  session_id VARCHAR PRIMARY KEY,
  data JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Rationale:** Matches existing `BaseEvent` and `AnyMemory` types. JSON columns for payloads allow flexible schema evolution. Separate `snapshots` table avoids polluting events table.

**Alternatives considered:**
- Single table with type discriminator: Simpler but loses type safety and query clarity.
- Normalized tool/event sub-tables: Over-normalized for append-only workload.

### Decision 3: Connection management

**Choice:** Single connection per `DuckDBPersistenceBackend` instance, reused for all operations. No connection pooling (embedded database).

**Rationale:** DuckDB is embedded — single process, single connection. Connection pooling adds complexity without benefit. DuckDB handles internal concurrency via MVCC.

**Alternatives considered:**
- Connection pool: Unnecessary for embedded use; adds overhead.

### Decision 4: Migration strategy

**Choice:** JSONL migration via DuckDB's `read_json_auto()` function, run as one-time setup script.

**Rationale:** DuckDB natively reads JSONL files. Migration is a single SQL statement per file. Idempotent via `INSERT OR IGNORE` or deduplication query.

**Alternatives considered:**
- Streaming Node.js migration: More complex, no benefit over DuckDB's native JSON reader.

### Decision 5: Query engine approach

**Choice:** SQL queries executed via `conn.all()` (native binding) or HTTP API, returning JSON results to API endpoints.

**Rationale:** SQL is more expressive than JavaScript aggregation for analytical workloads. DuckDB's columnar engine optimizes GROUP BY, window functions, and joins automatically.

**Alternatives considered:**
- JavaScript aggregation (current approach): Doesn't scale, requires manual optimization.
- DuckDB WASM: Doesn't work with Deno (fileURLToPath issue).

### Decision 6: Deno integration workaround

**Choice:** Document `node-pre-gyp install` as required setup step until Deno fixes lifecycle script execution.

**Rationale:** DuckDB native binding works after manual binary download. Deno 2.9's `--allow-scripts` doesn't execute `node-pre-gyp` properly. This is a Deno bug, not a DuckDB issue.

**Alternatives considered:**
- HTTP API wrapper (Python): Works but adds process management complexity.
- Wait for Deno fix: Blocks progress indefinitely.

## Risks / Trade-offs

### Risk 1: DuckDB native binding setup friction
**Impact:** Users must run manual setup step after `deno install`.
**Mitigation:** Add setup script to `scripts/setup-duckdb.sh`, document in README.
**Trade-off:** Accept setup friction for better long-term integration.

### Risk 2: DuckDB bulk insert performance
**Impact:** Native binding: ~20k events/sec (vs HTTP: ~40k events/sec).
**Mitigation:** Batch inserts (1000 events per statement), acceptable for event sourcing workload.
**Trade-off:** Native binding is slower than HTTP but avoids Python dependency.

### Risk 3: JSON type casting
**Impact:** `json_extract()` returns JSON type, not numeric. Requires `CAST(... AS DOUBLE)` for aggregations.
**Mitigation:** Document pattern, create helper functions for common extractions.
**Trade-off:** Minor syntactic overhead for query clarity.

### Risk 4: DuckDB version compatibility
**Impact:** Native binding version must match DuckDB CLI version for file compatibility.
**Mitigation:** Pin DuckDB version in `deno.json`, test migration across versions.
**Trade-off:** Version lock reduces flexibility but ensures stability.

### Risk 5: Migration data loss
**Impact:** JSONL → DuckDB migration could lose data if not idempotent.
**Mitigation:** Backup JSONL files before migration, implement deduplication logic.
**Trade-off:** Extra safety step adds complexity but prevents data loss.
