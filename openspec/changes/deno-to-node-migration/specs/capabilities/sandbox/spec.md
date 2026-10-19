## ADDED Requirements

### Requirement: Sandbox capability uses runtime abstraction

The Docker and gVisor sandbox runtimes MUST execute docker commands via the runtime process abstraction, not directly via `Deno.Command`.

#### Scenario: Docker execution works unchanged

- **WHEN** commands are executed in the Docker sandbox
- **THEN** the same hardened flags are applied and results are identical

#### Scenario: gVisor health check works

- **WHEN** the gVisor runtime health check runs
- **THEN** it verifies syscall filtering via the process abstraction

#### Scenario: Identical behavior on both runtimes

- **WHEN** the sandbox test suite runs on Deno and Node.js
- **THEN** both produce identical results
