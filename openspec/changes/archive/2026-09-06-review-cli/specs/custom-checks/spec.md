## Purpose

Three custom review checks that existing tools do not cover: file-size decomposition, test-file pairing, and mod.ts re-export coverage.

## ADDED Requirements

### Requirement: File-size check

Flags source files exceeding a configurable line threshold (default 400 lines) as candidates for decomposition.

#### Scenario: Large file detected
- **WHEN** a source file exceeds the line threshold
- **THEN** a finding with priority 2 is produced with the file path and line count

#### Scenario: File within threshold
- **WHEN** a source file is at or below the line threshold
- **THEN** no finding is produced for that file

### Requirement: Test-pairing check

Identifies source files under `src/` that have no corresponding test file in a `__tests__/` directory.

#### Scenario: Source file with no test
- **WHEN** a `.ts` file exists under `src/` with no matching `__tests__/*.test.ts`
- **THEN** a finding with priority 2 is produced for that file

#### Scenario: Source file with test
- **WHEN** a `.ts` file has a corresponding test file
- **THEN** no finding is produced for that file

### Requirement: Re-export coverage check

Verifies that `mod.ts` index files re-export all public symbols from sibling files in the same directory.

#### Scenario: Missing re-export
- **WHEN** a public export in a sibling file is not re-exported by `mod.ts`
- **THEN** a finding with priority 2 is produced identifying the missing symbol and file

#### Scenario: Complete re-exports
- **WHEN** all public exports are covered by `mod.ts`
- **THEN** no finding is produced

### Requirement: Check configurability

Each custom check accepts optional configuration (threshold values, include/exclude patterns) via a config object, with sensible defaults.

#### Scenario: Default configuration
- **WHEN** no config is provided
- **THEN** checks use default thresholds (400 lines) and scan all `src/**/*.ts`

#### Scenario: Custom configuration
- **WHEN** a config overrides the threshold
- **THEN** the check uses the provided value instead of the default
