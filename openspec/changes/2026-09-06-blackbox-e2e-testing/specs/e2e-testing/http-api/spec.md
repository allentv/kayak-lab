## Purpose

Blackbox E2E tests verifying the HTTP API surface of the harness — health, sessions, events, capabilities, and CORS — running against the actual server process.

## ADDED Requirements

### Requirement: Health endpoint behavior

The harness SHALL expose a health endpoint that returns server status, uptime, and event statistics.

#### Scenario: Health returns correct shape
- **WHEN** `GET /api/health` is called on a freshly started harness
- **THEN** the response is HTTP 200 with body `{ status: "ok", uptime: 0, session_count: 0, event_count: 0 }`

#### Scenario: Uptime increases over time
- **WHEN** `GET /api/health` is called twice, 1 second apart
- **THEN** the second response has `uptime >= 1`

### Requirement: Sessions list behavior

The harness SHALL expose an endpoint that lists all active sessions with their event counts.

#### Scenario: Empty session list
- **WHEN** `GET /api/sessions` is called on a freshly started harness
- **THEN** the response is HTTP 200 with body `[]`

#### Scenario: Session list reflects created sessions
- **WHEN** a session is created via the harness and `GET /api/sessions` is called
- **THEN** the response contains one entry with `event_count >= 1`

### Requirement: Session creation via API

The harness SHALL support creating sessions via POST with an optional description, returning the new session in active state.

#### Scenario: Create session returns 201 with active state
- **WHEN** `POST /api/sessions` is called with `{ "description": "..." }`
- **THEN** the response is HTTP 201 with body containing `state: "active"`, a generated `id`, and the provided `description`

#### Scenario: Create session without description
- **WHEN** `POST /api/sessions` is called with no body
- **THEN** the response is HTTP 201 with `state: "active"` and `description` is null or undefined

### Requirement: Session lifecycle via API

The harness SHALL support creating sessions and transitioning their state through the HTTP API, with full event history returned for each session.

#### Scenario: Full lifecycle
- **WHEN** a session is created, paused, resumed, and completed via the harness
- **THEN** the session transitions through states `active → paused → active → completed` and the event history reflects all transitions in order

#### Scenario: Fail action
- **WHEN** `PATCH /api/sessions/:id` is called with `{ "action": "fail", "error": "..." }` on an active session
- **THEN** the session transitions to `failed` state

#### Scenario: Cancel action
- **WHEN** `PATCH /api/sessions/:id` is called with `{ "action": "cancel" }` on an active session
- **THEN** the session transitions to `cancelled` state

#### Scenario: Invalid action returns 400
- **WHEN** `PATCH /api/sessions/:id` is called with `{ "action": "bogus" }`
- **THEN** the response is HTTP 400 with an error message

#### Scenario: Patch non-existent session returns 404
- **WHEN** `PATCH /api/sessions/:id` is called with a non-existent session ID
- **THEN** the response is HTTP 404

#### Scenario: Session not found
- **WHEN** `GET /api/sessions/:id` is called with a non-existent session ID
- **THEN** the response is HTTP 404 with body `{ error: "Session not found" }`

#### Scenario: Session event history
- **WHEN** `GET /api/sessions/:id` is called for an existing session
- **THEN** the response includes an `events` array ordered by `sequence_number`

### Requirement: Session event queries

The harness SHALL support querying session events with optional type filtering and result limiting.

#### Scenario: Events with type filter
- **WHEN** `GET /api/sessions/:id/events?type=session.created` is called
- **THEN** only events of type `session.created` are returned

#### Scenario: Events with limit
- **WHEN** `GET /api/sessions/:id/events?limit=2` is called on a session with 4 events
- **THEN** the 2 most recent events are returned

### Requirement: Capabilities endpoint

The harness SHALL expose an endpoint listing all registered capabilities with their initialization status.

#### Scenario: Lists registered capabilities
- **WHEN** `GET /api/capabilities` is called
- **THEN** the response contains at least the Git and Shell capabilities with `initialized` status

### Requirement: CORS behavior

The harness SHALL respond to CORS preflight requests and include appropriate CORS headers on all responses.

#### Scenario: Preflight returns 204
- **WHEN** `OPTIONS /api/health` is sent with `Origin` and `Access-Control-Request-Method` headers
- **THEN** the response is HTTP 204 with CORS headers allowing the origin, including `Access-Control-Allow-Methods` containing `PATCH`

#### Scenario: Response includes CORS headers
- **WHEN** any GET request is made with an `Origin` header
- **THEN** the response includes `Access-Control-Allow-Origin: *`

### Requirement: Unknown route handling

The harness SHALL return 404 for requests to undefined API routes.

#### Scenario: Unknown API route returns 404
- **WHEN** `GET /api/nonexistent` is called
- **THEN** the response is HTTP 404
