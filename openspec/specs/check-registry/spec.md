# check-registry Specification

## Purpose

Plugin-based check discovery and execution framework that allows new review checks to be added by dropping a file in a directory, without modifying core orchestrator code.

## Requirements

### Requirement: Check registration

Each check is a self-contained module with a consistent interface: name, description, and a `run` function that accepts a `ReviewContext` and returns an array of `Finding` objects.

#### Scenario: Registering a new check
- **WHEN** a new file is added to the checks directory
- **THEN** the registry discovers it automatically on next run without core changes

### Requirement: Check execution

Checks run independently and can be executed in parallel. The registry fans out to all enabled checks and collects results.

#### Scenario: Running all checks
- **WHEN** `kayak review` is invoked with no filters
- **THEN** every registered check runs and results are collected

#### Scenario: Running a single check
- **WHEN** `kayak review --only <check-name>` is invoked
- **THEN** only the named check runs

#### Scenario: Skipping a check
- **WHEN** `kayak review --skip <check-name>` is invoked
- **THEN** the named check is excluded from execution

### Requirement: Consistent output schema

All checks produce findings in a unified `Finding` format: title, body, priority (1-3), confidence (0-1), file_path, line_start, line_end.

#### Scenario: Output consistency
- **WHEN** any check produces a finding
- **THEN** the finding conforms to the `Finding` schema regardless of which check produced it

### Requirement: ReviewContext pre-computation

File metadata (path, content, line count), source-to-test mapping, export/import lists, and dependency graph are computed once before checks run. Checks consume this context without re-reading files.

#### Scenario: Context sharing
- **WHEN** multiple checks run in a single invocation
- **THEN** each check receives the same pre-computed `ReviewContext` and no file is read more than once
