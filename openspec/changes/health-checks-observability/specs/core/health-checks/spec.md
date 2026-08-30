## Purpose

Health check and operational observability endpoints for monitoring system status, enabling orchestrator integration (Kubernetes probes) and operational dashboards.

## ADDED Requirements

### Requirement: Health endpoint

The system MUST expose an HTTP health endpoint.

#### Scenario: Healthy system
- **WHEN** `GET /health` is called and all components are healthy
- **THEN** response is 200 OK with `{ status: "healthy", version, uptime, components: [...] }`

#### Scenario: Degraded system
- **WHEN** `GET /health` is called and some components are unhealthy
- **THEN** response is 200 OK with `{ status: "degraded", components: [{ name, status: "unhealthy", error }] }`

#### Scenario: Unhealthy system
- **WHEN** `GET /health` is called and critical components are unhealthy
- **THEN** response is 503 Service Unavailable with `{ status: "unhealthy", components: [...] }`

### Requirement: Readiness probe

The system MUST expose a readiness probe endpoint for Kubernetes.

#### Scenario: Ready
- **WHEN** `GET /ready` is called and the system can accept traffic
- **THEN** response is 200 OK with `{ ready: true }`

#### Scenario: Not ready
- **WHEN** `GET /ready` is called during startup or when critical dependencies are unavailable
- **THEN** response is 503 Service Unavailable with `{ ready: false, reason: "..." }`

### Requirement: Liveness probe

The system MUST expose a liveness probe endpoint for Kubernetes.

#### Scenario: Alive
- **WHEN** `GET /alive` is called and the process is responsive
- **THEN** response is 200 OK with `{ alive: true }`

#### Scenario: Not responding
- **WHEN** `GET /alive` is called and the process is stuck
- **THEN** the endpoint does not respond (timeout → kubelet restarts the pod)

### Requirement: Component health

Each major component MUST report its own health status.

#### Scenario: Component check
- **WHEN** health is requested
- **THEN** each registered component (event store, capabilities, WebSocket server) reports healthy/unhealthy with optional error message

#### Scenario: Component registration
- **WHEN** a component starts
- **THEN** it registers itself with the health system and provides a check function

#### Scenario: Component deregistration
- **WHEN** a component shuts down
- **THEN** it deregisters and is no longer included in health checks

### Requirement: Structured error responses

All API error responses MUST follow a consistent format.

#### Scenario: Error response format
- **WHEN** an API endpoint returns an error
- **THEN** the response body is `{ error: { code, message, details?, timestamp } }`

#### Scenario: Validation error
- **WHEN** input validation fails
- **THEN** the response includes `{ error: { code: "VALIDATION_ERROR", message: "...", details: [{ field, rule, message }] } }`
