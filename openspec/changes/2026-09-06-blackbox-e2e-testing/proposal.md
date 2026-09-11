## Why

The harness has zero blackbox E2E tests. The existing "e2e" tests import modules directly (whitebox integration tests) — they can't verify the HTTP API, WebSocket framing, or CORS behavior that users actually hit. When a user reports a bug, we have no way to reproduce their exact scenario end-to-end.

## What Changes

- **New test infrastructure**: Helper library for starting the harness as a subprocess, making typed HTTP requests, and connecting WebSocket clients — all without importing from `src/`.
- **HTTP API E2E tests**: Blackbox tests covering `/api/health`, `/api/sessions`, `/api/sessions/:id`, `/api/sessions/:id/events`, `/api/sessions/:id/messages`, `/api/capabilities`, CORS preflight, and invalid state transitions.
- **WebSocket E2E tests**: Blackbox tests covering connection lifecycle, event subscription, session/type filtering, reconnection with gap recovery, heartbeat, and malformed message handling.
- **Fixture format**: Canonical JSON format in `fixtures/sessions/` for exporting and replaying user event histories.

## Capabilities

### New Capabilities
- `e2e-testing/test-infrastructure`: Subprocess lifecycle, typed HTTP client, and WebSocket client for blackbox testing of the harness.
- `e2e-testing/http-api`: E2E tests verifying the HTTP API surface — health, sessions CRUD, event queries, capabilities, CORS, session state machine validation, message sending, event pagination, concurrent session isolation, and WebSocket connection lifecycle.

### Modified Capabilities
None. No existing specs change — this adds new test infrastructure alongside existing whitebox tests.
