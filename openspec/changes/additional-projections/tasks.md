## 1. VS Code Projection

- [ ] 1.1 Define VS Code projection interface: `IVSCodeProjection` with `renderEvent()`, `updateSessionList()`, `updateStatusBar()`. Verify: interface compiles.
- [ ] 1.2 Implement session tree data provider that lists active sessions. Verify: tree view shows sessions.
- [ ] 1.3 Implement output channel event renderer with syntax highlighting for event types. Verify: events render with color coding.
- [ ] 1.4 Implement status bar item that shows agent state (active/idle/error). Verify: status bar updates on state changes.
- [ ] 1.5 Wire VS Code projection to WebSocket client for real-time event delivery. Verify: events stream in real time.

## 2. Web Projection

- [ ] 2.1 Define web projection interface: `IWebProjection` with session list, event view, user input. Verify: interface compiles.
- [ ] 2.2 Implement session list component that fetches sessions from REST API. Verify: sessions displayed.
- [ ] 2.3 Implement event log component that renders events from WebSocket stream. Verify: events stream in real time.
- [ ] 2.4 Implement user input component that sends messages via WebSocket. Verify: messages sent and responses received.
- [ ] 2.5 Implement event detail panel for inspecting full event payloads. Verify: clicking event shows details.

## 3. Desktop Projection

- [ ] 3.1 Define desktop projection interface: `IDesktopProjection` with tray, notifications, shortcuts. Verify: interface compiles.
- [ ] 3.2 Implement system tray icon with context menu (Open, New Session, Quit). Verify: tray icon visible, menu works.
- [ ] 3.3 Implement native notification on agent completion and errors. Verify: notifications appear on events.
- [ ] 3.4 Implement global keyboard shortcuts (Ctrl+Shift+A for new session, Ctrl+Shift+I for input). Verify: shortcuts trigger actions.

## 4. REST API Projection

- [ ] 4.1 Define REST API routes: `GET/POST/DELETE /api/sessions`, `GET /api/sessions/:id/events`, `POST /api/sessions/:id/messages`. Verify: routes compile.
- [ ] 4.2 Implement session CRUD endpoints. Verify: create, list, get, delete sessions via HTTP.
- [ ] 4.3 Implement event list endpoint with pagination. Verify: events returned in order with pagination.
- [ ] 4.4 Implement message endpoint with sync and async (202) response modes. Verify: messages processed, responses returned.
- [ ] 4.5 Implement API key authentication middleware. Verify: 401 on missing/invalid key.

## 5. Tests

- [ ] 5.1 Write VS Code projection unit tests with mock VS Code API. Verify: all tests pass.
- [ ] 5.2 Write web projection tests with mock WebSocket and REST responses. Verify: all tests pass.
- [ ] 5.3 Write desktop projection tests with mock Tauri APIs. Verify: all tests pass.
- [ ] 5.4 Write REST API integration tests using Deno test HTTP client. Verify: all endpoints tested.
- [ ] 5.5 Verify existing 112+ tests still pass. Verify: `deno test` passes.
