## Purpose

Event schema versioning and migration framework ensuring safe evolution of event types without breaking existing event stores or replay.

## ADDED Requirements

### Requirement: Schema versioning

Every event MUST carry a `schema_version` field indicating its schema version.

#### Scenario: Version on creation
- **WHEN** an event is created
- **THEN** it is stamped with the current schema version for its event type

#### Scenario: Version on read
- **WHEN** an event is read from storage
- **THEN** its schema_version is preserved and available for migration decisions

### Requirement: Schema registry

The system MUST maintain a registry of all known event schemas and their versions.

#### Scenario: Register schema
- **WHEN** a new event type or version is defined
- **THEN** it is registered in the schema registry with its version number and schema definition

#### Scenario: Lookup schema
- **WHEN** the system needs to validate or migrate an event
- **THEN** it can look up the schema by event_type and schema_version

#### Scenario: Unknown schema version
- **WHEN** an event has a schema_version not in the registry
- **THEN** the system attempts best-effort deserialization and logs a warning

### Requirement: Backward compatibility

Schema changes MUST follow backward compatibility rules.

#### Scenario: Additive change (safe)
- **WHEN** a new optional field is added to an event schema
- **THEN** existing events without that field are valid (field defaults to undefined/null)

#### Scenario: Removing field (breaking)
- **WHEN** a field is removed from an event schema
- **THEN** the change is flagged as breaking and requires a major version bump

#### Scenario: Renaming field (breaking)
- **WHEN** a field is renamed in an event schema
- **THEN** the change is flagged as breaking and requires a migration utility

#### Scenario: Type change (breaking)
- **WHEN** a field's type changes (e.g., string to number)
- **THEN** the change is flagged as breaking and requires a migration utility

### Requirement: Migration utilities

The system MUST provide utilities to migrate events between schema versions.

#### Scenario: Single-version migration
- **WHEN** a migration path exists from version N to version N+1
- **THEN** the utility transforms events from version N to version N+1 format

#### Scenario: Multi-version migration
- **WHEN** an event is at version N and current is version N+3
- **THEN** the utility chains migrations: N → N+1 → N+2 → N+3

#### Scenario: No migration path
- **WHEN** no migration path exists between versions
- **THEN** the utility reports an error with the gap and suggests manual intervention

### Requirement: Compatibility checking

The system MUST check compatibility before applying schema changes.

#### Scenario: Compatible change
- **WHEN** a new schema version is registered that is backward-compatible
- **THEN** the system accepts it and existing events remain valid

#### Scenario: Incompatible change without migration
- **WHEN** a new schema version is registered that is not backward-compatible and no migration is provided
- **THEN** the system rejects the registration with a compatibility error
