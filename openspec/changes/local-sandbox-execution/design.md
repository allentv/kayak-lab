## Context

kayak-lab's `ShellCapability` (src/capabilities/shell.ts) executes commands via `Deno.Command("sh", ["-c", commandStr])` with application-layer string matching for blocked/dangerous commands. This provides UX safety (requiring approval for risky commands) but no OS-level isolation. The project needs a way to execute LLM-generated or user-supplied code with real containment.

The host machine (Ubuntu Linux, Intel Meteor Lake) has Docker 29.5.3 installed with `runc` runtime. `/dev/kvm` exists but the user is not in the `kvm` group. gVisor `runsc` is not installed. The project uses Deno 2.9 with TypeScript.

## Goals / Non-Goals

**Goals:**
- OS-level sandboxed execution for untrusted code on local Linux dev machines
- Runtime-agnostic interface — swappable between Docker, Docker+gVisor, and potentially Firecracker
- Default-deny security: no network, read-only rootfs, dropped capabilities, PID limits
- Complementary Deno permission flags for Deno-based workloads
- Setup scripts and health checks for developer onboarding
- Integration point for existing ShellCapability

**Non-Goals:**
- Production multi-tenant deployment (use @deno/sandbox, e2b, or Firecracker+Jailer for that)
- Firecracker microVM implementation — evaluated but out of scope for initial implementation due to local UX complexity
- macOS/Windows support — Linux-only for now (gVisor and KVM require Linux)
- GPU passthrough inside sandbox
- Network namespace management or complex TAP/bridge networking
- Persistent sandbox state between executions

## Decisions

### D1: gVisor (`runsc`) as the recommended runtime

**Decision:** Docker + gVisor (`runsc`) is the primary recommended sandbox runtime.

**Rationale:**
- Three-command setup: `apt install runsc`, `runsc install`, `systemctl restart docker`
- Two-layer escape resistance: Sentry userspace kernel + seccomp profile on Sentry itself
- Same Docker CLI UX — `--runtime=runsc` is the only difference
- Millisecond startup, ~0% compute overhead, 10-30% I/O overhead (irrelevant for Deno code)
- No KVM dependency (uses `systrap` platform by default; KVM is optional alternative)
- Battle-tested: used in GKE Sandbox, Google Cloud Run

**Alternatives considered:**
- Plain Docker: Rejected as primary — shared kernel means kernel CVE = blast radius across all containers. Acceptable fallback when gVisor unavailable.
- Firecracker: Rejected for local dev — requires guest kernel/rootfs images, TAP networking, guest agent, lifecycle CLI. Production-grade isolation but developer UX cost too high. Documented for future consideration.

### D2: Runtime abstraction via ISandboxRuntime interface

**Decision:** Define an `ISandboxRuntime` interface that all sandbox implementations must satisfy.

**Rationale:**
- Allows switching between Docker and Docker+gVisor without changing caller code
- Makes it possible to add Firecracker later without architectural changes
- Enables testing with mock runtimes
- Interface should be minimal: `execute(config) → result`, `healthCheck() → status`, `setup() → void`

### D3: Docker flags for hardening

**Decision:** Every sandbox execution applies this flag set:

```
--rm                           # ephemeral container
--network=none                 # no network by default
--read-only                    # read-only rootfs
--cap-drop=ALL                 # drop all Linux capabilities
--security-opt=no-new-privileges  # prevent privilege escalation
--user=65532:65532             # non-root user (nobody)
--pids-limit=128               # prevent fork bombs
--memory=512m                  # memory cap
--cpus=1                       # CPU cap
--tmpfs /tmp:rw,nosuid,nodev,size=64m  # writable /tmp (noexec removed for Deno JIT)
```

