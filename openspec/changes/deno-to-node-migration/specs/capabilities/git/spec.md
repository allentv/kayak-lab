## ADDED Requirements

### Requirement: Git capability uses runtime abstraction

The git capability MUST execute git commands via the runtime process abstraction, not directly via `Deno.Command`.

#### Scenario: Git operations work unchanged

- **WHEN** `getStatus()`, `commit()`, `push()`, `pull()`, `getDiff()` are called
- **THEN** they produce the same results as before the migration

#### Scenario: Identical behavior on both runtimes

- **WHEN** the git capability test suite runs on Deno and Node.js
- **THEN** both produce identical results
