## Purpose

Search capability providing grep (regex search) and glob (file pattern matching) for codebase exploration.

## ADDED Requirements

### Requirement: Grep search

The search capability SHALL find lines matching regex patterns across files.

#### Scenario: Basic regex search
- **WHEN** `grep(pattern, path)` is called
- **THEN** all lines matching the regex pattern are returned with file path, line number, and matched content

#### Scenario: Case-insensitive search
- **WHEN** `grep(pattern, path, { case: false })` is called
- **THEN** the search is case-insensitive

#### Scenario: Search specific file
- **WHEN** `grep(pattern, "src/main.ts")` is called with a file path
- **THEN** only that file is searched

#### Scenario: Search directory
- **WHEN** `grep(pattern, "src/")` is called with a directory path
- **THEN** all files in that directory (recursively) are searched

#### Scenario: Search with file filter
- **WHEN** `grep(pattern, path, { glob: "*.ts" })` is called
- **THEN** only files matching the glob pattern are searched

#### Scenario: No matches
- **WHEN** `grep(pattern, path)` is called and no lines match
- **THEN** an empty result set is returned

#### Scenario: Invalid regex
- **WHEN** `grep("[invalid", path)` is called with an invalid regex pattern
- **THEN** an error is returned indicating the pattern is invalid

### Requirement: Glob file matching

The search capability SHALL find files matching glob patterns.

#### Scenario: Basic glob
- **WHEN** `glob(pattern)` is called with a pattern like `src/**/*.ts`
- **THEN** all matching file paths are returned

#### Scenario: Glob with hidden files
- **WHEN** `glob(pattern, { hidden: true })` is called
- **THEN** hidden files (starting with `.`) are included in results

#### Scenario: Glob respecting gitignore
- **WHEN** `glob(pattern)` is called
- **THEN** files matching `.gitignore` patterns are excluded by default

#### Scenario: Glob including gitignored files
- **WHEN** `glob(pattern, { gitignore: false })` is called
- **THEN** gitignored files are included in results

#### Scenario: No matches
- **WHEN** `glob(pattern)` is called and no files match
- **THEN** an empty result set is returned

### Requirement: Search result format

The search capability SHALL return results in a structured format.

#### Scenario: Grep result structure
- **WHEN** grep returns results
- **THEN** each result includes `file`, `line`, `column`, and `content` fields

#### Scenario: Glob result structure
- **WHEN** glob returns results
- **THEN** each result is a file path relative to the project root
