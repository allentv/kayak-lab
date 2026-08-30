## 1. EventStream Subscription API

- [ ] 1.1 Add `onAppend(callback: (event: BaseEvent) => void): () => void` method to `IEventStream` interface. Verify: interface compiles.
- [ ] 1.2 Implement `onAppend` in `EventStream` class: store callbacks in a Set, invoke all on each `append()`, return unsubscribe function. Verify: callback fires on append, unsubscribe stops it.
- [ ] 1.3 Add session-scoped overload: `onAppend(sessionId: string, callback): () => void`. Verify: callback fires only for matching session.
- [ ] 1.4 Update `EventStoreBridge` to use `onAppend` instead of manual bridging. Verify: events auto-propagate to EventStore.

## 2. Harness Headless Mode

- [ ] 2.1 Create `src/main.ts` entry point that initializes harness components (EventStream, SessionManager, Capabilities, EventStore, ProjectionProtocol). Verify: harness components wire correctly.
- [ ] 2.2 Add HTTP server using `Deno.serve` with API routes and WebSocket upgrade handler. Verify: server starts on configured port.
- [ ] 2.3 Add `--no-web` flag support: when passed, skip Fresh UI and serve only API + WebSocket. Verify: headless mode starts without Fresh dependency.
- [ ] 2.4 Add `--port` flag and `PORT` env var support (default 9000). Verify: server listens on configured port.
- [ ] 2.5 Add `--web` mode (default): start Fresh UI embedded in the same process for single-instance use. Verify: embedded mode works.

## 3. Harness API Routes

- [ ] 3.1 Create `GET /api/sessions` route: returns all sessions with state, created_at, event count. Verify: returns JSON array.
- [ ] 3.2 Create `GET /api/sessions/:id` route: returns single session with full metadata. Verify: returns session object or 404.
- [ ] 3.3 Create `GET /api/sessions/:id/events` route: returns events in order with `?type=` filter and `?limit=` pagination. Verify: returns filtered/paginated events.
- [ ] 3.4 Create `GET /api/capabilities` route: returns all capabilities with name, version, initialized status. Verify: returns capability list.
- [ ] 3.5 Create `GET /api/health` route: returns `{ status, uptime, session_count, event_count }`. Verify: returns health object.

## 4. Harness WebSocket Server

- [ ] 4.1 Create WebSocket upgrade handler at `/ws/events` using Deno's native WebSocket. Verify: connection established.
- [ ] 4.2 Wire `EventStream.onAppend` to WebSocket broadcast: on each event, send JSON to all connected clients. Verify: event appended → clients receive it within 100ms.
- [ ] 4.3 Implement client filter messages: `{ type: "subscribe", session_id?, event_types? }`. Verify: only matching events delivered.
- [ ] 4.4 Implement heartbeat: ping idle clients every 30s, disconnect if no pong in 5s. Verify: stale clients cleaned up.
- [ ] 4.5 Implement reconnection: client sends `from_sequence` on reconnect, server replays missed events. Verify: no gaps after reconnect.

## 5. Fresh Web UI Setup

- [ ] 5.1 Create `web/` directory with Fresh project structure: `fresh.config.ts`, `main.ts`, `routes/`, `islands/`, `components/`. Verify: Fresh dev server starts.
- [ ] 5.2 Create `web/main.ts` entry point with `--connect` flag parsing (comma-separated harness URLs). Verify: parses harness URLs correctly.
- [ ] 5.3 Implement harness connection manager: connect to N harnesses via WebSocket, track connection status (connected/disconnected). Verify: connects to multiple harnesses, tracks status.
- [ ] 5.4 Implement aggregation layer: merge sessions, events, capabilities from all harnesses into unified state. Verify: data from multiple harnesses merged correctly.

## 6. Web UI API Routes

- [ ] 6.1 Create `GET /api/harnesses` route: returns list of configured harnesses with connection status. Verify: returns harness list.
- [ ] 6.2 Create `GET /api/sessions` route: returns all sessions from all harnesses with source labels. Verify: aggregated sessions returned.
- [ ] 6.3 Create `GET /api/health` route: returns UI health with harness connection summary. Verify: returns health object.

## 7. Dashboard Page

- [ ] 7.1 Create dashboard route (`/`) with SSR: harness connection status cards, aggregated session count, event count. Verify: page renders with data.
- [ ] 7.2 Create harness status panel: list of connected harnesses with URL, status, session count, event count. Verify: harnesses displayed.
- [ ] 7.3 Create aggregated session table: sessions from all harnesses with source label, id, state, created_at, event count. Verify: sessions listed.
- [ ] 7.4 Create capability health panel: capabilities from all harnesses with source label, name, version, initialized. Verify: capabilities displayed.
- [ ] 7.5 Create recent events feed: last 50 events from all harnesses in reverse chronological order with source label. Verify: events displayed.
- [ ] 7.6 Create Fresh island for real-time dashboard updates: new events appear without reload. Verify: live updates work.

## 8. Session Inspector Page

- [ ] 8.1 Create session detail route (`/sessions/:harness/:id`) with SSR: session state, metadata, event timeline. Verify: page renders session data.
- [ ] 8.2 Create event timeline component: scrollable list of events with sequence number, timestamp, type, payload summary. Verify: events listed in order.
- [ ] 8.3 Create event detail panel: click event → full JSON payload displayed. Verify: payload shown on click.
- [ ] 8.4 Create event type filter: checkboxes for event types, filters timeline. Verify: only matching events shown.
- [ ] 8.5 Create Fresh island for real-time session events: new events appended to timeline live. Verify: events stream in real time.

## 9. Styling and Layout

- [ ] 9.1 Create base layout component: header with app name, navigation (Dashboard, Sessions). Verify: layout renders on all pages.
- [ ] 9.2 Style dashboard with CSS: harness cards, session table, capability list, event feed. Verify: pages are readable and organized.
- [ ] 9.3 Style session inspector: timeline layout, event cards, detail panel. Verify: inspector is usable.

## 10. Tests

- [ ] 10.1 Write EventStream subscription tests: onAppend fires, unsubscribe works, session-scoped filtering. Verify: all tests pass.
- [ ] 10.2 Write harness API route tests: /api/sessions, /api/sessions/:id, /api/sessions/:id/events, /api/capabilities, /api/health. Verify: all endpoints return correct data.
- [ ] 10.3 Write harness WebSocket tests: connection, event delivery, filtering, heartbeat, reconnection. Verify: all tests pass.
- [ ] 10.4 Write UI aggregation tests: merge sessions from multiple mock harnesses, handle disconnect. Verify: aggregation works.
- [ ] 10.5 Write integration test: start 2 harnesses → start UI → connect → verify aggregated dashboard. Verify: end-to-end flow works.
- [ ] 10.6 Verify existing 112+ tests still pass. Verify: `deno test` passes.
