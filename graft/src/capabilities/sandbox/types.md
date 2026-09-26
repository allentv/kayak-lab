# src/capabilities/sandbox/types.ts · [[sandboxed-execution]]

- SandboxResourceLimits · interface · L13-L22 — Specifies resource constraints (CPU, memory, processes, timeout) for sandboxed command execution to prevent resource exhaustion.
- SandboxMount · interface · L25-L32 — Defines file system mount points between host and container for input/output data transfer in sandboxed execution.
- SandboxExecConfig · interface · L35-L54 — Configures all parameters needed to execute a command in a sandbox, including command, environment, resources, mounts, and Docker settings.
- SandboxExecResult · interface · L61-L74 — Captures the outcome of sandboxed command execution including exit code, output, timing, and truncation status.
- HealthCheckResult · interface · L81-L88 — Represents the result of an individual health check with pass/fail status and diagnostic message.
- HealthStatus · interface · L91-L96 — Aggregates multiple health check results to determine overall system health status.
- ISandboxRuntime · interface · L108-L120 — Defines the interface for pluggable sandbox runtime implementations (Docker, gVisor, etc.) to execute commands and check health.
