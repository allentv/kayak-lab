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
