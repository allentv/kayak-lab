## 1. EventStream Subscription API

- [ ] 1.1 Add `onAppend(callback: (event: BaseEvent) => void): () => void` method to `IEventStream` interface. Verify: interface compiles.
- [ ] 1.2 Implement `onAppend` in `EventStream` class: store callbacks in a Set, invoke all on each `append()`, return unsubscribe function. Verify: callback fires on append, unsubscribe stops it.
- [ ] 1.3 Add session-scoped overload: `onAppend(sessionId: string, callback): () => void`. Verify: callback fires only for matching session.
- [ ] 1.4 Update `EventStoreBridge` to use `onAppend` instead of manual bridging. Verify: events auto-propagate to EventStore.

## 2. Fresh Server Setup

- [ ] 2.1 Add Fresh dependency to import map (`fresh@2` from deno.land). Verify: Fresh imports correctly.
- [ ] 2.2 Create `web/` directory with Fresh project structure: `fresh.config.ts`, `routes/`, `islands/`, `components/`. Verify: Fresh dev server starts.
- [ ] 2.3 Create `src/main.ts` entry point that initializes harness (EventStream, SessionManager, Capabilities, EventStore) and starts Fresh server. Verify: `deno run -A src/main.ts` starts both harness and web server.
- [ ] 2.4 Add `--no-web` flag support to `main.ts` for headless mode. Verify: harness starts without web server when flag is passed.
- [ ] 2.5 Add `PORT` environment variable support (default 8000). Verify: server listens on configured port.

## 3. API Routes

- [ ] 3.1 Create `GET /api/sessions` route: returns all sessions with state, created_at, event count. Verify: returns JSON array.
- [ ] 3.2 Create `GET /api/sessions/:id` route: returns single session with full metadata. Verify: returns session object or 404.
- [ ] 3.3 Create `GET /api/sessions/:id/events` route: returns events in order with `?type=` filter and `?limit=` pagination. Verify: returns filtered/paginated events.
- [ ] 3.4 Create `GET /api/capabilities` route: returns all capabilities with name, version, initialized status. Verify: returns capability list.
- [ ] 3.5 Create `GET /api/health` route: returns `{ status, uptime, session_count, event_count }`. Verify: returns health object.

## 4. WebSocket Event Stream

- [ ] 4.1 Create WebSocket upgrade handler at `/ws/events` using Deno's native WebSocket. Verify: connection established.
- [ ] 4.2 Wire `EventStream.onAppend` to WebSocket broadcast: on each event, send JSON to all connected clients. Verify: event appended → clients receive it within 100ms.
- [ ] 4.3 Implement client filter messages: `{ type: "subscribe", session_id?, event_types? }`. Verify: only matching events delivered.
- [ ] 4.4 Implement heartbeat: ping idle clients every 30s, disconnect if no pong in 5s. Verify: stale clients cleaned up.
- [ ] 4.5 Implement reconnection: client sends `from_sequence` on reconnect, server replays missed events. Verify: no gaps after reconnect.

## 5. Dashboard Page

- [ ] 5.1 Create dashboard route (`/`) with SSR: session summary stats (total, active, completed, failed). Verify: page renders with counts.
- [ ] 5.2 Create session list component: table of sessions with id, state, created_at, event count, last event type. Verify: sessions listed correctly.
- [ ] 5.3 Create capability health panel: list of capabilities with name, version, initialized, last error. Verify: capabilities displayed.
- [ ] 5.4 Create recent events feed: last 20 events across all sessions in reverse chronological order. Verify: events displayed.
- [ ] 5.5 Create Fresh island for real-time updates: dashboard auto-refreshes via WebSocket. Verify: new events appear without page reload.

## 6. Session Inspector Page

- [ ] 6.1 Create session detail route (`/sessions/:id`) with SSR: session state, metadata, event timeline. Verify: page renders session data.
- [ ] 6.2 Create event timeline component: scrollable list of events with sequence number, timestamp, type, payload summary. Verify: events listed in order.
- [ ] 6.3 Create event detail panel: click event → full JSON payload displayed. Verify: payload shown on click.
- [ ] 6.4 Create event type filter: checkboxes for event types, filters timeline. Verify: only matching events shown.
- [ ] 6.5 Create Fresh island for real-time session events: new events appended to timeline live. Verify: events stream in real time.

## 7. Styling and Layout

- [ ] 7.1 Create base layout component: header with harness name, navigation (Dashboard, Sessions, Capabilities). Verify: layout renders on all pages.
- [ ] 7.2 Style dashboard with CSS: summary cards, session table, capability list, event feed. Verify: pages are readable and organized.
- [ ] 7.3 Style session inspector: timeline layout, event cards, detail panel. Verify: inspector is usable.

## 8. Tests

- [ ] 8.1 Write EventStream subscription tests: onAppend fires, unsubscribe works, session-scoped filtering. Verify: all tests pass.
- [ ] 8.2 Write API route tests: /api/sessions, /api/sessions/:id, /api/sessions/:id/events, /api/capabilities, /api/health. Verify: all endpoints return correct data.
- [ ] 8.3 Write WebSocket tests: connection, event delivery, filtering, heartbeat, reconnection. Verify: all tests pass.
- [ ] 8.4 Write integration test: start harness → create session → append events → verify via API and WebSocket. Verify: end-to-end flow works.
- [ ] 8.5 Verify existing 112+ tests still pass. Verify: `deno test` passes.
