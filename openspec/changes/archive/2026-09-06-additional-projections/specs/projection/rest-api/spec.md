## Purpose

REST API projection that provides HTTP endpoints for programmatic access to agent sessions and events, enabling integration with external tools and workflows.

## ADDED Requirements

### Requirement: Session CRUD API

The REST API MUST provide endpoints for session management.

#### Scenario: List sessions
- **WHEN** `GET /api/sessions` is called
- **THEN** a list of all sessions with status and metadata is returned

#### Scenario: Get session
- **WHEN** `GET /api/sessions/{id}` is called
- **THEN** the full session state including event count and last event is returned

#### Scenario: Create session
- **WHEN** `POST /api/sessions` is called with optional initial message
- **THEN** a new session is created and the session object is returned

#### Scenario: Delete session
- **WHEN** `DELETE /api/sessions/{id}` is called
- **THEN** the session is cancelled and removed

### Requirement: Event API

The REST API MUST provide endpoints for event access.

#### Scenario: List events
- **WHEN** `GET /api/sessions/{id}/events` is called
- **THEN** all events for the session are returned in order, with optional pagination

#### Scenario: Get event by sequence
- **WHEN** `GET /api/sessions/{id}/events/{seq}` is called
- **THEN** the specific event is returned

### Requirement: Agent interaction API

The REST API MUST provide an endpoint for sending messages to agents.

#### Scenario: Send message
- **WHEN** `POST /api/sessions/{id}/messages` is called with a message body
- **THEN** a user_input event is emitted, the agent processes it, and the response events are returned

#### Scenario: Async response
- **WHEN** the agent is still processing
- **THEN** the API returns 202 Accepted with a polling URL

### Requirement: API authentication

The REST API MUST require authentication for all endpoints.

#### Scenario: Missing auth
- **WHEN** a request is made without an API key
- **THEN** a 401 Unauthorized response is returned

#### Scenario: Valid auth
- **WHEN** a request includes a valid API key in the Authorization header
- **THEN** the request is processed
