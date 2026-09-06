## Context

The harness is a collection of modules: EventStream, SessionManager, AgentRuntime, Capabilities, ProjectionProtocol, EventStore. There's no application entry point. The EventStoreBridge has a TODO noting that EventStream lacks a subscribe/observe API — events appended after `connect()` are not automatically propagated. The `ProjectionProtocol` uses polling (100ms interval) to detect new events.

Multiple harness instances may run simultaneously (different sessions, environments, or test scenarios). A single Web UI should aggregate all of them into one dashboard.

The Fresh web framework is Deno-native with SSR, islands architecture, and no build step — matching the harness's Deno/TypeScript stack.

## Goals / Non-Goals

**Goals:**
- Harness runs headless with API + WebSocket endpoints (no Fresh dependency)
- Fresh Web UI is a separate process connecting to one or more harnesses
- Aggregated dashboard showing all harnesses, sessions, events, capabilities
- Real-time event streaming from each harness via WebSocket
- Single UI instance monitoring multiple harness instances

**Non-Goals:**
- Authentication/authorization (future cross-cutting concern)
- Persistent storage (future persistence-layer change)
- User input / agent interaction via UI (future verification-engine change)
- Harness-to-harness communication
- Load balancing or proxying

## Decisions

### 1. Separate processes: harness headless + Fresh UI

**Decision:** Harness runs without Fresh (`--no-web`). Fresh UI is a separate `web/` application.

**Rationale:**
- Clean separation of concerns: runtime vs. monitoring
- Multiple harnesses, one UI — the UI aggregates
- Harness has no UI dependency (smaller footprint for CI/tests)
- UI can be restarted without restarting harnesses
- Each harness exposes API + WebSocket for the UI to connect to

**Alternatives considered:**
- Embedded Fresh (Option C): Each harness has its own UI. Fragmented with multiple instances.
- Shared UI with harness registry: UI discovers harnesses automatically. Adds complexity.

### 2. Harness exposes HTTP/WebSocket in headless mode

**Decision:** Even with `--no-web`, the harness starts an HTTP server with API routes and WebSocket endpoint.

**Rationale:**
- The UI needs network access to the harness
- API routes enable programmatic access (CI, scripts, verification engine)
- WebSocket enables real-time event streaming
- Same endpoints work in both headless and embedded modes

### 3. UI connects to harnesses via `--connect` flag

**Decision:** UI accepts comma-separated harness URLs via `--connect` flag or `HARNESS_URLS` env var.

**Rationale:**
- Explicit configuration — no auto-discovery complexity
- Supports multiple harnesses: `--connect localhost:9001,localhost:9002`
- Env var for CI: `HARNESS_URLS=localhost:9001,localhost:9002`

### 4. EventStream.onAppend() for real-time push

**Decision:** Add `onAppend(callback)` to EventStream for real-time push to WebSocket.

**Rationale:**
- Currently missing (noted in EventStoreBridge TODO)
- Required for WebSocket real-time delivery without polling
- Simple callback pattern — no pub/sub framework needed

### 5. WebSocket at `/ws/events` on harness

**Decision:** Single WebSocket endpoint on the harness with client-side filtering.

**Rationale:**
- One connection per UI client per harness
- Filter via subscribe messages
- Simple, consistent with WebSocket projection spec

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               SEPARATE PROCESS ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Fresh Web UI (web/main.ts)                  │   │
│  │          port 8000                                   │   │
│  │                                                     │   │
│  │  Aggregation layer:                                 │   │
│  │  ├─ Connects to N harnesses via WebSocket           │   │
│  │  ├─ Merges session lists, events, capabilities      │   │
│  │  └─ Serves dashboard + session inspector            │   │
│  │                                                     │   │
│  │  Outbound connections:                              │   │
│  │  ├─ ws://harness-a:9001/ws/events                   │   │
│  │  ├─ ws://harness-b:9002/ws/events                   │   │
│  │  └─ ws://harness-c:9003/ws/events                   │   │
│  └─────────────────────────────────────────────────────┘   │
│          │                  │                  │             │
│  ┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐     │
│  │  Harness A   │  │  Harness B   │  │  Harness C   │     │
│  │  --no-web    │  │  --no-web    │  │  --no-web    │     │
│  │  :9001       │  │  :9002       │  │  :9003       │     │
│  │              │  │              │  │              │     │
│  │  EventStream │  │  EventStream │  │  EventStream │     │
│  │  + onAppend  │  │  + onAppend  │  │  + onAppend  │     │
│  │  + /api/*    │  │  + /api/*    │  │  + /api/*    │     │
│  │  + /ws/events│  │  + /ws/events│  │  + /ws/events│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

### Risk: Network latency for event streaming

**Impact:** Low — localhost WebSocket is sub-millisecond. Remote harnesses add network latency but agent interactions are already network-bound (model API calls).

**Mitigation:** Document that UI and harnesses should be on the same machine for real-time monitoring.

### Risk: UI process crash loses monitoring, not harness state

**Impact:** Low — harness continues running. UI can be restarted and reconnects.

**Mitigation:** Reconnection with event gap recovery (from_sequence).

### Risk: Multiple WebSocket connections per harness

**Impact:** Low — each UI client opens one connection per harness. Few concurrent users.

**Mitigation:** Connection limit on harness if needed.

### Risk: Harness API exposure without auth

**Impact:** Medium — any process on the machine can query the harness API.

**Mitigation:** Acceptable for development tool. Auth is a future cross-cutting concern.
