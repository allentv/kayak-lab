## Why

The harness is a library of modules with no application entry point. There's no way to observe what's happening — sessions, events, agent state, capability execution — without reading test output. A Web UI embedded in the harness process provides real-time visibility and becomes the first runnable application.

Additionally, this UI establishes the foundation for visual verification of harness changes — seeing events flow in real time makes it possible to confirm behavior without inspecting logs.

## What Changes

Embed a Fresh (Deno) web server into the harness process, serving a monitoring dashboard with real-time event streaming.

- **Fresh server**: Embedded in the harness process, shares in-memory state (EventStream, SessionManager, etc.)
- **Dashboard page**: Overview of active sessions, capability health, recent events
- **Session inspector**: Per-session event timeline with filtering and detail view
- **Real-time event stream**: WebSocket endpoint pushing events as they occur
- **Capability health panel**: Status of registered capabilities (initialized, healthy, error)
- **REST API**: Programmatic access to sessions, events, and harness state
- **Harness entry point**: `main.ts` that wires harness components and starts the Fresh server

### New Capabilities

- `projection/web`: Fresh-based Web UI for real-time harness monitoring

### Modified Capabilities

- `core/event-stream`: Add `onAppend(callback)` subscription API (currently missing, noted in EventStoreBridge TODO)

## Capabilities

### New Capabilities

- `projection/web`: Web monitoring dashboard with real-time event streaming, session inspector, capability health

### Modified Capabilities

- `core/event-stream`: Event subscription API for real-time push to WebSocket clients
