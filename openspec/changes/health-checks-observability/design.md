## Context

Current state: No health endpoints. No component health reporting. API error responses are inconsistent (some return strings, some return objects). The telemetry change adds logging/metrics/tracing but not health probes.

## Goals / Non-Goals

**Goals:**
- Kubernetes-compatible health, readiness, and liveness endpoints
- Component-level health reporting with registration/deregistration
- Consistent structured error response format

**Non-Goals:**
- Dashboard UI for health visualization
- Alerting integration (covered by telemetry)
- Deep dependency health (e.g., checking database connectivity beyond basic ping)

## Decisions

### 1. HTTP endpoints via Deno.serve

**Decision:** Health endpoints are served via the same HTTP server as the REST API projection.

**Rationale:**
- Single port for all HTTP endpoints
- No additional server process
- Easy to configure Kubernetes probes against

### 2. Component registration pattern

**Decision:** Components register health check functions at startup.

**Rationale:**
- Decoupled — components don't need to know about the health system
- Dynamic — components can register/deregister at runtime
- Testable — health checks can be mocked

### 3. Three endpoint design

**Decision:** Separate `/health`, `/ready`, `/alive` endpoints.

**Rationale:**
- K8s liveness probe (`/alive`) must be lightweight — no dependency checks
- K8s readiness probe (`/ready`) checks if the system can accept traffic
- `/health` is comprehensive — all component checks

## Risks / Trade-offs

### Risk: Health check performance

**Impact:** Low — health checks are simple boolean checks, not deep inspections.

**Mitigation:** Health checks run in parallel. Timeout per component check (1s).

### Risk: Stale health status

**Impact:** Low — health is computed on each request, always current.

**Mitigation:** No caching of health status. Each request triggers fresh checks.
