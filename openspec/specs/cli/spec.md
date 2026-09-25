# cli Specification

## Purpose

CLI entrypoint for `kayak review` that orchestrates tool delegation, custom checks, and unified output for both human and machine consumption.

## Requirements

### Requirement: Preflight delegation

Before custom checks run, the CLI executes preflight checks by delegating to existing tools: `deno lint`, `deno check`, and `deno test`. Preflight failures are surfaced as findings but do not block custom checks.

#### Scenario: Preflight passes
- **WHEN** `deno lint`, `deno check`, and `deno test` all pass
- **THEN** custom checks proceed normally

#### Scenario: Preflight fails
- **WHEN** any preflight check fails
- **THEN** the failure is reported as a finding with priority 1 and custom checks still run

### Requirement: Tool delegation

Existing tools (`deno lint`, `deno check`, `knip`, `madge`) are invoked as subprocesses. Their output is parsed into the unified `Finding` schema.

#### Scenario: Lint finding
- **WHEN** `deno lint` reports a warning
- **THEN** the warning is converted to a `Finding` with the file path, line range, and title from the lint message

### Requirement: CI gating

The CLI exits with a non-zero code when findings meet or exceed a specified priority threshold.

#### Scenario: Fail on critical
- **WHEN** `--fail-on 1` is passed and any priority-1 finding exists
- **THEN** the process exits with code 1

#### Scenario: No threshold breach
- **WHEN** `--fail-on 1` is passed and no priority-1 findings exist
- **THEN** the process exits with code 0

### Requirement: Output format

Results are printed as a structured summary: findings grouped by file, with priority and confidence, followed by a summary line with counts.

#### Scenario: Human-readable output
- **WHEN** the CLI completes
- **THEN** findings are grouped by file path with priority labels and a total count summary

### Requirement: CLI subcommands

The CLI SHALL expose three subcommands: `run`, `analyze`, and `export`.

#### Scenario: Run subcommand
- **WHEN** `kayak run` is executed in a project directory
- **THEN** the CLI starts an interactive REPL with natural language input

#### Scenario: Analyze subcommand
- **WHEN** `kayak analyze` is executed in a project directory with captured sessions
- **THEN** the CLI displays a summary report of command frequency, timing, and errors

#### Scenario: Export subcommand
- **WHEN** `kayak export` is executed in a project directory with captured sessions
- **THEN** the CLI outputs all captured events as JSON to stdout

#### Scenario: Unknown subcommand
- **WHEN** an unknown subcommand is provided
- **THEN** the CLI displays usage information and exits with error code 1

### Requirement: Project detection

The CLI SHALL auto-detect project type from the current directory.

#### Scenario: Deno project
- **WHEN** the directory contains `deno.json` or `deno.jsonc`
- **THEN** the project type is detected as "deno" and project name is extracted from the config

#### Scenario: Node project
- **WHEN** the directory contains `package.json`
- **THEN** the project type is detected as "node" and project name/version are extracted

#### Scenario: Rust project
- **WHEN** the directory contains `Cargo.toml`
- **THEN** the project type is detected as "rust"

#### Scenario: Go project
- **WHEN** the directory contains `go.mod`
- **THEN** the project type is detected as "go"

#### Scenario: Python project
- **WHEN** the directory contains `pyproject.toml`
- **THEN** the project type is detected as "python"

#### Scenario: Unknown project
- **WHEN** no recognized project file is found
- **THEN** the project type is "unknown" and the directory name is used as project name

### Requirement: Interactive REPL

The CLI SHALL provide a read-eval-print loop for natural language interaction.

#### Scenario: REPL prompt
- **WHEN** the REPL starts
- **THEN** it displays a prompt showing the project name and awaits user input

#### Scenario: Natural language input
- **WHEN** the user types a natural language command
- **THEN** the CLI processes it through AgentRuntime and displays the response

#### Scenario: Quit command
- **WHEN** the user types `:quit`
- **THEN** the session is ended, attestation is generated, and the CLI exits

#### Scenario: Status command
- **WHEN** the user types `:status`
- **THEN** the CLI displays current session ID, state, and event count

#### Scenario: History command
- **WHEN** the user types `:history`
- **THEN** the CLI displays the last 20 events in the current session

### Requirement: Tool registration

The CLI SHALL register all coding harness tools with the AgentRuntime.

#### Scenario: File tools
- **WHEN** the CLI starts
- **THEN** `read`, `write`, and `edit` tools are registered and available to the agent

#### Scenario: Search tools
- **WHEN** the CLI starts
- **THEN** `grep` and `glob` tools are registered and available to the agent

#### Scenario: Git tools
- **WHEN** the CLI starts
- **THEN** git operations are available through the git capability

#### Scenario: GitHub tools
- **WHEN** the CLI starts and `GITHUB_TOKEN` is set
- **THEN** GitHub operations are available through the github capability

### Requirement: Event persistence

The CLI SHALL persist all session events to SQLite.

#### Scenario: Database location
- **WHEN** a session is created
- **THEN** events are stored in `.kayak/events.sqlite` in the project directory

#### Scenario: Session isolation
- **WHEN** multiple sessions are created
- **THEN** each session's events are stored separately in the same database

### Requirement: Binary distribution

The CLI SHALL be distributable as a standalone binary.

#### Scenario: Linux x64 binary
- **WHEN** the build script is executed with `--target linux-x64`
- **THEN** a standalone binary is produced that runs on Linux x64 without runtime dependencies

#### Scenario: macOS binary
- **WHEN** the build script is executed with `--target macos-arm64` or `--target macos-x64`
- **THEN** a standalone binary is produced that runs on macOS without runtime dependencies

#### Scenario: Binary size
- **WHEN** the binary is compiled
- **THEN** the total size is under 50MB
