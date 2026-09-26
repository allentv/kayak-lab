# src/capabilities/shell.ts · [[concrete-capabilities]] [[security-first-sandboxing]]

- ShellExecOptions · interface · L20-L31 — Configures shell command execution with working directory, environment variables, timeout, output limits, and background execution options.
- ShellExecResult · interface · L34-L45 — Represents the outcome of a shell command execution including exit code, output streams, duration, and timeout status.
- ShellEnvironment · interface · L48-L54 — Describes the shell execution environment including shell type, platform, architecture, home directory, and user information.
- IShellCapability · interface · L63-L81 — Defines the interface for shell operations including command execution, environment queries, command existence checks, and working directory management.
- ShellCapability · class · L120-L335 — Implements safe shell command execution with blocked command prevention, dangerous command approval requirements, timeout handling, and output truncation.
- initialize · method · L131-L134 — Sets up the shell capability with context and initial working directory for subsequent command execution.
- dispose · method · L136-L138 — Cleans up the shell capability by clearing its context reference when no longer needed.
- exec · method · L140-L237 — Executes shell commands with safety checks, timeout management, output truncation, and proper error handling for secure command processing.
- getEnvironment · method · L239-L258 — Retrieves system environment information including shell type, platform details, and user context for command execution awareness.
- commandExists · method · L260-L278 — Checks if a command exists in the system's PATH using the 'which' utility to verify command availability.
- getWorkingDirectory · method · L280-L283 — Returns the current working directory where shell commands will be executed by default.
- setWorkingDirectory · method · L285-L308 — Changes the working directory for subsequent shell commands after verifying the target path exists and is a directory.
- checkBlocked · method · L310-L318 — Identifies and blocks dangerous system commands like sudo, su, and permission-changing operations that pose security risks.
- checkDangerous · method · L320-L328 — Detects potentially dangerous commands like file deletion, disk formatting, and system shutdown operations that require approval.
- ensureInitialized · method · L330-L334 — Ensures the shell capability has been properly initialized before allowing any operations, preventing usage in an invalid state.
