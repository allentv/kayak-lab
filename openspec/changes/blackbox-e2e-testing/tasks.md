## 1. Test Infrastructure: Subprocess Helper

- [ ] 1.1 Create `src/__tests__/_helpers/harness-process.ts` with `start(port)` that spawns `deno run -A src/main.ts --port <port>` via `Deno.Command`, polls `/api/health` with exponential backoff (100ms, 5 retries), and `stop()` that sends SIGTERM and waits for exit. Verify: `deno test --allow-read --allow-env --allow-net --allow-run` with a smoke test that starts and stops the server.
- [ ] 1.2 Add `findFreePort()` utility that picks a random port in [30000, 40000), verifies availability with `Deno.listen`, and returns it. Verify: unit test that 100 consecutive calls never return duplicates and all ports are in range.

## 2. Test Infrastructure: HTTP Client

- [ ] 2.1 Create `src/__tests__/_helpers/harness-client.ts` with typed methods: `getHealth()`, `getSessions()`, `getSession(id)`, `getSessionEvents(id, opts?)`, `getCapabilities()`. Each returns parsed JSON; 404 responses throw with status. Verify: smoke test calling `getHealth()` against a running server returns `{ status: "ok" }`.
- [ ] 2.2 Add `options(url)` method for CORS preflight testing that returns status and headers. Verify: `options("/api/health")` returns status 204 with `Access-Control-Allow-Origin: *`.

## 3. HTTP API E2E Tests

- [ ] 3.1 Create `src/__tests__/e2e-http-api.test.ts` with top-level setup that starts the server on a random port and teardown that stops it. Verify: test file runs without timeout and server starts cleanly.
- [ ] 3.2 Add health endpoint tests: correct shape on fresh start, `uptime >= 1` after 1s delay. Verify: `deno test src/__tests__/e2e-http-api.test.ts --allow-read --allow-env --allow-net --allow-run` passes.
- [ ] 3.3 Add sessions list tests: empty on fresh start, reflects created sessions with `event_count >= 1`. Verify: tests pass.
- [ ] 3.4 Add session lifecycle test: create → pause → resume → complete, verify state transitions and event history ordering. Verify: test passes and event sequence matches expected types.
- [ ] 3.5 Add session 404 test: `getSession(invalidId)` returns 404 with error message. Verify: test passes.
- [ ] 3.6 Add session event query tests: type filter returns only matching events, limit returns most recent N. Verify: tests pass.
- [ ] 3.7 Add capabilities test: returns at least Git and Shell capabilities with `initialized` field. Verify: test passes.
- [ ] 3.8 Add CORS tests: OPTIONS preflight returns 204 with CORS headers, GET responses include `Access-Control-Allow-Origin: *`. Verify: tests pass.

## 4. Fixture Format

- [ ] 4.1 Create `fixtures/sessions/README.md` documenting the fixture schema: `{ session: { id, state, description }, events: [...] }`. Verify: README exists and describes the format.
- [ ] 4.2 Export `fixtures/sessions/basic.json` from a live server by creating a session, completing it, and saving `GET /api/sessions/:id` response. Verify: file is valid JSON matching the documented schema.
