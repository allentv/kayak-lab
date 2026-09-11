## Purpose

Blackbox E2E tests verifying the HTTP API surface of the harness — health, sessions, events, capabilities, CORS, and WebSocket — running against the actual server process.

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

### Requirement: Invalid state transitions

The harness SHALL reject state transitions that are not valid according to the session state machine (active→paused, active→completed, active→failed, active→cancelled, paused→active; no transitions from completed/failed/cancelled).

#### Scenario: Cannot pause a completed session
- **WHEN** `PATCH /api/sessions/:id` is called with `{ "action": "pause" }` on a completed session
- **THEN** the response is HTTP 400 with an error message indicating the transition is invalid

#### Scenario: Cannot resume a failed session
- **WHEN** `PATCH /api/sessions/:id` is called with `{ "action": "resume" }` on a failed session
- **THEN** the response is HTTP 400

#### Scenario: Cannot complete a paused session (must resume first)
- **WHEN** `PATCH /api/sessions/:id` is called with `{ "action": "complete" }` on a paused session
- **THEN** the response is HTTP 400

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

### Requirement: Health endpoint reflects state changes

The harness SHALL update health statistics (session_count, event_count) as sessions are created and modified.

#### Scenario: Session count updates after creation
- **WHEN** `GET /api/health` is called after creating 3 sessions
- **THEN** the response includes `session_count: 3`

#### Scenario: Event count increases with session operations
- **WHEN** `GET /api/health` is called after creating a session and completing it
- **THEN** the response includes `event_count >= 2` (at least created + completed events)

### Requirement: Session message sending

The harness SHALL support sending user messages to a session via POST.

#### Scenario: Send message returns 200
- **WHEN** `POST /api/sessions/:id/messages` is called with `{ "message": "Hello" }`
- **THEN** the response is HTTP 200 with a message response containing the event id

#### Scenario: Send async message returns 202
- **WHEN** `POST /api/sessions/:id/messages` is called with `{ "message": "Hello", "async": true }`
- **THEN** the response is HTTP 202 with a polling URL

#### Scenario: Send message to non-existent session returns 404
- **WHEN** `POST /api/sessions/:id/messages` is called with a non-existent session ID
- **THEN** the response is HTTP 404

### Requirement: Session event pagination

The harness SHALL support paginating session events with offset and limit.

#### Scenario: Events with offset
- **WHEN** `GET /api/sessions/:id/events?offset=2&limit=2` is called on a session with 5 events
- **THEN** the response contains 2 events starting from offset 2

#### Scenario: Events with default limit
- **WHEN** `GET /api/sessions/:id/events` is called on a session with 150 events
- **THEN** the response contains at most 100 events (default limit)

### Requirement: Concurrent session isolation

The harness SHALL maintain independent state for each session.

#### Scenario: Multiple sessions do not interfere
- **WHEN** two sessions are created, one is paused, and the other is completed
- **THEN** each session retains its own state and event history

#### Scenario: Session events are isolated
- **WHEN** events are added to session A and session B
- **THEN** `GET /api/sessions/:id/events` for session A only returns session A's events

### Requirement: WebSocket connection lifecycle

The harness SHALL support WebSocket connections that deliver real-time events to subscribed clients.

#### Scenario: Connect and receive welcome
- **WHEN** a client connects to `/ws/events`
- **THEN** it receives a welcome message with `type: "welcome"`, `version: "1.0.0"`, and `capabilities` array

#### Scenario: Subscribe and receive events
- **WHEN** a client sends `{ "type": "subscribe", "session_id": "..." }` and a session event occurs
- **THEN** the client receives a `{ "type": "event", "event": {...} }` message

#### Scenario: Session filtering
- **WHEN** a client subscribes to a specific session and events occur on other sessions
- **THEN** the client only receives events for the subscribed session

#### Scenario: Event type filtering
- **WHEN** a client subscribes with `{ "type": "subscribe", "session_id": "...", "event_types": ["session.created"] }`
- **THEN** only events of type `session.created` are received

#### Scenario: Unsubscribe
- **WHEN** a client sends `{ "type": "unsubscribe" }`
- **THEN** no further events are delivered until a new subscription is made

#### Scenario: Reconnect with gap recovery
- **WHEN** a client sends `{ "type": "reconnect", "session_id": "...", "last_event_id": "..." }`
- **THEN** events after the specified event are replayed to the client

#### Scenario: Heartbeat ping/pong
- **WHEN** a client is connected for 30 seconds
- **THEN** the server sends a `{ "type": "ping" }` message and the client responds with `{ "type": "pong" }`

#### Scenario: Idle timeout disconnects
- **WHEN** a client does not respond to pings for 35 seconds
- **THEN** the server disconnects the client

#### Scenario: Malformed message handling
- **WHEN** a client sends invalid JSON or an unknown message type
- **THEN** the server ignores the message and does not disconnect the client
