## Why

kayak-lab's `ShellCapability` executes commands on behalf of agents using `Deno.Command`, but relies on application-layer string matching (blocked/dangerous command lists) for safety. This is UX filtering, not isolation — a determined caller can bypass it. As agents gain the ability to execute LLM-generated or user-supplied code, we need OS-level sandboxing to contain damage from accidental overreach or hostile input. The goal is a local sandbox solution that works on a developer's Linux machine without requiring cloud services.

## What Changes

- Add a new **SandboxedShellCapability** that wraps command execution in an OS-level sandbox
- Evaluate and select between three local sandbox approaches: Docker (hardened), Docker + gVisor (`runsc`), and Firecracker microVMs
- Define a sandbox abstraction interface that decouples kayak-lab from the specific isolation technology
- Document escape vectors, threat model, and appropriate isolation depth for each use case
- Provide setup scripts and configuration for the chosen sandbox runtime on Linux

## Capabilities

### New Capabilities

- `sandbox-execution`: OS-level sandbox abstraction for running untrusted code locally. Covers runtime selection, configuration, execution interface, resource limits, and security hardening.

### Modified Capabilities

- `shell` (existing): The current `ShellCapability` remains for trusted command execution. The new sandbox capability provides an alternative execution path for untrusted/LLM-generated code, not a replacement.

## Research Summary

### Local Sandbox Options Evaluated

#### Option 1: Docker (hardened)
- **Isolation level:** Level 1-2 (namespaces + cgroups + seccomp + capabilities)
- **Setup:** Already installed (Docker 29.5.3), zero additional setup
- **Startup:** Milliseconds, near-zero memory overhead
- **Key flags:** `--network=none --read-only --cap-drop=ALL --security-opt=no-new-privileges --user=65532:65532 --pids-limit=128 --memory=512m`
- **Weakness:** Shared kernel — kernel CVEs (e.g. CVE-2024-1086) compromise all containers simultaneously
- **Verdict:** Good for single-tenant trusted/semi-trusted code on dev machines

#### Option 2: Docker + gVisor (`runsc`)
- **Isolation level:** Level 3 (userspace kernel syscall interception)
- **Setup:** `apt install runsc && runsc install && systemctl restart docker` (~3 commands)
- **Startup:** Milliseconds, ~0% compute overhead, 10-30% I/O overhead
- **Key advantage:** Two-layer escape resistance — attacker must break out of Sentry userspace kernel AND defeat seccomp profile protecting Sentry itself
- **Weakness:** Some obscure syscalls not fully implemented; no GPU passthrough
- **Verdict:** Best balance of isolation strength vs setup cost for local dev

#### Option 3: Firecracker microVMs
- **Isolation level:** Level 4 (dedicated Linux kernel per execution)
- **Setup:** High — needs KVM group membership, guest kernel image, rootfs image, TAP networking, guest agent/vsock, lifecycle management CLI
- **Startup:** ~125ms cold boot, ~5MB overhead per VM, 28ms with snapshots
- **Weakness:** Local developer UX is not polished; Firecracker is a VMM primitive, not a dev tool
- **Verdict:** Overkill for local dev; appropriate for production multi-tenant or via managed services (@deno/sandbox, e2b)

### Host Machine Status

| Resource | Status |
|---|---|
| `/dev/kvm` | Present (root:kvm, 660) |
| User in `kvm` group | No — needs `sudo usermod -aG kvm allen` |
| Docker | v29.5.3, `runc` runtime only |
| gVisor `runsc` | Not installed |
| User in `docker` group | Yes |

### Deno Permission Model (complementary layer)

Deno 2's `--allow-*` / `--deny-*` flags provide JS-level permission gating. Useful as a complementary layer inside any sandbox, but NOT a security boundary on its own. Escape routes to block:
- `--allow-run` — child processes get own OS privileges, can spawn new Deno with `--allow-all`
- `--allow-ffi` — native code runs outside Deno's permission checks
- `eval()` / dynamic imports — execute arbitrary code at current privilege level

### Decision Framework

| Scenario | Recommended Approach |
|---|---|
| Agent runs own trusted scripts | Docker with hardened flags |
| Agent runs LLM-generated code, single tenant | Docker + gVisor `runsc` |
| Multi-tenant untrusted code from users | Firecracker microVMs or managed service |
| Financial/medical/PII workloads | Firecracker + network allowlist + secret injection |

### Escape Vectors to Defend Against

1. **Docker socket mount** — mounting `/var/run/docker.sock` inside container = host root
2. **Symlink traversal** — path prefix checks bypassable via symlinks; use `realpath()` before checking
3. **Configuration file poisoning** — agent writes to `~/.gitconfig` or IDE hooks for persistence outside sandbox
4. **`--allow-run` escape** — allowing subprocess execution voids Deno permission restrictions
5. **Kernel CVE propagation** — all containers on unpatched host simultaneously vulnerable
6. **DNS exfiltration** — encoding data in DNS query hostnames bypasses IP/port egress filters
