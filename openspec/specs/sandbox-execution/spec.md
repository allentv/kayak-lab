# Sandbox Execution Specification

## Purpose

Provides OS-level sandboxed execution of untrusted or LLM-generated code on local Linux developer machines, decoupling kayak-lab from the specific isolation technology while enforcing a consistent security boundary.

## Requirements

### Requirement: Sandbox runtime abstraction

The system MUST define an `ISandboxRuntime` interface that decouples kayak-lab from the specific container/VM technology used for isolation.

#### Scenario: Interface contract
- **WHEN** a caller invokes sandboxed execution through `ISandboxRuntime`
- **THEN** the interface accepts a command string, working directory, environment variables, resource limits (CPU, memory, PID count, timeout), and file mounts
- **AND** returns stdout, stderr, exit code, duration, and whether the execution was killed due to timeout

#### Scenario: Runtime implementations are swappable
- **WHEN** the system is configured to use a different sandbox runtime (e.g. switching from Docker to Docker+gVisor)
- **THEN** no code outside the runtime configuration changes
- **AND** the `ISandboxRuntime` interface contract is satisfied identically

### Requirement: Default-deny security posture

The sandbox MUST operate with a default-deny posture across all capability dimensions.

#### Scenario: Network isolation
- **WHEN** code executes inside the sandbox
- **THEN** outbound network access is denied by default
- **AND** specific hosts/ports MAY be allowlisted via explicit configuration

#### Scenario: Filesystem isolation
- **WHEN** code executes inside the sandbox
- **THEN** the root filesystem is read-only
- **AND** only explicitly mounted directories are writable
- **AND** write access to configuration files outside the workspace is blocked (e.g. `~/.gitconfig`, `~/.zshrc`, IDE configs, MCP configs)

#### Scenario: Process isolation
- **WHEN** code executes inside the sandbox
- **THEN** process spawning is limited to a configurable maximum (PID cgroup limit)
- **AND** Linux capabilities are dropped except those explicitly required
- **AND** `no-new-privileges` is enforced (prevents privilege escalation via setuid binaries)

#### Scenario: Syscall surface restriction
- **WHEN** code executes inside the sandbox
- **THEN** syscalls enabling privilege escalation are blocked (`ptrace`, `mount`, `unshare` with new user namespaces, `keyctl`, `bpf`)
- **AND** a seccomp profile is applied (Docker default or custom hardened)

### Requirement: Resource limits

The sandbox MUST enforce resource limits to prevent denial-of-service and resource exhaustion.

#### Scenario: Memory limit
- **WHEN** code executes inside the sandbox
- **THEN** memory usage is capped at a configurable limit (default: 512MB)
- **AND** exceeding the limit kills the process with a clear error

#### Scenario: CPU limit
- **WHEN** code executes inside the sandbox
- **THEN** CPU usage is capped at a configurable number of cores (default: 1)
- **AND** execution continues within the cap rather than being killed

#### Scenario: Execution timeout
- **WHEN** code executes inside the sandbox
- **THEN** execution is killed after a configurable timeout (default: 30s)
- **AND** SIGKILL is used to ensure termination
- **AND** stdout/stderr captured up to the point of termination are returned

#### Scenario: Output size limit
- **WHEN** code produces output inside the sandbox
- **THEN** stdout and stderr are truncated at a configurable byte limit (default: 1MB each)

### Requirement: File transfer between host and sandbox

The system MUST support controlled file transfer between the host filesystem and the sandbox.

#### Scenario: Input files
- **WHEN** code requires input files
- **THEN** specified host directories or files are mounted read-only into the sandbox at a designated path

#### Scenario: Output files
- **WHEN** code produces output files
- **THEN** output is written to a designated writable mount (tmpfs or bind mount)
- **AND** output is extracted from the sandbox after execution completes
- **AND** output files are treated as untrusted — the system validates size, type, and filenames before exposing to the host

### Requirement: Deno permission flags as complementary layer

When executing Deno code inside the sandbox, the system MUST apply Deno permission flags as an additional defense layer.

#### Scenario: Deno code inside sandbox
- **WHEN** the command being executed is a Deno script
- **THEN** the execution command includes `--no-prompt` (never ask for permissions interactively)
- **AND** `--cached-only` and `--frozen` are applied if dependencies are involved
- **AND** explicit `--deny-*` flags block network, env, run, and FFI unless explicitly allowlisted

### Requirement: Setup and verification

The system MUST include setup scripts and a health check to verify the sandbox runtime is correctly installed and functional.

#### Scenario: First-time setup
- **WHEN** a developer clones kayak-lab on a Linux machine without the sandbox runtime
- **THEN** a setup script installs the required runtime (e.g. `runsc` for gVisor) and configures Docker
- **AND** the script is idempotent — running it twice produces no errors

#### Scenario: Health check
- **WHEN** the sandbox health check is run
- **THEN** it verifies: runtime is installed, Docker recognizes the runtime, a test container executes successfully, resource limits are enforced, network isolation works
- **AND** returns a clear pass/fail with diagnostic messages on failure

### Requirement: Integration with ShellCapability

The sandbox MUST be usable as an execution backend by the existing `ShellCapability` or a new `SandboxedShellCapability`.

#### Scenario: Sandboxed shell execution
- **WHEN** an agent requests execution of untrusted code via the sandboxed shell
- **THEN** the code runs inside the sandbox with all default-deny policies applied
- **AND** stdout, stderr, exit code, and timing are returned in the same `ShellExecResult` format
- **AND** the caller does not need to know which underlying runtime is used

#### Scenario: Trusted vs untrusted execution paths
- **WHEN** trusted commands are executed (agent's own scripts, known-safe operations)
- **THEN** the existing `ShellCapability` with `Deno.Command` is used (no sandbox overhead)
- **AND** when untrusted/LLM-generated code is executed, the sandboxed path is used instead
