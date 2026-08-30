## Purpose

Event persistence layer with replay and recovery support. Provides storage and retrieval of event streams for session reconstruction and audit.

## ADDED Requirements

### Requirement: Event persistence

Events MUST be persisted durably and retrievable by session.

#### Scenario: Event storage
- **WHEN** an event is appended to the stream
- **THEN** it is persisted to durable storage

#### Scenario: Event retrieval
- **WHEN** events are requested for a session
- **THEN** all events for that session are returned in order

#### Scenario: Event range retrieval
- **WHEN** a range of events is requested (by sequence number or timestamp)
- **THEN** only events within the specified range are returned

### Requirement: Replay support

The event store MUST support replaying events to reconstruct state.

#### Scenario: Full replay
- **WHEN** a session is replayed from the beginning
- **THEN** all events are returned in order for state reconstruction

#### Scenario: Partial replay
- **WHEN** a session is replayed from a specific sequence number
- **THEN** events from that sequence number onward are returned

#### Scenario: Snapshot support
- **WHEN** a snapshot exists for a session
- **THEN** replay can start from the snapshot instead of the beginning

### Requirement: Recovery support

The event store MUST support recovery after failures.

#### Scenario: Crash recovery
- **WHEN** the system crashes and restarts
- **THEN** the event store can reconstruct the last known state from persisted events

#### Scenario: Corrupted event handling
- **WHEN** a corrupted event is detected
- **THEN** the event store reports the corruption and provides options for recovery
