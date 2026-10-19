## ADDED Requirements

### Requirement: Search capability uses runtime abstraction

The search capability MUST execute external tools via the runtime process abstraction and read files via the runtime file abstraction, not directly via Deno APIs.

#### Scenario: External tool detection works

- **WHEN** ripgrep and fd availability is probed
- **THEN** detection uses the process abstraction and returns the same results

#### Scenario: Fallback walker works

- **WHEN** external tools are unavailable
- **THEN** the pure-TS fallback walker uses the file abstraction for reading

#### Scenario: Identical behavior on both runtimes

- **WHEN** the search capability test suite runs on Deno and Node.js
- **THEN** both produce identical results
