## ADDED Requirements

### Requirement: Shell capability uses runtime abstraction

The shell capability MUST execute commands via the runtime process abstraction, not directly via `Deno.Command`.

#### Scenario: Execute command

- **WHEN** `exec()` is called with a command string
- **THEN** the command runs via the process abstraction and returns exit code, stdout, stderr, duration

#### Scenario: Blocked commands are rejected

- **WHEN** a blocked command (e.g., `sudo`, `rm -rf /`) is submitted
- **THEN** the capability rejects it before execution

#### Scenario: Timeout enforcement

- **WHEN** a command exceeds its timeout
- **THEN** the process is killed and the result indicates timeout

#### Scenario: Identical behavior on both runtimes

- **WHEN** the shell capability test suite runs on Deno and Node.js
- **THEN** both produce identical results
