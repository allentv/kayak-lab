## Purpose

Web browser projection that provides a browser-based interface for agent interactions, using WebSocket for real-time event delivery.

## ADDED Requirements

### Requirement: Web session list

The web UI MUST display a list of agent sessions.

#### Scenario: Session listing
- **WHEN** the web UI loads
- **THEN** a list of all sessions with status, creation time, and event count is displayed

#### Scenario: Session creation
- **WHEN** a user clicks "New Session"
- **THEN** a new session is created and the event view opens

### Requirement: Web event view

The web UI MUST display real-time events for a selected session.

#### Scenario: Real-time events
- **WHEN** a user selects a session
- **THEN** events stream in real time via WebSocket, rendered as a scrollable log

#### Scenario: Event details
- **WHEN** a user clicks an event
- **THEN** the full event payload is displayed in a detail panel

### Requirement: Web user input

The web UI MUST allow users to send input to agent sessions.

#### Scenario: Send message
- **WHEN** a user types a message and presses Enter
- **THEN** a user_input event is emitted and the agent processes it

#### Scenario: Send command
- **WHEN** a user types a command starting with `/`
- **THEN** the command is interpreted and executed (e.g., `/pause`, `/resume`, `/cancel`)
