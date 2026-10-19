## Purpose

Platform-agnostic access to environment variables, CLI arguments, platform info, and process exit. Replaces `Deno.env`, `Deno.args`, `Deno.build`, `Deno.exit`.

## ADDED Requirements

### Requirement: Environment variable access

The system MUST provide env var get/set/list operations that work identically on Deno and Node.js.

#### Scenario: Read environment variable

- **WHEN** code reads an environment variable via the abstraction
- **THEN** the value matches what the OS provides, regardless of runtime

#### Scenario: List all environment variables

- **WHEN** code enumerates all environment variables (used by config loading)
- **THEN** the result contains all vars with the configured prefix

### Requirement: CLI argument access

The system MUST provide access to process arguments identically on both runtimes.

#### Scenario: Read CLI arguments

- **WHEN** the application parses CLI arguments via the abstraction
- **THEN** the arguments array matches what was passed to the process

### Requirement: Platform information

The system MUST expose OS name, architecture, and home directory.

#### Scenario: Get platform info

- **WHEN** code queries platform info via the abstraction
- **THEN** the result contains `os`, `arch`, and `home` matching the host system

### Requirement: Process exit

The system MUST provide a graceful exit function.

#### Scenario: Exit with code

- **WHEN** the application calls exit with a code
- **THEN** the process terminates with that exit code
