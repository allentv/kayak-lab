## 1. System Setup

- [x] 1.1 Add user to kvm group: `sudo usermod -aG kvm allen`. Verify: `groups` includes `kvm`. (Needed for future Firecracker; optional for gVisor)
- [x] 1.2 Install gVisor: `sudo apt-get update && sudo apt-get install -y runsc`. Verify: `runsc --version` returns version info
- [x] 1.3 Register gVisor as Docker runtime: `sudo runsc install && sudo systemctl restart docker`. Verify: `docker info --format '{{json .Runtimes}}'` includes `runsc`
- [x] 1.4 Create setup script `scripts/setup-sandbox.sh` that performs steps 1.1-1.3 idempotently (checks before acting). Verify: running twice produces no errors and reports "already configured"

## 2. Type Definitions

- [x] 2.1 Define `ISandboxRuntime` interface in `src/capabilities/sandbox/types.ts` with `execute(config: SandboxExecConfig): Promise<SandboxExecResult>`, `healthCheck(): Promise<HealthStatus>`, and `setup(): Promise<void>`. Verify: `deno check` passes
- [x] 2.2 Define `SandboxExecConfig` type: command string, working directory, env vars, mounts (input/output), resource limits (cpu, memory, pids, timeout), deno permission flags. Verify: type compiles and matches spec requirements
- [x] 2.3 Define `SandboxExecResult` type: stdout, stderr, exit code, duration_ms, timed_out, output files. Verify: type compiles and is compatible with existing `ShellExecResult` format

## 3. Docker Runtime

- [x] 3.1 Create `src/capabilities/sandbox/docker-runtime.ts` implementing `ISandboxRuntime` using `Deno.Command("docker", [...])`. Start with basic execute that builds the Docker run command from config. Verify: can run `echo hello` in a container and get stdout
- [x] 3.2 Add default-deny Docker flags: `--rm --network=none --read-only --cap-drop=ALL --security-opt=no-new-privileges --user=65532:65532 --pids-limit=128 --memory=512m --cpus=1`. Verify: running `curl` inside container fails (no network), `whoami` returns `nobody`
- [x] 3.3 Add file mount support: read-only input bind mounts, writable tmpfs for /tmp and output directory. Verify: input file readable inside container, output file written to tmpfs, output extracted to host after execution
- [x] 3.4 Add resource limit configuration: make CPU, memory, PID limit, timeout configurable via `SandboxExecConfig`. Verify: setting `memory: "128m"` kills process exceeding 128MB, setting `timeout_ms: 1000` kills long-running process
- [x] 3.5 Add output truncation: truncate stdout/stderr at configured byte limit (default 1MB). Verify: command producing >1MB output returns truncated result

## 4. gVisor Runtime

- [x] 4.1 Create `src/capabilities/sandbox/gvisor-runtime.ts` extending or wrapping Docker runtime with `--runtime=runsc` flag. Verify: running `dmesg` inside container shows "Starting gVisor..." message
- [x] 4.2 Add `healthCheck()` implementation: verify runtime is installed, Docker recognizes it, test container executes, syscall filtering works (e.g. `ptrace` fails inside container). Verify: healthCheck returns pass on configured system
- [x] 4.3 Verify gVisor I/O overhead is acceptable: run a file-intensive benchmark inside gVisor vs plain Docker, confirm <30% overhead for typical Deno workloads. Verify: benchmark results documented

## 5. SandboxedShell

- [x] 5.1 Create `src/capabilities/sandboxed-shell.ts` implementing `IShellCapability`, delegating to `ISandboxRuntime` for execution. Verify: `deno check` passes, implements full interface
- [x] 5.2 Add Deno permission flags layer: when command contains `deno run`, inject `--no-prompt --cached-only --frozen --deny-net --deny-env --deny-run --deny-ffi` before the script path. Verify: Deno code inside sandbox cannot access network or filesystem beyond mounts
- [x] 5.3 Map `ShellExecResult` from `SandboxExecResult`: ensure exit_code, stdout, stderr, duration_ms, timed_out all transfer correctly. Verify: existing ShellCapability tests pass with SandboxedShellCapability as substitute
- [x] 5.4 Add sandbox-specific options to `ShellExecOptions`: resource_limits, input_mounts, output_dir, runtime (docker/gvisor). Verify: options are passed through to runtime config

## 6. Health Checks

- [x] 6.1 Create `scripts/sandbox-health-check.sh` that verifies: Docker installed, runsc runtime registered, test container runs with gVisor, network isolation works, resource limits enforced, /tmp writable. Verify: script outputs pass/fail per check with diagnostic messages
- [x] 6.2 Add `healthCheck()` to `ISandboxRuntime` interface implementations. Verify: returns structured status with per-check results
- [x] 6.3 Document health check output in README or agent documentation. Verify: agents can reference health check results to confirm sandbox availability

## 7. Tests

- [x] 7.1 Write unit tests for Docker runtime: mock `Deno.Command`, verify correct Docker flags assembled from config. Verify: `deno test` passes
- [x] 7.2 Write unit tests for gVisor runtime: verify `--runtime=runsc` flag added, healthCheck logic. Verify: `deno test` passes
- [x] 7.3 Write integration tests for SandboxedShellCapability: execute real commands in sandbox (requires Docker), verify stdout/stderr/exit_code, verify timeout kills process, verify output truncation. Verify: `deno test --allow-run=deno` passes
- [x] 7.4 Write tests for Deno permission injection: verify permission flags correctly inserted for `deno run` commands, verify non-Deno commands pass through unchanged. Verify: `deno test` passes
- [x] 7.5 Verify existing 112+ tests still pass. Verify: `deno test --allow-read --allow-env --allow-run` passes with no regressions

## 8. Documentation

- [x] 8.1 Update `docs/capabilities.md` with sandbox-execution capability: purpose, setup requirements, usage examples, configuration options. Verify: documentation renders correctly
- [x] 8.2 Update `docs/learnings.md` with sandbox-related patterns: gVisor setup gotchas, Docker hardening flags, Deno permission layering, escape vectors to watch for. Verify: learnings are actionable for future developers
- [x] 8.3 Add sandbox usage examples to README or docs: how to execute untrusted code, how to switch between runtimes, how to configure resource limits. Verify: examples are copy-pasteable and work
