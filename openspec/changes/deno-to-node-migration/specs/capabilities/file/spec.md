## ADDED Requirements

### Requirement: File capability uses runtime abstraction

The file capability MUST read files via the runtime file abstraction, not directly via `Deno.readTextFile`.

#### Scenario: File operations work unchanged

- **WHEN** file read/write/edit operations are performed
- **THEN** they produce the same results as before the migration

#### Scenario: Identical behavior on both runtimes

- **WHEN** the file capability test suite runs on Deno and Node.js
- **THEN** both produce identical results
