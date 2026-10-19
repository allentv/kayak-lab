## ADDED Requirements

### Requirement: SQLite driver compatibility

The persistence layer MUST use a SQLite driver that works on both Deno and Node.js. If `@db/sqlite` is not available on Node.js, migrate to a compatible driver (e.g., `better-sqlite3`) with identical query behavior.

#### Scenario: Event store operations work unchanged

- **WHEN** events are persisted and retrieved via the event store
- **THEN** the same data is returned as before the migration

#### Scenario: Schema migrations run cleanly

- **WHEN** the database is initialized on a fresh install
- **THEN** the schema is created identically on both runtimes
