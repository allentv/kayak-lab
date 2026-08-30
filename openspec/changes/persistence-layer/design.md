## Context

The event store (`src/store/event-store.ts`) is currently in-memory only — a `Map<string, BaseEvent[]>`. The `IEventStore` interface defines the contract. The `EventStoreBridge` connects `EventStream` to `EventStore`. All 112+ tests use the in-memory store. The design doc from the original change explicitly scoped persistence as future work.

## Goals / Non-Goals

**Goals:**
- Durably persist events to disk so sessions survive process restarts
- Recover session state from persisted events + snapshots on startup
- Maintain the existing `IEventStore` interface — no breaking changes to callers
- Provide a pluggable backend interface for future SQLite/PostgreSQL implementations

**Non-Goals:**
- Database-backed persistence (SQLite, PostgreSQL) — future change
- Distributed event storage or replication
- Event compaction or archival
- Real-time streaming persistence (write-behind caching)
- Migration tooling for existing in-memory sessions

## Decisions

### 1. JSONL (JSON Lines) for event files

**Decision:** Store events as append-only JSONL files, one file per session.

**Rationale:**
- Append-only writes are O(1) — no seeking, no rewriting
- Human-readable and debuggable (can `cat` a session file)
- Line-based format enables partial recovery (skip corrupted lines)
- No external dependencies (pure Deno/file system)
- Natural fit for event sourcing — events are only appended, never modified

**Alternatives considered:**
- Single JSON file per session: Requires rewriting the entire file on each append — O(n) per write
- SQLite: Better query performance but adds dependency; future change
- Binary format: Better performance but loses human readability and debuggability

### 2. Synchronous write (no buffering)

**Decision:** Write each event to disk synchronously on append, no write buffer.

**Rationale:**
- Guarantees durability on return — if `store()` returns, the event is on disk
- Simplifies crash recovery — no lost buffered events
- Event append is not on the critical path for UI latency (projections are async)
- Acceptable performance for agent interactions (not high-frequency trading)

**Alternatives considered:**
- Write-behind buffer with periodic flush: Better throughput but risks data loss on crash
- Batch writes: Same trade-off as buffer, plus ordering complexity

### 3. One file per session

**Decision:** Each session gets its own `<session_id>.jsonl` file.

**Rationale:**
- Sessions are the natural isolation boundary (already enforced by `EventStream`)
- Simplifies recovery — scan directory, load each file independently
- No cross-session locking needed
- File count scales with active sessions, not total events

**Alternatives considered:**
- Single global log: Requires session_id filtering on read, more complex recovery
- Sharded by time: Adds complexity without clear benefit for this scale

### 4. Snapshot files alongside event logs

**Decision:** Store snapshots as `<session_id>.snapshot.json` in the same directory.

**Rationale:**
- Co-located with event files — single data directory to manage
- JSON format — human-readable, easy to inspect
- Only the latest snapshot needed for recovery (overwrite on creation)

**Alternatives considered:**
- Snapshots embedded in JSONL: Mixing event and snapshot lines adds parsing complexity
- Separate snapshot directory: Adds management overhead without benefit

### 5. Pluggable backend via IPersistenceBackend

**Decision:** Define a `IPersistenceBackend` interface for disk operations; `PersistentEventStore` delegates to it.

**Rationale:**
- Future SQLite/PostgreSQL backends implement `IPersistenceBackend`
- Current file-based implementation is the default
- Callers (EventStoreBridge, agent runtime) are unchanged

**Alternatives considered:**
- Strategy pattern with runtime swapping: More complex, not needed yet
- Abstract base class: TypeScript interfaces are sufficient

## Risks / Trade-offs

### Risk: File system performance at scale

**Impact:** Low — agent interactions are low-frequency (tens of events per second, not thousands). JSONL append is fast on modern file systems.

**Mitigation:** Monitor in benchmarks; SQLite backend available as escape hatch if needed.

### Risk: Corrupted JSONL files

**Impact:** Medium — a corrupted line could lose events for that session.

**Mitigation:** Line-based format enables skipping corrupted lines. Snapshots provide recovery points. Future: checksums per line.

### Risk: Too many small files

**Impact:** Low — one file per session. Thousands of sessions = thousands of files, which file systems handle well.

**Mitigation:** Future archival can consolidate old session files.

### Risk: Recovery time with many sessions

**Impact:** Low — startup scans directory and loads files. For hundreds of sessions, this is sub-second.

**Mitigation:** Lazy loading (load on first access) if needed; snapshots reduce replay time.

### Trade-off: Simplicity vs. performance

JSONL synchronous writes are simple and correct but not optimal for high-throughput scenarios. This is acceptable for the current scale and can be upgraded to SQLite later.
