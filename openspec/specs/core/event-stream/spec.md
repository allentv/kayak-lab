## Purpose

Core event stream infrastructure including event schema, ordering guarantees, and immutability. The event stream is the canonical representation of agent interactions, providing the foundation for UI projections, replay, and recovery.

## ADDED Requirements

### Requirement: Event immutability

Once an event is written to the stream, it MUST NOT be modified or deleted.

#### Scenario: Event write guarantee
- **WHEN** an event is appended to the event stream
- **THEN** the event is immutable and cannot be modified or deleted

#### Scenario: Event append only
- **WHEN** the event stream is accessed
- **THEN** only append operations are permitted, no update or delete operations

### Requirement: Event ordering

Events MUST be strictly ordered by sequence number within a session.

#### Scenario: Sequential ordering
- **WHEN** multiple events are written to a session
- **THEN** each event has a monotonically increasing sequence number

#### Scenario: Sequence gap detection
- **WHEN** an event is appended with a sequence number that is not exactly one greater than the last event
- **THEN** the system rejects the append with a sequence error

### Requirement: Event schema

Every event MUST conform to a defined schema with required fields.

#### Scenario: Required fields
- **WHEN** an event is created
- **THEN** it contains event_id, session_id, sequence_number, timestamp, event_type, schema_version, payload, and metadata fields

#### Scenario: Event type validation
- **WHEN** an event is appended with an unknown event_type
- **THEN** the system rejects the append with a schema validation error

### Requirement: Session isolation

Events from different sessions MUST be completely isolated.

#### Scenario: Session boundary
- **WHEN** events are written to session A
- **THEN** they are not visible when reading session B

#### Scenario: Concurrent sessions
- **WHEN** multiple sessions are active simultaneously
- **THEN** each session maintains its own independent event sequence
