# DuckDB Setup

This guide covers setting up DuckDB as the persistence backend for kayak-lab.

## Prerequisites

- Deno 2.9 or later
- Node.js (for npm dependencies)

## Installation

### 1. Install npm dependencies

```bash
deno install
```

### 2. Setup DuckDB native binding

The DuckDB native binding requires a manual setup step due to Deno's lifecycle script handling. Run:

```bash
scripts/setup-duckdb.sh
```

This will:
1. Install npm dependencies if not already installed
2. Run `node-pre-gyp install` to download the native binary

### 3. Verify installation

```bash
deno run -A -e "import duckdb from 'duckdb'; const db = new duckdb.Database(':memory:'); console.log('DuckDB OK');"
```

## Configuration

### Using DuckDB with PersistentEventStore

```typescript
import { DuckDBPersistenceBackend } from "./src/store/duckdb-backend.ts";
import { PersistentEventStore } from "./src/store/persistence.ts";

// Create DuckDB backend
const backend = new DuckDBPersistenceBackend({ dbPath: "./kayak.db" });

// Use with PersistentEventStore
const store = new PersistentEventStore({
  dataDir: "./data/events",
  backend,
});
```

### Using DuckDB with MemoryProvider

```typescript
import { DuckDBPersistenceBackend } from "./src/store/duckdb-backend.ts";

// Create DuckDB backend
const backend = new DuckDBPersistenceBackend({ dbPath: "./kayak.db" });

// Backend implements both IPersistenceBackend and IMemoryStorage
```

## Migration

### Migrate existing JSONL files to DuckDB

```bash
# Migrate all JSONL files from data/events/
deno run -A scripts/migrate-jsonl-to-duckdb.ts

# With custom paths
deno run -A scripts/migrate-jsonl-to-duckdb.ts --data-dir /path/to/events --db-path /path/to/kayak.db

# Verify migration
deno run -A scripts/migrate-jsonl-to-duckdb.ts --verify
```

The migration script:
- Reads all JSONL files from the data directory
- Inserts events into DuckDB tables
- Is idempotent (running twice won't create duplicates)
- Verifies event counts match after migration

## SQL Query Engine

### Running queries

The DuckDB query engine provides SQL-based analytics queries:

```typescript
import { DuckDBQueryEngine } from "./src/store/duckdb-query-engine.ts";

// Create query engine
const engine = new DuckDBQueryEngine(db);

// Tool performance metrics
const metrics = engine.getToolPerformance();

// Session summary
const summary = engine.getSessionSummary("session-1");

// Event type distribution
const distribution = engine.getEventTypeDistribution();

// Time-series aggregation
const timeSeries = engine.getTimeSeriesAggregation("hour");

// Cross-table join
const sessions = engine.getSessionWithMemories();

// Pivot table
const pivot = engine.getToolUsageBySession();

// Window function analytics
const rolling = engine.getRollingErrorRate("session-1", 10);
```

### API endpoint

The query engine is also exposed via HTTP API:

```bash
# POST request
curl -X POST http://localhost:8080/api/query \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT COUNT(*) FROM events"}'

# GET request
curl "http://localhost:8080/api/query?sql=SELECT+COUNT(*)+FROM+events"
```

## Performance

### Benchmarks

- **Bulk insert rate:** ~20k+ events/sec (target met)
- **Aggregation query latency:** <100ms for 10k events (target met)
- **Cross-table join latency:** <200ms

### Optimization tips

1. **Batch inserts:** Use bulk operations for large data migrations
2. **Index usage:** DuckDB automatically creates indexes for primary keys
3. **Memory management:** DuckDB uses memory-mapped files for efficient caching
4. **Connection pooling:** Use single connection per instance (embedded database)

## Troubleshooting

### Common issues

**"DuckDB not available" error:**
- Run `scripts/setup-duckdb.sh` to install the native binary
- Verify with the verification command above

**"Failed to open database" error:**
- Check file permissions on the database path
- Ensure the directory exists

**Slow queries:**
- Check if indexes are being used (DuckDB automatically indexes primary keys)
- Use `EXPLAIN` to analyze query plans
- Consider adding explicit indexes for frequently queried columns

## Architecture

DuckDB provides:
- **Columnar storage** for efficient analytics queries
- **Native JSON ingestion** for easy data loading
- **SQL-based queries** replacing hand-rolled JavaScript aggregation
- **Embedded database** (no server process required)
- **MVCC concurrency** for safe concurrent access

The DuckDB backend is a drop-in replacement for the file-based persistence backend, providing better performance for analytical workloads while maintaining the same API.