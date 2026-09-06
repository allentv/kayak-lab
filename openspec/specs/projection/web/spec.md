## Purpose

Fresh-based Web UI as a separate process that connects to one or more headless harness instances, providing a unified real-time monitoring dashboard for agent sessions, events, and capabilities.

## ADDED Requirements

### Requirement: Harness headless mode

The harness MUST run without the web server when `--no-web` is passed.

#### Scenario: Headless start
- **WHEN** `deno run -A src/main.ts --no-web --port 9001` is executed
- **THEN** the harness initializes and starts an HTTP/WebSocket server on port 9001 without Fresh UI

#### Scenario: Default mode
- **WHEN** `deno run -A src/main.ts --port 9001` is executed (no `--no-web`)
- **THEN** the harness starts with the embedded Fresh UI on the same port (single-instance mode)

#### Scenario: Port configuration
- **WHEN** the `PORT` environment variable or `--port` flag is set
- **THEN** the server listens on that port

### Requirement: Harness HTTP/WebSocket server

The harness MUST expose API and WebSocket endpoints even in headless mode.

#### Scenario: REST API available
- **WHEN** the harness starts (headless or with UI)
- **THEN** `GET /api/sessions`, `GET /api/sessions/:id`, `GET /api/sessions/:id/events`, `GET /api/capabilities`, `GET /api/health` are available

#### Scenario: WebSocket available
- **WHEN** the harness starts
- **THEN** `ws://host:port/ws/events` accepts connections and streams events

#### Scenario: Multiple harness instances
- **WHEN** 3 harness instances run on ports 9001, 9002, 9003
- **THEN** each exposes its own API and WebSocket independently

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

### Requirement: Web UI as separate process

The Web UI MUST be a separate Fresh application that connects to harness instances.

#### Scenario: Connect to single harness
- **WHEN** `deno run -A web/main.ts --connect localhost:9001` is executed
- **THEN** the UI starts on port 8000 and connects to the harness on port 9001

#### Scenario: Connect to multiple harnesses
- **WHEN** `deno run -A web/main.ts --connect localhost:9001,localhost:9002,localhost:9003` is executed
- **THEN** the UI connects to all three harnesses and aggregates their state

#### Scenario: Dynamic connection
- **WHEN** the UI is running and a new harness URL is added via the UI
- **THEN** the UI connects to the new harness without restart

#### Scenario: Harness disconnect
- **WHEN** a connected harness becomes unavailable
- **THEN** the UI shows the harness as "disconnected" and continues showing data from other harnesses

### Requirement: Dashboard page

The web UI MUST display an aggregated dashboard of all connected harnesses.

#### Scenario: Multi-harness overview
- **WHEN** the dashboard loads
- **THEN** each connected harness is listed with: name/URL, status (connected/disconnected), session count, event count

#### Scenario: Aggregated session list
- **WHEN** the dashboard loads
- **THEN** all sessions across all harnesses are displayed with: harness source, session id, state, created_at, event count

#### Scenario: Aggregated capability health
- **WHEN** the dashboard loads
- **THEN** capabilities from all harnesses are listed with: harness source, name, version, initialized status

#### Scenario: Recent events feed
- **WHEN** the dashboard loads
- **THEN** the last 50 events across all harnesses are displayed in reverse chronological order with source harness label

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

#### Scenario: Harness source label
- **WHEN** events from different harnesses are displayed
- **THEN** each event shows which harness it came from

### Requirement: Real-time WebSocket event stream

The web UI MUST receive events in real time via WebSocket from each connected harness.

#### Scenario: Per-harness WebSocket
- **WHEN** the UI connects to a harness
- **THEN** a WebSocket connection is established to `ws://harness/ws/events`

#### Scenario: Real-time event push
- **WHEN** a new event is appended to any connected harness
- **THEN** the UI receives the event within 100ms

#### Scenario: Event filtering
- **WHEN** the UI sends a filter message `{ type: "subscribe", session_id?, event_types? }`
- **THEN** only matching events are delivered from that harness

#### Scenario: Reconnection
- **WHEN** a WebSocket connection drops and reconnects
- **THEN** the UI receives events from its last known sequence number (no gaps)

### Requirement: REST API

The web UI MUST expose its own REST API for programmatic access to aggregated state.

#### Scenario: List all sessions
- **WHEN** `GET /api/sessions` is called on the UI
- **THEN** all sessions from all connected harnesses are returned with source harness labels

#### Scenario: List connected harnesses
- **WHEN** `GET /api/harnesses` is called on the UI
- **THEN** a list of all configured harness connections with status is returned

#### Scenario: Health check
- **WHEN** `GET /api/health` is called on the UI
- **THEN** `{ status: "ok", harnesses: [...], total_sessions, total_events }` is returned

### Requirement: Fresh islands architecture

The web UI MUST use Fresh's islands architecture for interactive components.

#### Scenario: SSR pages
- **WHEN** a page is requested
- **THEN** the initial HTML is server-rendered (fast load)

#### Scenario: Interactive islands
- **WHEN** the page loads in the browser
- **THEN** interactive components (event stream, filters, real-time updates) are hydrated as Fresh islands

#### Scenario: No build step
- **WHEN** the Fresh server starts
- **THEN** no separate build step is required (Deno-native)
