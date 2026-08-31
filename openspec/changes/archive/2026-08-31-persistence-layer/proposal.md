## Why

The event store is currently in-memory only — all session data is lost on process restart. For any real usage (CLI sessions, API-backed interactions, production deployments), events must survive crashes and restarts. The design doc explicitly scoped persistence as "add later"; now is later.

## What Changes

Introduce a persistence layer for the event store that durably writes events to disk and reconstructs state on startup.

- **File-based event log**: Append-only JSONL (JSON Lines) files per session, one file per session in a configurable data directory
- **Snapshot persistence**: Snapshots written to disk alongside event logs, enabling fast recovery without replaying full histories
- **Recovery on startup**: On initialization, the store scans persisted sessions and rebuilds in-memory indexes from event files and snapshots
- **Pluggable backend interface**: Extract a `IPersistentEventStore` interface from the current `EventStore` so alternative backends (SQLite, PostgreSQL) can be added later without changing callers
- **Configurable data directory**: Event files stored in a configurable path (default `./data/events/`)

### Modified Capabilities

- `store/event-store`: The `IEventStore` interface gains persistence-aware methods; the in-memory `EventStore` remains as a fast/ephemeral option; a new `PersistentEventStore` implements disk-backed storage

## Capabilities

### New Capabilities

- `store/persistence`: File-based event persistence with JSONL append-only logs, snapshot persistence, and startup recovery

### Modified Capabilities

- `store/event-store`: Interface扩展 — adds `flush()`, `recover()`, and persistence configuration to the existing spec

## Impact

- New module: `src/store/persistence.ts` (PersistentEventStore implementation)
- Modified: `src/store/event-store.ts` (interface扩展, optional persistence config)
- New directory: `data/events/` (default persistence root, gitignored)
- Tests: persistence round-trip, crash recovery, snapshot persistence, concurrent session isolation
- No breaking changes to existing callers — persistence is opt-in via configuration
