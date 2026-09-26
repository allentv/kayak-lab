# src/core/health.ts · [[health-observability]]

- ComponentHealth · interface · L13-L22 — Represents the health status of a single component including its name, health boolean, message, and check duration.
- AggregateStatus · type · L25-L25 — Defines the three possible aggregate health states: healthy, degraded, or unhealthy.
- HealthCheckResult · interface · L28-L35 — Contains the complete result of a health check including aggregate status, timestamp, and individual component results.
- ErrorResponse · interface · L38-L45 — Standardized error response format with error code, message, optional details, and timestamp.
- HealthCheckFn · type · L52-L52 — Type definition for health check functions that return either a ComponentHealth directly or a promise of one.
- HealthRegistry · class · L63-L158 — Registry that manages component health checks, runs them in parallel with timeout protection, and aggregates results.
- constructor · method · L67-L69 — Initializes the health registry with an optional timeout value for health checks.
- register · method · L74-L76 — Registers a health check function for a component by name.
- deregister · method · L81-L83 — Removes a health check function from the registry by component name.
- check · method · L89-L117 — Runs all registered health checks in parallel, applies timeouts, and determines the aggregate health status.
- runCheck · method · L122-L146 — Executes a single health check with timeout protection and error handling, measuring its duration.
- timeoutPromise · method · L151-L157 — Creates a promise that rejects after the configured timeout to enforce maximum check duration.
- createHealthHandler · function · L167-L187 — Creates an HTTP handler that routes health-related requests to appropriate endpoints (/health, /ready, /alive).
- handleHealth · function · L189-L200 — Handles the /health endpoint by running all checks and returning detailed results with appropriate HTTP status.
- handleReady · function · L202-L213 — Handles the /ready endpoint by checking if the system is ready (not unhealthy) and returning a simplified status.
- handleAlive · function · L215-L223 — Handles the /alive endpoint by returning a simple alive status without running any health checks.
- errorResponse · function · L232-L245 — Creates a structured error response object with standardized error format including timestamp.
- errorHttpResponse · function · L250-L263 — Creates an HTTP Response containing a structured error in JSON format with appropriate status code.
