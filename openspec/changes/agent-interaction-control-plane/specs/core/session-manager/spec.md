## Purpose

Session lifecycle management with create, resume, pause, complete, fail, cancel operations. Sessions represent a continuous interaction between a user and the agent platform.

## ADDED Requirements

### Requirement: Session creation

A new session MUST be created with a unique session_id and initial state.

#### Scenario: Create new session
- **WHEN** a user initiates a new interaction
- **THEN** a session is created with a unique session_id and status set to "active"

#### Scenario: Session ID uniqueness
- **WHEN** multiple sessions are created
- **THEN** each session has a globally unique session_id

### Requirement: Session state transitions

Sessions MUST follow valid state transitions: active → paused → active, active → completed, active → failed, active → cancelled.

#### Scenario: Pause active session
- **WHEN** an active session is paused
- **THEN** the session status changes to "paused" and no new events are accepted until resumed

#### Scenario: Resume paused session
- **WHEN** a paused session is resumed
- **THEN** the session status changes to "active" and event streaming continues

#### Scenario: Complete session
- **WHEN** an active session completes successfully
- **THEN** the session status changes to "completed" and no further events are accepted

#### Scenario: Fail session
- **WHEN** an active session encounters an error
- **THEN** the session status changes to "failed" and error details are recorded

#### Scenario: Cancel session
- **WHEN** an active session is cancelled by user or policy
- **THEN** the session status changes to "cancelled" and no further events are accepted

### Requirement: Session resumption

Sessions MUST be resumable from their last known state using the event stream.

#### Scenario: Resume from event stream
- **WHEN** a session is resumed after disconnection
- **THEN** the system reconstructs state by replaying events from the event store

#### Scenario: Resume with event gap
- **WHEN** a session is resumed but events are missing
- **THEN** the system detects the gap and either fills it or reports the session as unrecoverable
