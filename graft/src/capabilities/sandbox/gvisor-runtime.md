# src/capabilities/sandbox/gvisor-runtime.ts · [[sandboxed-execution]] [[security-first-sandboxing]]

- GVisorRuntimeConfig · interface · L11-L16 — Configuration interface for gVisor runtime specifying Docker image and additional runtime flags.
- GVisorRuntime · class · L21-L72 — Sandbox runtime class that extends Docker runtime with gVisor (runsc) for enhanced container isolation and security.
- constructor · method · L22-L27 — Constructor that configures the runtime to use gVisor (runsc) by default when extending Docker runtime.
- healthCheck · method · L29-L71 — Health check method that verifies gVisor's security isolation by testing that ptrace syscall is blocked inside containers.