**Rationale:**
- Follows Docker security best practices (2026 guides)
- `--cap-drop=ALL` is stronger than Docker's default reduced capability set
- `--user=65532` avoids root execution; non-root user in image preferred when available
- `--pids-limit=128` prevents fork bomb DoS
- `--tmpfs /tmp` without `noexec` because Deno (and some compilers) need executable temp mappings
- `--network=none` is the default; specific hosts allowlisted via `--add-host` or network configuration when needed

### D4: File transfer via bind mounts and tmpfs

**Decision:** Input files via read-only bind mounts; output via tmpfs or writable bind mount extracted post-execution.

**Rationale:**
- Bind mounts are zero-copy and Docker-native
- Read-only input mounts prevent sandbox from modifying host files
- Tmpfs for output avoids disk writes and is automatically cleaned up
- Post-execution extraction copies output from container to host
- Output files treated as untrusted — validated before host exposure

### D5: Deno permission flags as complementary layer

**Decision:** When executing Deno code inside the sandbox, add `--no-prompt --cached-only --frozen --deny-net --deny-env --deny-run --deny-ffi` to the command.

**Rationale:**
- Defense in depth: even if sandbox escape occurs, Deno permissions provide a second barrier
- `--no-prompt` prevents interactive permission requests (would hang in non-interactive container)
- `--cached-only` + `--frozen` prevents supply-chain attacks via dependency changes
- Explicit deny flags override any accidental allow flags

### D6: Integration as SandboxedShellCapability

**Decision:** Create a new `SandboxedShellCapability` implementing the existing `IShellCapability` interface, delegating to `ISandboxRuntime` internally.

**Rationale:**
- Preserves the existing API contract — callers don't need to change
- Allows runtime selection: trusted code goes through `ShellCapability`, untrusted through `SandboxedShellCapability`
- Clean separation: existing `ShellCapability` stays untouched for trusted execution
- `SandboxedShellCapability` adds sandbox-specific options (resource limits, file mounts) via `ShellExecOptions` extension

### D7: Deno inside Docker image

**Decision:** Use `denoland/deno:latest` as the base image for Deno execution sandboxes.

**Rationale:**
- Official Deno Docker image, maintained by Deno team
- Includes Deno binary, minimal Debian base
- Multi-arch support (x86_64, aarch64)
- For non-Deno code, a custom image or `ubuntu:24.04` with runtime-specific packages

## Risks / Trade-offs

### Shared kernel (Docker/gVisor)
- **Risk:** gVisor reduces kernel attack surface but doesn't eliminate it. A vulnerability in Sentry itself could compromise the host.
- **Mitigation:** gVisor's Sentry has its own seccomp profile. Combined with Docker hardening flags, this is two+ independent layers. Acceptable for dev machines; not for hostile multi-tenant.

### I/O overhead with gVisor
- **Risk:** 10-30% I/O overhead could slow file-heavy workloads.
- **Mitigation:** Deno code execution is typically compute-bound (type checking, transpilation, running). I/O-heavy workloads (large file processing) may need plain Docker as fallback.

### Deno image size
- **Risk:** `denoland/deno` image is ~120MB. Pulling on first use adds latency.
- **Mitigation:** Pre-pull during setup script. Image is cached locally after first pull.

### Setup requires root for initial install
- **Risk:** `apt install runsc` and `runsc install` require sudo.
- **Mitigation:** One-time setup, documented in script. Runtime usage does not require root.

### tmpfs without noexec
- **Risk:** Executable mappings in /tmp could be exploited.
- **Mitigation:** Container has no network, dropped capabilities, non-root user. The exploit chain requires sandbox escape first, at which point the container's restrictions are the primary barrier.

### Firecracker deferred
- **Risk:** If Docker+gVisor proves insufficient for a future use case, Firecracker integration will be significant work.
- **Mitigation:** The `ISandboxRuntime` interface is designed to accommodate Firecracker. The interface doesn't assume Docker — it takes a command, mounts, and resource limits. Firecracker would implement these via kernel/rootfs images + vsock agent.
