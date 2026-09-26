# src/capabilities/sandboxed-shell.ts · [[sandboxed-execution]]

- SandboxedShellExecOptions · interface · L29-L38 — Extends shell execution options with sandbox-specific configuration like resource limits, file mounts, and runtime selection for isolated command execution.
- SandboxedShellCapability · class · L51-L202 — Implements a shell capability that runs commands inside an OS-level sandbox to provide isolation for untrusted code execution.
- constructor · method · L62-L64 — Initializes the sandboxed shell capability with a runtime implementation that provides the actual sandbox execution environment.
- initialize · method · L66-L69 — Sets up the capability with execution context information needed for sandboxed command execution.
- dispose · method · L71-L74 — Cleans up the capability by resetting its initialization state and clearing context references.
- exec · method · L76-L135 — Executes a command inside the sandbox with configurable resource limits and mounts, providing defense-in-depth security for untrusted code.
- getEnvironment · method · L137-L148 — Returns a fixed sandbox environment configuration that represents the isolated execution context for sandboxed commands.
- commandExists · method · L150-L156 — Checks if a command exists in the sandbox environment by using the 'which' command within the isolated execution context.
- getWorkingDirectory · method · L158-L163 — Retrieves the current working directory from the capability context or returns the default sandbox workspace path.
- setWorkingDirectory · method · L165-L170 — Updates the working directory in the capability context for subsequent sandboxed command executions.
- injectDenoPermissions · method · L178-L201 — Adds restrictive Deno permission flags to Deno commands as a defense-in-depth measure against sandbox escape attempts.
