## Why

The platform has no health check mechanism — load balancers, orchestrators (K8s), and monitoring tools can't determine if the system is healthy. Beyond telemetry (logs/metrics/traces), operational visibility requires structured health and readiness reporting.

## What Changes

- **Health endpoint**: HTTP endpoint returning system health status
- **Readiness/liveness probes**: K8s-compatible probe endpoints
- **Component health checks**: Each capability and subsystem reports its own health
- **Structured error reporting**: Consistent error format for API responses and logs

## Capabilities

### New Capabilities

- `core/health-checks`: Health, readiness, and liveness probe endpoints with component health reporting

### Modified Capabilities

None.
