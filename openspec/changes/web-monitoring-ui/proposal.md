## Why

The harness is a library of modules with no application entry point. There's no way to observe what's happening — sessions, events, agent state, capability execution — without reading test output. A Web UI provides real-time visibility and becomes the foundation for visual verification of harness behavior.

Multiple harness instances may run simultaneously (different sessions, environments, or test scenarios). A single Web UI should aggregate all of them into one dashboard, rather than requiring a separate UI per harness.

## What Changes

Separate the harness (headless runtime) from the Web UI (monitoring dashboard). The harness runs headless with API + WebSocket endpoints. The Fresh Web UI is a separate process that connects to one or more harnesses and aggregates their state.

- **Harness headless mode**: `--no-web` flag runs the harness without Fresh, exposing API + WebSocket endpoints for the UI to connect to
- **Harness entry point**: `main.ts` that wires harness components and starts HTTP/WebSocket server
- **Fresh Web UI**: Separate `web/` application that connects to harness instances via WebSocket
- **Dashboard page**: Aggregated overview of all connected harnesses — sessions, capabilities, events
- **Session inspector**: Per-session event timeline with filtering and detail view
- **Real-time event stream**: WebSocket connection to each harness, events pushed as they occur
- **Capability health panel**: Status of registered capabilities across all harnesses
- **REST API**: Programmatic access to sessions, events, and harness state

### New Capabilities

- `projection/web`: Fresh-based Web UI for real-time harness monitoring (separate process)

### Modified Capabilities

- `core/event-stream`: Add `onAppend(callback)` subscription API (currently missing, noted in EventStoreBridge TODO)

## Capabilities

### New Capabilities

- `projection/web`: Web monitoring dashboard — separate Fresh app connecting to multiple harness instances

### Modified Capabilities

- `core/event-stream`: Event subscription API for real-time push to WebSocket clients
