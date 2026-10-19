## ADDED Requirements

### Requirement: Kubernetes capability uses runtime abstraction

The Kubernetes capability MUST read the service account token via the runtime file abstraction, not directly via `Deno.readTextFile`.

#### Scenario: In-cluster token loading works

- **WHEN** running inside a Kubernetes cluster
- **THEN** the service account token is read via the file abstraction

#### Scenario: Identical behavior on both runtimes

- **WHEN** the Kubernetes capability test suite runs on Deno and Node.js
- **THEN** both produce identical results
