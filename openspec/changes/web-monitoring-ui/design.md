## Context

The harness is a collection of modules: EventStream, SessionManager, AgentRuntime, Capabilities, ProjectionProtocol, EventStore. There's no application entry point. The EventStoreBridge has a TODO noting that EventStream lacks a subscribe/observe API — events appended after `connect()` are not automatically propagated. The `ProjectionProtocol` uses polling (100ms interval) to detect new events. The terminal projection renders events locally via the projection protocol.

The Fresh web framework is Deno-native with SSR, islands architecture, and no build step — matching the harness's Deno/TypeScript stack.

## Goals / Non-Goals

**Goals:**
- Embedded Fresh server in the harness process with shared in-memory state
- Real-time event streaming via WebSocket
- Dashboard overview of sessions, capabilities, and recent events
- Per-session event timeline with filtering and detail view
- REST API for programmatic access
- Harness entry point (`main.ts`) that wires everything

**Non-Goals:**
- Authentication/authorization (future cross-cutting concern)
- Persistent storage (future persistence-layer change)
- User input / agent interaction via UI (future verification-engine change)
- Multiple tabs/windows synchronization
- Mobile-responsive design (desktop-first)

## Decisions

### 1. Fresh (Deno) as web framework

**Decision:** Use Fresh for the web server and UI rendering.

**Rationale:**
- Deno-native — same runtime as the harness, no Node.js dependency
- SSR by default — fast initial page loads
- Islands architecture — interactive parts hydrated on client, rest stays server-rendered
- No build step — starts instantly, no webpack/vite overhead
- TypeScript native — shares types with the harness

**Alternatives considered:**
- Oak (Deno HTTP framework): More manual work for SSR and routing
- Hono: Lightweight but less SSR support
- React + Vite: Requires Node.js build step, separate from Deno runtime

### 2. Harness embeds Fresh (Option C)

**Decision:** The harness process starts Fresh as an embedded server. Shared in-memory state — no IPC.

**Rationale:**
- Zero serialization overhead for event streaming
- Direct access to EventStream, SessionManager, Capabilities
- Single process to start, debug, and deploy
- Web UI is a view layer over the harness, not a separate service

**Alternatives considered:**
- Separate processes: Adds IPC complexity, latency for real-time events
- Harness imports Fresh directly: Same as embedding, but cleaner boundary

### 3. EventStream subscription API

**Decision:** Add `onAppend(callback)` to EventStream for real-time push.

**Rationale:**
- Currently missing (noted in EventStoreBridge TODO)
- Required for WebSocket real-time delivery without polling
- Simple callback pattern — no pub/sub framework needed
- ProjectionProtocol can be refactored to use this instead of polling

**Alternatives considered:**
- Keep polling (ProjectionProtocol pattern): Adds 100ms latency, wastes CPU
- EventEmitter pattern: Overkill for single-process callback

### 4. WebSocket at `/ws/events`

**Decision:** Single WebSocket endpoint with client-side filtering via messages.

**Rationale:**
- One connection per client, filter via subscribe messages
- Simpler than multiple endpoints per session/type
- Consistent with the WebSocket projection spec (separate change)

### 5. Fresh islands for interactivity

**Decision:** Pages are server-rendered; interactive components (event stream, filters) are Fresh islands.

**Rationale:**
- Fast initial load (SSR)
- Interactive parts hydrate on client
- Clear separation: server owns data, client owns interaction

## Risks / Trade-offs

### Risk: Fresh and harness version coupling

**Impact:** Low — both are Deno-native, version pinning via import maps.

**Mitigation:** Pin Fresh version. Test harness startup with Fresh embedded.

### Risk: Single process — crash affects both harness and UI

**Impact:** Medium — if the harness crashes, the UI goes down.

**Mitigation:** This is acceptable for a development/monitoring tool. Production deployments would use separate processes.

### Risk: Memory usage with many events

**Impact:** Low — events are stored in EventStream (in-memory). UI is a view, not a store.

**Mitigation:** Pagination on API endpoints. WebSocket filtering reduces delivery volume.

### Risk: WebSocket connection management

**Impact:** Low — agent platform has few concurrent users (developers).

**Mitigation:** Heartbeat and timeout for cleanup. Connection limit if needed.
