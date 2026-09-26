# src/capabilities/sandbox/docker-runtime.ts · [[sandboxed-execution]] [[security-first-sandboxing]]

- DockerRuntimeConfig · interface · L34-L41 — Configuration interface for Docker runtime specifying image, runtime, and default flags.
- DockerRuntime · class · L46-L374 — Docker-based sandbox runtime implementation that executes commands in hardened containers with security isolation.
- constructor · method · L50-L53 — Initializes the Docker runtime with configuration and sets its name based on runtime type.
- execute · method · L55-L130 — Executes a command in a Docker container with resource limits, timeout handling, and output truncation.
- healthCheck · method · L132-L271 — Performs comprehensive health checks including Docker installation, daemon status, runtime availability, and security isolation tests.
- setup · method · L273-L282 — Pulls the default Docker image to ensure it's available for execution.
- buildDockerArgs · method · L287-L348 — Constructs hardened Docker command arguments with security flags, resource limits, mounts, and environment variables.
- extractOutput · method · L353-L373 — Extracts output files from container to host mount using a temporary container for file transfer.
