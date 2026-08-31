## 1. Persistence Backend Interface

- [x] 1.1 Define `IPersistenceBackend` interface with `write(sessionId, line)`, `readLines(sessionId)`, `writeSnapshot(sessionId, data)`, `readSnapshot(sessionId)`, `listSessions()`, `exists(sessionId)` methods. Verify: TypeScript compiles, interface is importable.
- [x] 1.2 Define `PersistenceConfig` type with `dataDir: string` and optional `backend: IPersistenceBackend`. Verify: type compiles and is usable.

## 2. File-Based Backend Implementation

- [x] 2.1 Implement `FilePersistenceBackend` that writes JSONL files (`<sessionId>.jsonl`) under a configurable data directory. Create directory on first write. Verify: write a line, read it back, file exists at expected path.
- [x] 2.2 Implement `readLines()` that reads all lines from a JSONL file and returns them as strings. Handle missing file (return empty array). Verify: write multiple lines, read all back in order.
- [x] 2.3 Implement `writeSnapshot()` and `readSnapshot()` using `<sessionId>.snapshot.json`. Overwrite on each write (latest only). Verify: write snapshot, read it back, data matches.
- [x] 2.4 Implement `listSessions()` that scans the data directory for `.jsonl` files and returns session IDs. Verify: write files for 3 sessions, list returns all 3 IDs.

## 3. PersistentEventStore

- [x] 3.1 Implement `PersistentEventStore` class that takes `PersistenceConfig` and delegates disk operations to `IPersistenceBackend`. Implements `IEventStore`. Verify: compiles and can be instantiated.
- [x] 3.2 Implement `store()` that appends event as JSON line to the session's JSONL file synchronously (no buffering). Verify: store an event, read the file, line contains the event JSON.
- [x] 3.3 Implement `getEvents()` that reads all lines from the JSONL file, parses each as `BaseEvent`, and returns them in order. Verify: store 5 events, getEvents returns all 5 in sequence.
- [x] 3.4 Implement `getEventsInRange()` that reads lines and filters by sequence_number. Verify: store events 1-10, getEventsInRange(3,7) returns events 3-7.
- [x] 3.5 Implement `hasSession()` that checks if a JSONL file exists for the session. Verify: store event in session A, hasSession(A) returns true, hasSession(B) returns false.
- [x] 3.6 Implement `createSnapshot()` that writes snapshot to disk and stores in-memory. Verify: create snapshot, read the .snapshot.json file, data matches.
- [x] 3.7 Implement `getLatestSnapshot()` that reads the latest snapshot from disk. Verify: create 3 snapshots, getLatest returns the most recent.
- [x] 3.8 Implement `getEventsAfterSnapshot()` that reads events after the snapshot's sequence number. Verify: snapshot at seq 5, events 1-10 stored, getEventsAfterSnapshot returns events 6-10.

## 4. Recovery

- [x] 4.1 Implement `recover()` method on PersistentEventStore that scans the data directory, loads all session files, and rebuilds in-memory indexes. Verify: store events, create new PersistentEventStore with same dataDir, all sessions are accessible.
- [x] 4.2 Implement partial corruption handling: skip corrupted JSONL lines, log a warning, continue loading. Verify: write valid JSONL, inject a corrupted line, recover loads valid lines and skips corrupted.
- [x] 4.3 Implement recovery with snapshots: load snapshot first, then replay events after snapshot sequence number. Verify: store events 1-10, snapshot at 5, store events 6-10, new store recovers from snapshot + events 6-10.

## 5. Integration

- [x] 5.1 Update `EventStoreBridge` to accept optional `PersistenceConfig` — if provided, use `PersistentEventStore`; otherwise use in-memory `EventStore`. Verify: bridge works with both in-memory and persistent stores.
- [x] 5.2 Add `flush()` method to `IEventStore` interface (no-op for in-memory, sync for persistent). Verify: flush on both store types does not throw.
- [x] 5.3 Add `data/events/` to `.gitignore`. Verify: git status does not show untracked event files.

## 6. Tests

- [x] 6.1 Write unit tests for `FilePersistenceBackend`: write/read lines, write/read snapshot, list sessions, missing file handling. Verify: all tests pass.
- [x] 6.2 Write unit tests for `PersistentEventStore`: store, getEvents, getEventsInRange, hasSession, createSnapshot, getLatestSnapshot, getEventsAfterSnapshot. Verify: all tests pass.
- [x] 6.3 Write recovery tests: full recovery, partial corruption recovery, snapshot-based recovery. Verify: all tests pass.
- [x] 6.4 Write integration test: create session, store 20 events, create snapshot at event 10, store 10 more events, destroy store, create new PersistentEventStore, verify all 20 events recoverable from snapshot + replay. Verify: test passes.
- [x] 6.5 Update existing 112+ tests to ensure they still pass with in-memory store (no regressions). Verify: `deno test` passes.