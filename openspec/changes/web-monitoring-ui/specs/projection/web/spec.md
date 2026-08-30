## Purpose

Fresh-based Web UI embedded in the harness process, providing real-time monitoring of agent sessions, events, and capability health. Serves as the first runnable application and foundation for visual verification of harness behavior.

## ADDED Requirements

### Requirement: Harness entry point

The harness MUST provide a main entry point that wires components and starts the web server.

#### Scenario: Start harness with web UI
- **WHEN** `deno run -A src/main.ts` is executed
- **THEN** the harness initializes (EventStream, SessionManager, Capabilities) and starts a Fresh web server on the configured port (default 8000)

#### Scenario: Port configuration
- **WHEN** the `PORT` environment variable is set
- **THEN** the Fresh server listens on that port

#### Scenario: Harness without web UI
- **WHEN** `--no-web` flag is passed
- **THEN** the harness starts without the web server (headless mode for tests/CI)

### Requirement: Event stream subscription

The EventStream MUST support real-time subscription for pushing events to consumers.

#### Scenario: Subscribe to appends
- **WHEN** `eventStream.onAppend(callback)` is called
- **THEN** the callback is invoked for every new event appended to any session

#### Scenario: Unsubscribe
- **WHEN** the returned unsubscribe function is called
- **THEN** the callback is no longer invoked for subsequent events

#### Scenario: Session-scoped subscription
- **WHEN** `eventStream.onAppend(sessionId, callback)` is called
- **THEN** the callback is invoked only for events in the specified session

### Requirement: Dashboard page

The web UI MUST display a dashboard overview of the harness state.

#### Scenario: Active sessions
- **WHEN** the dashboard loads
- **THEN** a list of all sessions is displayed with: id, state, created_at, event count, last event type

#### Scenario: Session summary stats
- **WHEN** the dashboard loads
- **THEN** summary counts are shown: total sessions, active, completed, failed, paused

#### Scenario: Capability health
- **WHEN** the dashboard loads
- **THEN** each registered capability is listed with: name, version, initialized status, last error (if any)

#### Scenario: Recent events
- **WHEN** the dashboard loads
- **THEN** the last 20 events across all sessions are displayed in reverse chronological order

### Requirement: Session inspector page

The web UI MUST provide a per-session detail view with event timeline.

#### Scenario: Session event timeline
- **WHEN** a session is selected
- **THEN** all events for that session are displayed in a scrollable timeline with: sequence number, timestamp, event type, payload summary

#### Scenario: Event detail
- **WHEN** an event is clicked in the timeline
- **THEN** the full event payload is displayed in a detail panel (JSON formatted)

#### Scenario: Event type filter
- **WHEN** the user selects event type filters
- **THEN** only events matching the selected types are displayed

#### Scenario: Session state display
- **WHEN** a session is viewed
- **THEN** the current session state (active/paused/completed/failed/cancelled) is prominently displayed

### Requirement: Real-time WebSocket event stream

The web UI MUST receive events in real time via WebSocket.

#### Scenario: WebSocket connection
- **WHEN** the web UI loads any page
- **THEN** a WebSocket connection is established to `/ws/events`

#### Scenario: Real-time event push
- **WHEN** a new event is appended to the EventStream
- **THEN** all connected WebSocket clients receive the event within 100ms

#### Scenario: Event filtering over WebSocket
- **WHEN** a client sends a filter message `{ type: "subscribe", session_id?: string, event_types?: string[] }`
- **THEN** only matching events are delivered to that client

#### Scenario: Reconnection
- **WHEN** the WebSocket connection drops and reconnects
- **THEN** the client receives events from its last known sequence number (no gaps)

### Requirement: REST API

The web UI MUST expose REST API endpoints for programmatic access.

#### Scenario: List sessions
- **WHEN** `GET /api/sessions` is called
- **THEN** a JSON array of all sessions with state and metadata is returned

#### Scenario: Get session
- **WHEN** `GET /api/sessions/:id` is called
- **THEN** the full session object including event count is returned

#### Scenario: Get session events
- **WHEN** `GET /api/sessions/:id/events` is called
- **THEN** all events for that session are returned in order, with optional `?type=` filter and `?limit=` pagination

#### Scenario: Get capabilities
- **WHEN** `GET /api/capabilities` is called
- **THEN** a JSON array of all registered capabilities with name, version, initialized status is returned

#### Scenario: Health check
- **WHEN** `GET /api/health` is called
- **THEN** `{ status: "ok", uptime, session_count, event_count }` is returned

### Requirement: WebSocket server upgrade

The WebSocket server MUST use Deno's native WebSocket support.

#### Scenario: Upgrade handshake
- **WHEN** a client connects to `/ws/events`
- **THEN** the connection is upgraded from HTTP to WebSocket

#### Scenario: Heartbeat
- **WHEN** a client is idle for 30 seconds
- **THEN** the server sends a ping; if no pong in 5 seconds, the client is disconnected

### Requirement: Fresh islands architecture

The web UI MUST use Fresh's islands architecture for interactive components.

#### Scenario: SSR pages
- **WHEN** a page is requested
- **THEN** the initial HTML is server-rendered (fast load, SEO-friendly)

#### Scenario: Interactive islands
- **WHEN** the page loads in the browser
- **THEN** interactive components (event stream, filters, real-time updates) are hydrated as Fresh islands

#### Scenario: No build step
- **WHEN** the Fresh server starts
- **THEN** no separate build step is required (Deno-native, no webpack/vite)
