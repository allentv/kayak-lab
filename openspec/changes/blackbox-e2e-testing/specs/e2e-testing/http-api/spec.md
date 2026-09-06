## Purpose

Blackbox E2E tests verifying the HTTP API surface of the harness — health, sessions, events, capabilities, and CORS — running against the actual server process.

## ADDED Requirements

### Requirement: Health endpoint behavior

#### Scenario: Health returns correct shape
- **WHEN** `GET /api/health` is called on a freshly started harness
- **THEN** the response is HTTP 200 with body `{ status: "ok", uptime: 0, session_count: 0, event_count: 0 }`

#### Scenario: Uptime increases over time
- **WHEN** `GET /api/health` is called twice, 1 second apart
- **THEN** the second response has `uptime >= 1`

### Requirement: Sessions list behavior

#### Scenario: Empty session list
- **WHEN** `GET /api/sessions` is called on a freshly started harness
- **THEN** the response is HTTP 200 with body `[]`

#### Scenario: Session list reflects created sessions
- **WHEN** a session is created via the harness and `GET /api/sessions` is called
- **THEN** the response contains one entry with `event_count >= 1`

### Requirement: Session lifecycle via API

#### Scenario: Full lifecycle
- **WHEN** a session is created, paused, resumed, and completed via the harness
- **THEN** the session transitions through states `active → paused → active → completed` and the event history reflects all transitions in order

#### Scenario: Session not found
- **WHEN** `GET /api/sessions/:id` is called with a non-existent session ID
- **THEN** the response is HTTP 404 with body `{ error: "Session not found" }`

#### Scenario: Session event history
- **WHEN** `GET /api/sessions/:id` is called for an existing session
- **THEN** the response includes an `events` array ordered by `sequence_number`

### Requirement: Session event queries

#### Scenario: Events with type filter
- **WHEN** `GET /api/sessions/:id/events?type=session.created` is called
- **THEN** only events of type `session.created` are returned

#### Scenario: Events with limit
- **WHEN** `GET /api/sessions/:id/events?limit=2` is called on a session with 4 events
- **THEN** the 2 most recent events are returned

### Requirement: Capabilities endpoint

#### Scenario: Lists registered capabilities
- **WHEN** `GET /api/capabilities` is called
- **THEN** the response contains at least the Git and Shell capabilities with `initialized` status

### Requirement: CORS behavior

#### Scenario: Preflight returns 204
- **WHEN** `OPTIONS /api/health` is sent with `Origin` and `Access-Control-Request-Method` headers
- **THEN** the response is HTTP 204 with CORS headers allowing the origin

#### Scenario: Response includes CORS headers
- **WHEN** any GET request is made with an `Origin` header
- **THEN** the response includes `Access-Control-Allow-Origin: *`
