# e2e-testing/test-infrastructure Specification

## Purpose
Reusable test helpers for starting the harness as a subprocess, making typed HTTP requests, and connecting WebSocket clients — all without importing from `src/`.

## Requirements

### Requirement: Subprocess lifecycle management

The test infrastructure SHALL start the harness as a Deno subprocess on a configurable port and shut it down cleanly.

#### Scenario: Start and stop server
- **WHEN** a test calls `harnessProcess.start(port)`
- **THEN** the harness process is spawned on that port and the helper waits until `/api/health` responds with HTTP 200

#### Scenario: Port allocation
- **WHEN** a test needs a free port
- **THEN** the helper picks a random port in the ephemeral range (30000–40000) and verifies it is available before passing it to the subprocess

#### Scenario: Clean shutdown
- **WHEN** `harnessProcess.stop()` is called
- **THEN** the subprocess is terminated gracefully (SIGTERM) and the helper waits for exit

#### Scenario: Readiness detection
- **WHEN** the subprocess is started
- **THEN** the helper polls `/api/health` with exponential backoff (starting at 100ms, max 5 retries) before considering the server ready

### Requirement: Typed HTTP client

The test infrastructure SHALL provide a typed client for all harness API endpoints.

#### Scenario: Health check
- **WHEN** `client.getHealth()` is called
- **THEN** it returns `{ status: string, uptime: number, session_count: number, event_count: number }`

#### Scenario: List sessions
- **WHEN** `client.getSessions()` is called
- **THEN** it returns an array of session objects with `event_count`

#### Scenario: Get session
- **WHEN** `client.getSession(id)` is called with a valid session ID
- **THEN** it returns the session object including its `events` array

#### Scenario: Session not found
- **WHEN** `client.getSession(id)` is called with an invalid session ID
- **THEN** it throws an error with status 404

#### Scenario: Get session events
- **WHEN** `client.getSessionEvents(id, { type?, limit? })` is called
- **THEN** it returns an array of events, filtered by type and limited as specified

#### Scenario: List capabilities
- **WHEN** `client.getCapabilities()` is called
- **THEN** it returns an array of `{ name, version, initialized }` objects

#### Scenario: CORS preflight
- **WHEN** a preflight OPTIONS request is sent
- **THEN** the response has status 204 and appropriate CORS headers

### Requirement: WebSocket client

The test infrastructure SHALL provide a WebSocket client that can connect, subscribe, and collect events.

#### Scenario: Connect and receive welcome
- **WHEN** the client connects to `/ws/events`
- **THEN** it receives a welcome message with `type: "welcome"` and capabilities list

#### Scenario: Subscribe to session events
- **WHEN** the client sends `{ type: "subscribe", session_id: "..." }`
- **THEN** it receives events matching that session as JSON messages

#### Scenario: Collect events
- **WHEN** `client.collectEvents(count, timeoutMs)` is called
- **THEN** it waits for `count` events or `timeoutMs` milliseconds, whichever comes first, and returns the collected events

#### Scenario: Disconnect
- **WHEN** `client.close()` is called
- **THEN** the WebSocket is closed and the connection is cleaned up
