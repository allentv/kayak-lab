# store/persistence Specification

## Purpose

File-based event persistence with JSONL append-only logs, snapshot persistence, and startup recovery. Enables the event store to survive process restarts and crashes.

## Requirements

### Requirement: Event file persistence

Events MUST be durably written to disk in append-only JSONL (JSON Lines) files, one file per session.

#### Scenario: Event append to disk
- **WHEN** an event is appended to a persistent session
- **THEN** the event is serialized as a single JSON line and appended to the session's JSONL file

#### Scenario: File naming
- **WHEN** a session's event file is created
- **THEN** the file is named `<session_id>.jsonl` and stored under the configured data directory

#### Scenario: Directory creation
- **WHEN** the data directory does not exist
- **THEN** it is created automatically on first write

### Requirement: Event retrieval from disk

Events MUST be retrievable from persisted files in correct order.

#### Scenario: Read all events for a session
- **WHEN** events are requested for a persisted session
- **THEN** all events are returned in sequence_number order, reconstructed from the JSONL file

#### Scenario: Read event range from disk
- **WHEN** a range of events is requested by sequence number
- **THEN** only events within the range are returned, read from the JSONL file

#### Scenario: Session not found
- **WHEN** events are requested for a session with no persisted file
- **THEN** an empty result is returned (not an error)

### Requirement: Snapshot persistence

Snapshots MUST be durably written to disk and usable for fast recovery.

#### Scenario: Snapshot write
- **WHEN** a snapshot is created for a session
- **THEN** the snapshot is serialized as JSON and written to `<session_id>.snapshot.json`

#### Scenario: Snapshot read on recovery
- **WHEN** the system starts and a snapshot file exists for a session
- **THEN** the snapshot is loaded and events after the snapshot's sequence number are replayed from the JSONL file

#### Scenario: Latest snapshot selection
- **WHEN** multiple snapshots exist for a session
- **THEN** the snapshot with the highest sequence number is used for recovery

### Requirement: Startup recovery

The persistent store MUST reconstruct in-memory state from disk on initialization.

#### Scenario: Recover all sessions
- **WHEN** the persistent store is initialized
- **THEN** all session files in the data directory are scanned, events loaded, and in-memory indexes rebuilt

#### Scenario: Partial file corruption
- **WHEN** a JSONL file contains a corrupted line
- **THEN** the store logs a warning, skips the corrupted line, and continues loading remaining events

#### Scenario: Empty data directory
- **WHEN** the data directory is empty or does not exist
- **THEN** the store initializes with no sessions (clean start)

### Requirement: Flush guarantee

The store MUST provide a flush operation to ensure durability.

#### Scenario: Explicit flush
- **WHEN** `flush()` is called
- **THEN** all buffered writes are synchronized to disk

#### Scenario: Auto-flush on append
- **WHEN** an event is appended
- **THEN** it is written to the JSONL file synchronously (no buffering) to guarantee durability on return

### Requirement: Pluggable backend

The persistence interface MUST allow alternative backends without changing callers.

#### Scenario: Backend substitution
- **WHEN** a different persistence backend is provided (e.g., SQLite)
- **THEN** the event store operates correctly using the new backend without code changes to the caller

#### Scenario: In-memory fallback
- **WHEN** no persistence configuration is provided
- **THEN** the store operates in-memory mode (current behavior preserved)