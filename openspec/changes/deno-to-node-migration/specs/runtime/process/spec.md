## Purpose

Platform-agnostic process execution. All subprocess spawning in kayak-lab MUST go through this abstraction, replacing direct `Deno.Command` usage.

## ADDED Requirements

### Requirement: Process execution via abstraction

The system MUST provide a process execution interface that accepts a command, arguments, options (cwd, env, stdin/stdout capture mode, timeout), and returns a result containing exit code, stdout, stderr, duration, and timed-out flag.

#### Scenario: Execute command with captured output

- **WHEN** a command is executed with stdout/stderr capture enabled
- **THEN** the result contains the exit code, full stdout, full stderr, and execution duration

#### Scenario: Timeout kills process

- **WHEN** a command exceeds its timeout
- **THEN** the process is terminated and the result indicates `timed_out: true`

#### Scenario: Background execution

- **WHEN** a command is spawned with background mode
- **THEN** the spawn returns immediately with a handle to the running process

### Requirement: Runtime adapter is swappable

The process execution interface MUST have implementations for both Deno and Node.js that produce identical observable behavior for the same inputs.

#### Scenario: Deno adapter uses Deno.Command

- **WHEN** running on Deno
- **THEN** the adapter delegates to `Deno.Command` internally

#### Scenario: Node adapter uses node:child_process

- **WHEN** running on Node.js
- **THEN** the adapter delegates to `node:child_process` internally

#### Scenario: Same test suite passes on both runtimes

- **WHEN** the capability test suite is executed on Deno and on Node.js
- **THEN** both produce the same pass/fail results
