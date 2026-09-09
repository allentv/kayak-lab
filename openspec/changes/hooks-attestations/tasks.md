## 1. Hook System Core

- [ ] 1.1 Create `src/runtime/hooks.ts` with HookRegistry class: `register(hookPoint, fn)`, `unregister(hookId)`, `getHooks(hookPoint)`. Verify: unit test — register returns id, unregister removes hook, getHooks returns correct list.
- [ ] 1.2 Add `dispatch(hookPoint, context)` to HookRegistry: calls hooks in registration order, passes context, returns void. Verify: unit test — 3 hooks called in order, context passed correctly.
- [ ] 1.3 Add timeout enforcement: per-hook timeout (default 5000ms). Slow hook terminated, logged, runtime continues. Verify: unit test — hook exceeding timeout is killed; subsequent hooks still fire.
- [ ] 1.4 Add error isolation: hook errors caught, logged, not propagated. Verify: unit test — throwing hook doesn't crash dispatch; error logged; subsequent hooks still fire.
- [ ] 1.5 Add session-scoped vs global hooks: hooks registered with session ID only fire for that session. Verify: unit test — session-scoped hook doesn't fire for other sessions; global hook fires for all.

## 2. AgentRuntime Hook Integration

- [ ] 2.1 Define HookPoint enum: `before_model_call`, `after_tool_execution`, `turn_end`, `session_start`, `session_end`. Verify: enum compiles, all values are unique.
- [ ] 2.2 Wire hooks into AgentRuntime `runLoop()`: dispatch at each lifecycle point. Verify: integration test — register hook at each point, run 2-turn session, assert each hook fired correct number of times.
- [ ] 2.3 `before_model_call` receives mutable context: hook can modify messages. Verify: integration test — hook adds a message to context, model sees the added message.
- [ ] 2.4 `after_tool_execution` receives tool details: name, params, result, session state. Verify: integration test — hook captures tool call details, asserts correctness.
- [ ] 2.5 Hot-registration: register hook after runtime start, verify it fires on next invocation. Verify: integration test — register hook mid-session, next turn triggers it.

## 3. Session Attestations

- [ ] 3.1 Add attestation aggregation to SessionManager: on session end, collect model usage events, compute per-model token counts and cost. Verify: unit test — mock model events, assert aggregation matches manual calculation.
- [ ] 3.2 Define AttestationEvent type: session_id, duration_ms, models[], total_cost_usd, files_changed, provenance_summary. Verify: type compiles, event can be created and serialized.
- [ ] 3.3 Emit `session.attestation` event on session completion. Verify: integration test — complete session, assert attestation event exists in EventStore with correct data.
- [ ] 3.4 Add `getAttestation(sessionId)` and `getAttestations(filters)` to EventQueryEngine. Verify: unit test — query returns correct attestation; filtered query returns subset.
- [ ] 3.5 Cost calculation: per-model cost from pricing table. Missing pricing → null. Cumulative across calls. Verify: unit test — cost matches (tokens × price); null when pricing missing; aggregation across 3 calls.

## 4. REST API

- [ ] 4.1 Add `GET /api/sessions/:id/attestation` route. Returns attestation JSON or 404. Verify: e2e test — create session, complete it, GET attestation returns 200 with data; GET for incomplete session returns 404.
- [ ] 4.2 Add `GET /api/attestations` route. Returns list sortable by cost/duration/date. Verify: e2e test — create 3 sessions, GET attestations returns all 3; sort by cost returns correct order.
- [ ] 4.3 Add `GET /api/sessions/:id/provenance` route. Returns graph or 404. Verify: e2e test — session with provenance returns graph JSON; session without returns 404.
- [ ] 4.4 Add `GET /api/sessions/:id/provenance/nodes?type=goal` route. Returns filtered nodes. Verify: e2e test — filter by type returns only matching nodes.
- [ ] 4.5 Add `GET /api/sessions/:id/provenance/chain/:nodeId` route. Returns causal chain. Verify: e2e test — chain from node returns correct path from Goal to node.

## 5. Testing Pyramid Validation

- [ ] 5.1 Unit test suite: hook registry (register, unregister, dispatch, timeout, errors), attestation aggregation, cost calculation. Run `deno test src/runtime/hooks.ts src/session/` — all pass.
- [ ] 5.2 Integration test: full agent loop with hooks at all 5 lifecycle points. Assert correct firing order, context mutation, error isolation.
- [ ] 5.3 Integration test: session end → attestation emitted → attestation queryable. Full lifecycle with provenance graph present.
- [ ] 5.4 E2E test: HTTP API — create session, run turns, complete, query attestation and provenance. Assert correct responses.
- [ ] 5.5 Edge cases: session cancelled (not completed), no model calls in session, no tool calls in session, session with only failed tool calls.
- [ ] 5.6 Performance: hook dispatch with 10 registered hooks (<50μs total); attestation creation for 50-turn session (<10ms).
- [ ] 5.7 Backward compat: run existing test suite with hooks and attestations wired in — all existing tests pass.
