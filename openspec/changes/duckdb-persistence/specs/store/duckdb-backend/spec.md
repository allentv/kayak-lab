## Purpose

DuckDB persistence backend for event store and memory storage, providing columnar analytics, native JSON ingestion, and SQL-based multi-dimensional queries while remaining embedded (no server process).

## ADDED Requirements

### Requirement: DuckDB event persistence

Events MUST be durably written to a DuckDB database with append-only semantics.

#### Scenario: Event append to DuckDB
- **WHEN** an event is appended to a persistent session
- **THEN** the event is inserted into the `events` table with session_id, sequence, event_type, payload (JSON), and timestamp

#### Scenario: Single database file
- **WHEN** the DuckDB backend is initialized
- **THEN** all events are stored in a single `kayak.db` file (not per-session files)

#### Scenario: Schema creation
- **WHEN** the database is initialized
- **THEN** the `events` table is created with columns: id (VARCHAR), session_id (VARCHAR), sequence (INTEGER), event_type (VARCHAR), payload (JSON), timestamp (TIMESTAMP), metadata (JSON)

### Requirement: DuckDB event retrieval

Events MUST be retrievable from DuckDB in correct order.

#### Scenario: Read all events for a session
- **WHEN** events are requested for a persisted session
- **THEN** all events are returned in sequence_number order via SQL query

#### Scenario: Read event range from DuckDB
- **WHEN** a range of events is requested by sequence number
- **THEN** only events within the range are returned via SQL WHERE clause

#### Scenario: Session not found
- **WHEN** events are requested for a session with no events in DuckDB
- **THEN** an empty result is returned (not an error)

### Requirement: DuckDB snapshot persistence

Snapshots MUST be durably written to DuckDB and usable for fast recovery.

#### Scenario: Snapshot write to DuckDB
- **WHEN** a snapshot is created for a session
- **THEN** the snapshot is stored in a `snapshots` table or as a JSON column in the events table

#### Scenario: Snapshot read on recovery
- **WHEN** the system starts and a snapshot exists for a session
- **THEN** the snapshot is loaded and events after the snapshot's sequence number are replayed

### Requirement: DuckDB startup recovery

The DuckDB store MUST reconstruct in-memory state from the database on initialization.

#### Scenario: Recover all sessions
- **WHEN** the DuckDB store is initialized
- **THEN** all sessions are loaded from the `events` table and in-memory indexes rebuilt

#### Scenario: Empty database
- **WHEN** the DuckDB database is empty
- **THEN** the store initializes with no sessions (clean start)

### Requirement: JSONL migration

Existing JSONL event files MUST be importable into DuckDB.

#### Scenario: Import JSONL files
- **WHEN** the migration tool is run with a data directory containing JSONL files
- **THEN** all events from JSONL files are loaded into the DuckDB `events` table using `read_json_auto()`

#### Scenario: Idempotent migration
- **WHEN** the migration tool is run multiple times
- **THEN** duplicate events are not created (upsert or skip logic)

### Requirement: DuckDB memory storage

Memories MUST be durably stored in DuckDB with indexed queries.

#### Scenario: Memory store to DuckDB
- **WHEN** a memory is stored
- **THEN** it is inserted into the `memories` table with id, type, session_id, content, metadata, and created_at

#### Scenario: Memory retrieval by ID
- **WHEN** a memory is retrieved by ID
- **THEN** the memory is returned from DuckDB via SQL SELECT

#### Scenario: Memory list with filters
- **WHEN** memories are listed with type or session_id filters
- **THEN** only matching memories are returned via SQL WHERE clause

#### Scenario: Memory delete
- **WHEN** a memory is deleted
- **THEN** it is removed from DuckDB via SQL DELETE

### Requirement: Pluggable DuckDB backend

The DuckDB backend MUST satisfy the existing `IPersistenceBackend` and `IMemoryStorage` interfaces.

#### Scenario: Backend substitution
- **WHEN** `DuckDBPersistenceBackend` is provided to `PersistentEventStore`
- **THEN** the event store operates correctly using DuckDB without code changes to the caller

#### Scenario: Fallback to file backend
- **WHEN** DuckDB is not available or configured
- **THEN** the system falls back to `FilePersistenceBackend`

### Requirement: Connection management

DuckDB connections MUST be managed efficiently.

#### Scenario: Single connection per store
- **WHEN** the DuckDB backend is initialized
- **THEN** a single DuckDB connection is created and reused for all operations

#### Scenario: Graceful shutdown
- **WHEN** the system shuts down
- **THEN** the DuckDB connection is closed cleanly

#### Scenario: Concurrent access
- **WHEN** multiple operations access DuckDB concurrently
- **THEN** operations are serialized or use DuckDB's built-in concurrency support
