# src/__test-utils__/mocks/mock-shell.ts

Provides a mock shell capability for testing that tracks calls and returns configurable responses.

- ShellExecOptions · interface · L17-L21 — Defines options for shell command execution including timeout, environment variables, and working directory.
- MockShellCapabilityConfig · interface · L23-L30 — Configures mock shell behavior with predefined command results, environment settings, and failure conditions.
- MockShellCapability · class · L32-L130 — Implements a mock shell capability for testing that tracks method calls and returns configurable responses.
- constructor · method · L45-L48 — Initializes the mock shell with configuration and sets the working directory.
- initialize · method · L50-L58 — Records initialization calls and optionally fails or updates the working directory based on context.
- dispose · method · L60-L62 — Records disposal calls for tracking test interactions.
- exec · method · L64-L87 — Executes mock shell commands by returning predefined results or defaults while tracking calls.
- getEnvironment · method · L89-L101 — Returns configured environment settings or sensible defaults for testing.
- commandExists · method · L103-L112 — Checks if a command exists based on configured mappings or defaults to true.
- getWorkingDirectory · method · L114-L117 — Returns the current working directory for testing file system operations.
- setWorkingDirectory · method · L119-L125 — Updates the working directory for testing path-dependent operations.
- resetCalls · method · L127-L129 — Clears the call tracking history to reset test state between scenarios.
