## Context

The platform has core event sourcing, agent runtime, capabilities, and projections. Cross-cutting concerns (identity, policy, telemetry, evaluation) are not yet implemented. These are required for production deployment — without identity/auth, anyone can use the platform; without policy, agents can do anything; without telemetry, there's no observability; without evaluation, there's no quality measurement.

## Goals / Non-Goals

**Goals:**
- Add identity/authentication with token-based auth and role-based access control
- Add policy engine for rule-based action evaluation with approval workflow
- Add structured logging, metrics, and tracing for observability
- Add evaluation framework for agent quality measurement

**Non-Goals:**
- Full enterprise identity provider integration (Okta, Auth0) — use simple token-based auth
- Complex policy languages (Rego, CEL) — use simple rule matching
- Full APM integration (Datadog, New Relic) — use standard formats (Prometheus, OpenTelemetry)
- ML-based quality scoring — use rule-based scoring

## Decisions

### 1. Middleware pattern for cross-cutting concerns

**Decision:** Implement cross-cutting concerns as middleware that wraps agent operations.

**Rationale:**
- Consistent with the capability pattern — each concern is a layer
- Composable — can enable/disable concerns independently
- Testable — each middleware can be tested in isolation

**Alternatives considered:**
- Decorator pattern: Less composable, harder to control ordering
- AOP (Aspect-Oriented Programming): Overly complex for TypeScript

### 2. Simple token-based auth

**Decision:** Use opaque tokens (JWT or API keys) for authentication. No OAuth/OIDC initially.

**Rationale:**
- Simple to implement and understand
- Sufficient for internal deployment
- Can be extended to OAuth later

**Alternatives considered:**
- OAuth2/OIDC: More standards-compliant but adds complexity
- Session-based auth: Doesn't work well for API access

### 3. Rule-based policy (not DSL)

**Decision:** Policies are defined as JSON objects with simple matching rules.

**Rationale:**
- Easy to understand and modify
- No parser or interpreter needed
- Sufficient for most policy requirements
- Can be extended to DSL later

**Alternatives considered:**
- Rego (Open Policy Agent): More powerful but adds dependency
- Custom DSL: More flexible but requires parser

### 4. Standard observability formats

**Decision:** Use structured JSON logs, Prometheus metrics format, and OpenTelemetry traces.

**Rationale:**
- Industry standards with wide tooling support
- Easy to integrate with existing monitoring systems
- No vendor lock-in

**Alternatives considered:**
- Custom log format: Less tooling support
- Vendor-specific APM: Lock-in risk

## Risks / Trade-offs

### Risk: Auth overhead on every request

**Impact:** Low — token validation is fast (HMAC verification). No network hop for auth.

**Mitigation:** Cache validated tokens. Auth check is O(1) per request.

### Risk: Policy engine complexity

**Impact:** Medium — simple rules may not cover all cases.

**Mitigation:** Start with simple rules; add more complex matching as needed. Policy engine is pluggable.

### Risk: Telemetry performance impact

**Impact:** Low — structured logging and metric recording are synchronous but fast.

**Mitigation:** Async metric export. Log level filtering. Sampling for traces.
