## Why

Phase 1 delivered the provenance graph — now we need to (a) make the agent runtime extensible so external modules can observe and react to agent behavior, and (b) produce structured session-end summaries with cost and performance data. Without hooks, every new behavior requires modifying AgentRuntime source. Without attestations, cost tracking requires manual post-hoc computation from raw events.

## What Changes

- **Lifecycle hook system**: New `src/runtime/hooks.ts` module with a HookRegistry supporting registration, dispatch, timeout enforcement, and error isolation. Hooks fire at predefined lifecycle points in AgentRuntime (before_model_call, after_tool_execution, turn_end, session_start, session_end).

- **Session attestation recording**: SessionManager emits a `session.attestation` event on session completion with aggregated model breakdown (per-model tokens, cost), duration, files changed, and provenance summary (goals, explorations, commitments, verifications, ratios).

- **REST API exposure**: New routes for attestation queries (`GET /api/sessions/:id/attestation`, `GET /api/attestations`) and provenance graph queries (`GET /api/sessions/:id/provenance`).

## Capabilities

### New Capabilities

- `runtime/hooks`: Hook registration, lifecycle points, dispatch with timeout, error isolation, hot-registration.
- `session/attestations`: Attestation creation on session end, model cost aggregation, REST API exposure.

### Modified Capabilities

- `runtime/agent-runtime`: Hook dispatch wired into agent loop at each lifecycle point.
- `core/session-manager`: Attestation emission on session completion.
- `store/query-engine`: Attestation query methods.
- `projection/rest-api`: Attestation and provenance API routes.

## Non-Goals

- Context assembly changes (Phase 3).
- Real-time attestation streaming.
- Cryptographic attestation signatures.
- External daemon or IPC for hooks (in-process only).

## Risks

- **Hook timeout too aggressive**: Could terminate fast hooks unnecessarily. Mitigation: default 5s is generous; configurable per-hook.
- **Runtime loop complexity**: Adding hook dispatch points to the agent loop increases its surface area. Mitigation: hooks are fire-and-forget with error isolation; existing loop logic unchanged.
- **Cost calculation accuracy**: Depends on model pricing data being available. Mitigation: missing pricing → cost recorded as null, not zero.
