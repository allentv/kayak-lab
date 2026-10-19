## Purpose

Migrate developer tooling from Deno built-ins to Node.js ecosystem: test runner, linter, formatter, type checker.

## ADDED Requirements

### Requirement: Test runner migration

Tests MUST run on Node.js with a test runner that supports TypeScript, module mocking, and parallel execution. The existing test suite must pass without modification to test logic.

#### Scenario: Run full test suite

- **WHEN** `npm test` is executed
- **THEN** all existing tests run and produce the same pass/fail results as `deno task test`

#### Scenario: Test isolation

- **WHEN** tests run in parallel
- **THEN** no test state leaks between files

#### Scenario: Watch mode

- **WHEN** the test runner is started in watch mode
- **THEN** it re-runs affected tests on file changes

### Requirement: Linter migration

Code linting MUST use ESLint with TypeScript support, configured to match the existing `deno lint` rules (minus Deno-specific rules).

#### Scenario: Lint passes on clean code

- **WHEN** ESLint is run on the codebase
- **THEN** no errors are reported for code that passed `deno lint`

#### Scenario: Lint catches violations

- **WHEN** code contains unused variables, explicit-any, or other configured violations
- **THEN** ESLint reports them with file, line, and rule name

### Requirement: Formatter migration

Code formatting MUST use Prettier, configured to match the existing `deno fmt` output style.

#### Scenario: Format check passes

- **WHEN** Prettier check is run on the codebase
- **THEN** no files require reformatting (after initial format pass)

#### Scenario: Format produces consistent output

- **WHEN** Prettier formats a file
- **THEN** the output matches the style of the existing `deno fmt` output

### Requirement: Type checker migration

Type checking MUST use `tsc --noEmit` with equivalent strictness settings to the existing `deno check`.

#### Scenario: Type check passes

- **WHEN** `tsc --noEmit` is run
- **THEN** no type errors are reported

#### Scenario: Type check catches errors

- **WHEN** code contains type errors
- **THEN** `tsc` reports them with file and line information
