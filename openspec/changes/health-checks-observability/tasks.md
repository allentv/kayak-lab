## 1. Health System Core

- [ ] 1.1 Implement `HealthRegistry` with `register(name, checkFn)`, `deregister(name)`, `check()` methods. Verify: components register and health check returns their status.
- [ ] 1.2 Implement `check()` that runs all registered health checks in parallel with 1s timeout per check. Returns aggregate status (healthy/degraded/unhealthy). Verify: parallel execution, timeout handling.

## 2. HTTP Endpoints

- [ ] 2.1 Implement `GET /health` endpoint returning full health status with component details. Verify: 200 on healthy, 503 on unhealthy.
- [ ] 2.2 Implement `GET /ready` endpoint returning readiness status. Verify: 200 when ready, 503 when not ready.
- [ ] 2.3 Implement `GET /alive` endpoint returning liveness status. Verify: 200 when alive.

## 3. Component Health Checks

- [ ] 3.1 Register EventStore health check: verify store is accessible and has no corruption. Verify: check returns healthy on working store.
- [ ] 3.2 Register Capability health checks: verify each capability is initialized and responsive. Verify: check returns healthy on initialized capabilities.
- [ ] 3.3 Register WebSocket server health check: verify server is listening. Verify: check returns healthy when server is running.

## 4. Structured Error Responses

- [ ] 4.1 Define `ErrorResponse` type: `{ error: { code, message, details?, timestamp } }`. Verify: type compiles.
- [ ] 4.2 Implement `errorResponse(code, message, details?)` helper that creates consistent error responses. Verify: response matches format.
- [ ] 4.3 Update existing API error responses to use structured format. Verify: all error responses follow format.

## 5. Tests

- [ ] 5.1 Write health registry tests: register, deregister, check, timeout. Verify: all tests pass.
- [ ] 5.2 Write endpoint tests: /health, /ready, /alive responses. Verify: all tests pass.
- [ ] 5.3 Write component health tests: registration, check execution, failure handling. Verify: all tests pass.
- [ ] 5.4 Write error response tests: format consistency, validation errors. Verify: all tests pass.
- [ ] 5.5 Verify existing 112+ tests still pass. Verify: `deno test` passes.
