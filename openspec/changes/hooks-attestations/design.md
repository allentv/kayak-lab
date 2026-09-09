## Context

Phase 1 delivered the provenance graph — an in-memory causal trace of agent reasoning. Phase 2 adds two capabilities that build on it: (a) a hook system for extensible runtime behavior, and (b) session attestations for cost/performance tracking. Both depend on the agent loop and session lifecycle, which are the most sensitive parts of the runtime.

## Goals / Non-Goals

**Goals:**
- Hook registry with registration, dispatch, timeout, error isolation
- Five lifecycle points wired into AgentRuntime
- Session attestation event on completion with model breakdown and cost
- REST API for attestation and provenance queries

**Non-Goals:**
- Context assembly changes (Phase 3)
- Real-time attestation streaming
- External daemon for hooks
- Cryptographic attestation signatures

## Decisions

### D1: Hook Dispatch as Sequential with Timeout

**Decision:** Hooks at each lifecycle point are called sequentially (registration order) with a per-hook timeout (default 5000ms). Errors are caught and logged, never propagated.

**Rationale:** Sequential preserves ordering (policy hooks before logging hooks). Timeout prevents slow hooks from blocking the agent loop. Error isolation means a broken hook never crashes the runtime. In-process calls (~1-5μs) are negligible against model call latency (200ms-2s).

**Alternatives:** Parallel dispatch (Promise.all) — faster but ordering unpredictable; message queue — overkill for in-process.

### D2: Attestation as Event, Not Separate Storage

**Decision:** Attestations are `session.attestation` events through EventStream. Stored in EventStore. Queryable via EventQueryEngine.

**Rationale:** No new storage layer. Attestations are naturally part of the event sequence. Backward-compatible with existing query infrastructure.

**Alternatives:** Separate attestation store (duplicates persistence); embedded in session state (loses event-sourcing).

### D3: Hook Registry In-Process, Not Daemon

**Decision:** Hooks are async functions called in-process. No IPC, no message queue, no external process.

**Rationale:** Simplicity. Hooks are fast (~1-5μs). No deployment complexity. If a hook needs external communication, it can make its own network call inside the async function.

**Alternatives:** External daemon (deployment complexity); message queue (latency, dependency).

### D4: Provenance API Routes on Existing REST Server

**Decision:** Add routes to existing `src/projection/rest-api.ts` router. No new server.

**Rationale:** Same server, same CORS, same auth. Just new routes. Minimal code change.

**Alternatives:** Separate API server (deployment complexity); GraphQL (overkill for 3 endpoints).

### D5: Cost Calculation with Configurable Pricing Table

**Decision:** Pricing data in config YAML. Cost calculated at attestation creation time. Missing pricing → null cost, not zero.

**Rationale:** Prices change; config is the right place. Null (not zero) signals "unknown" to consumers. Calculation at creation time avoids repeated computation.

**Alternatives:** Hardcoded prices (can't update without code change); API lookup (latency, external dependency).

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|---|---|---|
| Hook timeout terminates fast hook | Low — default 5s is generous | Configurable per-hook; log warnings |
| Agent loop complexity increase | Medium — more code paths | Hooks are fire-and-forget; error isolation; tests cover each lifecycle point |
| Cost calculation with missing pricing | Low — null cost, not wrong cost | Explicit null handling in API responses |
| REST API backward compat | Low — new routes only | No existing routes modified |
