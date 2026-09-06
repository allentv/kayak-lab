## Context

The projection protocol and terminal projection are implemented. The WebSocket transport (separate change) provides the network layer. These projections build on top of the WebSocket and terminal projections to deliver agent interactions to specific UI environments.

## Goals / Non-Goals

**Goals:**
- Provide projections for VS Code, Web, Desktop, and REST API surfaces
- Each projection renders events appropriately for its environment
- Leverage the WebSocket projection for real-time delivery where applicable
- REST API provides both synchronous and asynchronous access patterns

**Non-Goals:**
- Mobile app projections (iOS, Android)
- Building the actual Tauri desktop shell (just the projection logic)
- Building the actual VS Code extension packaging (just the projection logic)
- Authentication implementation (future cross-cutting concern)

## Decisions

### 1. VS Code: Extension API pattern

**Decision:** Follow VS Code extension conventions — TreeView, OutputChannel, StatusBar.

**Rationale:**
- Native VS Code feel — users expect these patterns
- Well-documented VS Code API
- TreeView for sessions, OutputChannel for events, StatusBar for status

**Alternatives considered:**
- Webview-based UI: More flexible but heavier, less native feel

### 2. Web: React/SPA with WebSocket

**Decision:** Build the web UI as a single-page app that connects to the WebSocket projection.

**Rationale:**
- Reuses the WebSocket transport layer
- Standard web technology stack
- Can be embedded in other surfaces (VS Code webview, Electron)

**Alternatives considered:**
- Server-rendered: Less interactive, higher latency for real-time updates

### 3. Desktop: Tauri wrapping Web UI

**Decision:** Use Tauri to wrap the Web UI with native OS integration.

**Rationale:**
- Reuses the Web UI code
- Tauri is lightweight (Rust backend, web frontend)
- Native system tray, notifications, global shortcuts

**Alternatives considered:**
- Electron: Heavier, more memory usage
- Native toolkit (Slint, Iced): More work, less code reuse

### 4. REST API: Express-style HTTP endpoints

**Decision:** Implement REST API as HTTP endpoints using Deno's built-in HTTP server.

**Rationale:**
- Standard REST pattern familiar to developers
- Easy to integrate with CI/CD, scripts, automation
- Supports both sync and async (202 Accepted) patterns

**Alternatives considered:**
- GraphQL: More flexible but more complex for this use case
- gRPC: Better performance but less accessible for web/CLI clients

## Risks / Trade-offs

### Risk: VS Code extension API changes

**Impact:** Low — VS Code API is stable. Extensions are versioned.

**Mitigation:** Pin to minimum VS Code version. Test against latest stable.

### Risk: Web UI bundle size

**Impact:** Low — SPA bundles are acceptable for desktop/web.

**Mitigation:** Lazy loading, code splitting. Tauri handles native bundling.

### Risk: REST API versioning

**Impact:** Medium — API changes can break clients.

**Mitigation:** Version the API (`/api/v1/`). Deprecation headers for breaking changes.
