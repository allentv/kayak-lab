## Context

The harness (`src/main.ts`) is a Deno HTTP server exposing REST + WebSocket endpoints. The existing "E2E" test (`e2e-session-lifecycle.test.ts`) imports modules directly — it tests internal APIs, not the HTTP surface users actually interact with.

See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- True blackbox testing: no imports from `src/`
- Start the harness as a subprocess, interact via HTTP/WS
- Typed test helpers for reuse across HTTP, WebSocket, and replay tests
- Parallel-safe: each test file gets its own server on a unique port
- Fixture format for replaying user-reported bugs

**Non-Goals (this change):**
- WebSocket E2E tests (deferred to follow-up)
- Event history replay tests (deferred to follow-up)
- CI integration (tests exist; CI wiring is separate)
- Performance/benchmark E2E tests

## Decisions

### D1: Subprocess over in-process server

**Decision:** Start the harness via `Deno.Command` running `deno run -A src/main.ts --port <N>`.

**Alternatives considered:**
- Import `createRouter` + `initializeHarness` and wrap in `Deno.serve` — graybox, skips process startup, HTTP framing, and WebSocket upgrade path. Faster but less faithful.
- Use `Deno.serve` directly with the router — same graybox concern.

**Rationale:** Subprocess gives a true blackbox guarantee. The ~1-2s cold boot cost is acceptable for E2E tests. The helper library abstracts the lifecycle.

### D2: Random port allocation

**Decision:** Helper picks a random port in [30000, 40000) and verifies availability with `Deno.listen({ port })` + immediate close before spawning.

**Alternatives considered:**
- Fixed port per test file — fragile, breaks parallel runs.
- Port 0 with OS assignment — `Deno.Command` doesn't expose the actual bound port.

**Rationale:** Random high port minimizes collision risk. Verification step prevents bind failures.

### D3: Readiness polling with exponential backoff

**Decision:** After spawning, poll `GET /api/health` starting at 100ms intervals, doubling up to 5 retries (max wait ~3.1s).

**Rationale:** Deno subprocess startup varies by machine. Exponential backoff avoids tight-loop polling while staying responsive. 5 retries covers slow cold starts without hanging indefinitely.

### D4: Test file structure

**Decision:**
```
src/__tests__/_helpers/
  harness-process.ts    ← start/stop/wait
  harness-client.ts     ← typed HTTP client
  ws-client.ts          ← WebSocket client (later)

src/__tests__/
  e2e-http-api.test.ts  ← HTTP API tests (this change)
```

**Rationale:** `_helpers/` directory with underscore prefix signals internal test utilities (Deno test runner convention). Each helper has a single responsibility. `ws-client.ts` stubbed but not implemented until WebSocket tests.

### D5: Fixtures in `fixtures/sessions/`

**Decision:** Session event histories stored as JSON files in `fixtures/sessions/`, keyed by session ID, containing the full event array.

**Format:**
```json
{
  "session": { "id": "...", "state": "completed", "description": "..." },
  "events": [ { "event_type": "...", "sequence_number": 1, ... } ]
}
```

**Rationale:** Matches existing fixture directory. JSON is easy to export from `GET /api/sessions/:id` and human-readable for debugging.

### D6: Deno.test with serial execution per file

**Decision:** Use `Deno.test` with subtests (`t.step`). Each test file manages one server instance via `beforeAll`/`afterAll` (Deno's `t.step` doesn't have global hooks — use a setup pattern with module-level state).

**Alternatives considered:**
- One server per test — too slow, redundant setup.
- Global test server — breaks parallel file execution.

**Rationale:** One server per file is the right granularity. Module-level server state + `Deno.test` with subtests keeps setup/teardown clean.

## Risks / Trade-offs

- **Startup latency**: Each test file pays ~1-2s for subprocess boot. Acceptable for E2E; mitigated by one server per file, not per test.
- **Port collisions**: Random port allocation has theoretical collision risk. Mitigated by verification step. In practice, ephemeral ports are plentiful.
- **Fixture staleness**: Exported event histories may drift from harness behavior. Mitigated by treating fixtures as snapshots of known-good scenarios, not dynamic data.
- **No beforeAll/afterAll**: Deno doesn't have Jest-style global hooks. Pattern: module-level `let server: HarnessProcess` initialized in first `Deno.test` or use top-level await in the test module. Deno supports top-level await — use that.
