# SQLite Setup

This guide covers setting up SQLite as the persistence backend for kayak-lab. SQLite replaces the former DuckDB backend for single-binary compatibility — no native bindings required.

## Prerequisites

- Deno 2.9 or later

## Installation

SQLite is embedded via `@db/sqlite` (Deno-native). No separate setup step is needed.

```bash
# Install dependencies
deno install

# Verify SQLite works
deno run -A -e "import { Database } from '@db/sqlite'; const db = new Database(':memory:'); console.log('SQLite OK');"
```

## Configuration

### Using SQLite with PersistentEventStore

```typescript
import { SQLitePersistenceBackend } from "./src/store/sqlite-backend.ts";
import { PersistentEventStore } from "./src/store/persistence.ts";

// Create SQLite backend
const backend = new SQLitePersistenceBackend({ dbPath: "./kayak.db" });

// Use with PersistentEventStore
const store = new PersistentEventStore({
  dataDir: "./data/events",
  backend,
});
```

### Using SQLite with MemoryProvider

```typescript
import { SQLitePersistenceBackend } from "./src/store/sqlite-backend.ts";

// Create SQLite backend — implements both IPersistenceBackend and IMemoryStorage
const backend = new SQLitePersistenceBackend({ dbPath: "./kayak.db" });
```

### In-Memory Mode

```typescript
const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });
```

## Migration

### Migrate existing JSONL files to SQLite

```bash
# Migrate all JSONL files from data/events/
deno run -A scripts/migrate-jsonl-to-sqlite.ts

# With custom paths
deno run -A scripts/migrate-jsonl-to-sqlite.ts --data-dir /path/to/events --db-path /path/to/kayak.db

# Verify migration
deno run -A scripts/migrate-jsonl-to-sqlite.ts --verify
```

The migration script:
- Reads all JSONL files from the data directory
- Inserts events into SQLite tables
- Is idempotent (running twice won't create duplicates)
- Verifies event counts match after migration

## SQL Query Engine

### Running queries

The SQLite query engine provides SQL-based analytics queries:

```typescript
import { SQLiteQueryEngine } from "./src/store/sqlite-query-engine.ts";

// Create query engine
const engine = new SQLiteQueryEngine(db);

// Tool performance metrics
const metrics = engine.getToolPerformance();

// Session summary
const summary = engine.getSessionSummary("session-1");

// Event type distribution
const distribution = engine.getEventTypeDistribution();

// Error pattern analysis
const errors = engine.getErrorPatterns();

// Time-series aggregation
const timeSeries = engine.getTimeSeriesAggregation("hour");

// Cross-table join (events × memories)
const sessions = engine.getSessionWithMemories();

// Pivot table (tool usage by session)
const pivot = engine.getToolUsageBySession();

// Window function analytics (rolling error rate)
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

1. **WAL mode:** Enabled by default — allows concurrent reads while writing
2. **Batch inserts:** Use bulk operations for large data migrations
3. **Foreign keys:** Enabled by default for data integrity
4. **Connection pooling:** Use single connection per instance (embedded database)

## Architecture

SQLite provides:
- **WAL mode** for concurrent reads during writes
- **Embedded database** (no server process, no native bindings)
- **SQL-based queries** replacing hand-rolled JavaScript aggregation
- **Single-binary compatibility** — no platform-specific native dependencies
- **ACID transactions** for safe concurrent access

The SQLite backend is a drop-in replacement for the former DuckDB backend, providing the same API with better portability.
