# Capabilities

Capabilities are abstract interfaces for external systems. They decouple the agent runtime from specific implementations, enabling testing with mocks and swapping implementations without code changes.

## Interface

All capabilities implement `ICapability`:

```typescript
interface ICapability {
  readonly definition: CapabilityDefinition;
  initialize(context: CapabilityContext): Promise<void>;
  dispose(): Promise<void>;
}

interface CapabilityDefinition {
  name: string;        // e.g., "shell", "git", "github"
  description: string;
  version: string;
}

interface CapabilityContext {
  session_id: string;
  working_directory?: string;
  environment?: Record<string, string>;
}
```

Results follow a consistent pattern:

```typescript
interface CapabilityResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}
```

## Available Capabilities

### Shell

Real execution via `Deno.Command`. Includes safety constraints.

```typescript
import { ShellCapability } from "./src/capabilities/shell.ts";

const shell = new ShellCapability();
await shell.initialize({ session_id: "my-session" });

const result = await shell.exec("ls -la", { cwd: "/tmp" });
if (result.success) {
  console.log(result.data.stdout);
}
```

**Safety constraints:**

| List | Behavior | Examples |
|------|----------|---------|
| Blocked | Always rejected | `rm -rf /`, `dd`, `mkfs` |
| Dangerous | Requires approval | `git push`, `kubectl delete` |

### Git

Stubbed implementation — returns simulated data. Interface defined for future real implementation.

```typescript
import { GitCapability } from "./src/capabilities/git.ts";

const git = new GitCapability();
await git.initialize({ session_id: "my-session" });

const status = await git.getStatus();
// Returns simulated: { branch: "main", changes: [], ... }
```

**Interface methods:**

| Method | Returns |
|--------|---------|
| `getStatus()` | `GitStatus` — branch, changes, stashed count |
| `getChanges()` | `GitFileChange[]` — modified files |
| `stage(paths)` | Stage files for commit |
| `unstage(paths)` | Unstage files |
| `commit(message)` | `GitCommit` — hash, author, date |
| `getHistory(limit?)` | `GitCommit[]` — commit history |
| `getBranches()` | `GitBranch[]` — all branches |
| `createBranch(name)` | Create new branch |
| `switchBranch(name)` | Switch to branch |

### GitHub

Stubbed implementation — returns simulated data. Interface defined for future real implementation.

```typescript
import { GitHubCapability } from "./src/capabilities/github.ts";

const github = new GitHubCapability();
await github.initialize({ session_id: "my-session" });

const issues = await github.listIssues({ state: "open" });
// Returns simulated: []
```

**Interface methods:**

| Method | Returns |
|--------|---------|
| `getRepository()` | `GitHubRepository` — repo info |
| `listIssues(options?)` | `GitHubIssue[]` — issues |
| `getIssue(number)` | `GitHubIssue` — single issue |
| `createIssue(issue)` | `GitHubIssue` — created issue |
| `updateIssue(number, update)` | `GitHubIssue` — updated issue |
| `listPullRequests(options?)` | `GitHubPullRequest[]` — PRs |
| `getPullRequest(number)` | `GitHubPullRequest` — single PR |
| `createPullRequest(pr)` | `GitHubPullRequest` — created PR |
| `mergePullRequest(number, options?)` | `GitHubPullRequest` — merged PR |

### Kubernetes

Stubbed implementation — returns simulated data. Interface defined for future real implementation.

```typescript
import { KubernetesCapability } from "./src/capabilities/kubernetes.ts";

const k8s = new KubernetesCapability();
await k8s.initialize({ session_id: "my-session" });

const pods = await k8s.listPods("default");
// Returns simulated: [{ name: "pod-1", status: "Running", ... }]
```

### Memory

Persistent memory subsystem for agent learning and context retention. Provides 4 memory types (episodic, semantic, procedural, working) with a provider abstraction supporting multiple storage backends.

```typescript
import { MemoryProvider } from "../src/memory/provider.ts";

const memory = new MemoryProvider(config);
await memory.initialize();

// Store episodic memory
await memory.store({ type: "episodic", content: "User prefers dark mode" });

// Retrieve relevant memories
const results = await memory.search({ query: "user preferences", type: "semantic" });
```

Key interfaces: MemoryProvider, MemoryStorage, MemoryRetrieval, MemorySearch, SharedMemory

### MCP Integration

Model Context Protocol client and server for external tool integration.

```typescript
import { MCPClient } from "../src/mcp/client.ts";
import { MCPServer } from "../src/mcp/server.ts";

const client = new MCPClient(transport);
await client.connect();
const tools = await client.discoverTools();

const server = new MCPServer({ name: "my-server", tools: [...] });
await server.start();
```

Key interfaces: MCPClient, MCPServer, MCPRegistry, MCPSearch

### Sandbox

OS-level sandboxed execution for untrusted code. Runs commands inside Docker containers with hardened security flags. Supports Docker and gVisor (`runsc`) runtimes.

```typescript
import { DockerRuntime } from "./src/capabilities/sandbox/docker-runtime.ts";
import { SandboxedShellCapability } from "./src/capabilities/sandboxed-shell.ts";

const runtime = new DockerRuntime();
const shell = new SandboxedShellCapability(runtime);
await shell.initialize({ session_id: "my-session" });

// Execute in sandbox — no network, read-only rootfs, dropped capabilities
const result = await shell.exec("echo hello");
if (result.success) {
  console.log(result.data.stdout); // "hello"
}
```

**Security posture (default-deny):**

| Flag | Effect |
|------|--------|
| `--network=none` | No network access |
| `--read-only` | Read-only root filesystem |
| `--cap-drop=ALL` | Drop all Linux capabilities |
| `--security-opt=no-new-privileges` | Prevent privilege escalation |
| `--user=65532:65532` | Run as non-root (nobody) |
| `--pids-limit=128` | Prevent fork bombs |
| `--memory=512m` | Memory cap |
| `--cpus=1` | CPU cap |

**Runtime implementations:**

| Runtime | Isolation | Setup |
|---------|-----------|-------|
| `DockerRuntime` | Container namespaces + cgroups | Docker installed |
| `GVisorRuntime` | Userspace kernel (Sentry) | `apt install runsc` |

**Resource limits:**

```typescript
const result = await shell.exec("long-task", {
  resource_limits: {
    memory: "256m",
    cpus: 0.5,
    pids: 64,
    timeout_ms: 10_000,
  },
});
```

**File mounts:**

```typescript
const result = await shell.exec("process-data", {
  input_mounts: [{ host_path: "./input", container_path: "/data/input", read_only: true }],
  output_mount: { host_path: "./output", container_path: "/data/output" },
});
```

**Health check:**

```typescript
const runtime = new DockerRuntime();
const status = await runtime.healthCheck();
console.log(status.healthy); // true if Docker + runtime working
```

**Health check output (Docker):**

| Check | Description |
|-------|-------------|
| `docker-installed` | Docker binary exists on PATH |
| `docker-daemon` | Docker daemon is running |
| `test-execution` | Test container executes successfully |
| `network-isolation` | Network blocking works inside container |

**Health check output (gVisor):**

| Check | Description |
|-------|-------------|
| `docker-installed` | Docker binary exists on PATH |
| `docker-daemon` | Docker daemon is running |
| `runtime-available` | `runsc` runtime is registered with Docker |
| `test-execution` | Test container executes with gVisor |
| `network-isolation` | Network blocking works inside container |
| `ptrace-blocked` | `ptrace` syscall is blocked (gVisor-specific) |

**Shell script:** `scripts/sandbox-health-check.sh` runs all checks with pass/fail output.

## Sandbox Usage Examples

### Executing untrusted code

```typescript
import { GVisorRuntime } from "./src/capabilities/sandbox/gvisor-runtime.ts";
import { SandboxedShellCapability } from "./src/capabilities/sandboxed-shell.ts";

// Use gVisor for untrusted/LLM-generated code
const runtime = new GVisorRuntime();
const shell = new SandboxedShellCapability(runtime);
await shell.initialize({ session_id: "untrusted-exec" });

// Code runs with: no network, read-only rootfs, dropped capabilities, non-root user
const result = await shell.exec("deno run untrusted-script.ts");
```

### Switching between runtimes

```typescript
import { DockerRuntime } from "./src/capabilities/sandbox/docker-runtime.ts";
import { GVisorRuntime } from "./src/capabilities/sandbox/gvisor-runtime.ts";
import { SandboxedShellCapability } from "./src/capabilities/sandboxed-shell.ts";

// Trusted code — plain Docker (faster, no gVisor overhead)
const trustedShell = new SandboxedShellCapability(new DockerRuntime());

// Untrusted code — gVisor (stronger isolation)
const untrustedShell = new SandboxedShellCapability(new GVisorRuntime());

// Same API, different security posture
await trustedShell.exec("echo safe-command");
await untrustedShell.exec("deno run user-submitted.ts");
```

### Configuring resource limits

```typescript
const result = await shell.exec("heavy-computation", {
  resource_limits: {
    memory: "1g",        // 1GB memory cap
    cpus: 2,             // 2 CPU cores
    pids: 256,           // Max 256 processes
    timeout_ms: 60_000,  // 60 second timeout
  },
});

if (result.data.timed_out) {
  console.log("Process exceeded time limit");
}
```

### File transfer between host and sandbox

```typescript
// Mount input files read-only, capture output
const result = await shell.exec("process-data", {
  input_mounts: [
    { host_path: "./data/input.csv", container_path: "/input/data.csv", read_only: true },
  ],
  output_mount: {
    host_path: "./data/output",
    container_path: "/output",
  },
});

// Output files are extracted to host after execution
```

### Checking sandbox health

```typescript
import { GVisorRuntime } from "./src/capabilities/sandbox/gvisor-runtime.ts";

const runtime = new GVisorRuntime();
const status = await runtime.healthCheck();

if (!status.healthy) {
  const failed = status.checks.filter(c => !c.passed);
  console.log("Sandbox unhealthy:", failed.map(c => `${c.name}: ${c.message}`));
}
```

### Running the health check script

```bash
# Verify sandbox setup
scripts/sandbox-health-check.sh

# Output:
# Docker installed: PASS
# Docker daemon: PASS
# gVisor runtime: PASS
# Test execution: PASS
# Network isolation: PASS
```

## Capability Registry

Capabilities are registered and managed through the `CapabilityRegistry`:

```typescript
import { CapabilityRegistry } from "./src/capabilities/capability.ts";

const registry = new CapabilityRegistry();

// Register capabilities
registry.register(new ShellCapability());
registry.register(new GitCapability());

// Initialize all
await registry.initializeAll({ session_id: "my-session" });

// Get a specific capability
const shell = registry.get("shell");

// Check initialization
registry.isInitialized("shell"); // true

// Dispose all
await registry.disposeAll();
```

## Adding a New Capability

1. Create `src/capabilities/my-capability.ts`
2. Define the interface extending `ICapability`
3. Implement the class
4. Register in `src/capabilities/mod.ts`
5. Write tests in `src/capabilities/__tests__/my-capability.test.ts`

```typescript
import { ICapability, CapabilityDefinition, CapabilityContext, CapabilityResult } from "./capability.ts";

export interface IMyCapability extends ICapability {
  doSomething(params: { input: string }): Promise<CapabilityResult<{ output: string }>>;
}

export class MyCapability implements IMyCapability {
  readonly definition: CapabilityDefinition = {
    name: "my-capability",
    description: "Does something useful",
    version: "1.0.0",
  };

  private context: CapabilityContext | null = null;

  async initialize(context: CapabilityContext): Promise<void> {
    this.context = context;
  }

  async dispose(): Promise<void> {
    this.context = null;
  }

  async doSomething(params: { input: string }): Promise<CapabilityResult<{ output: string }>> {
    if (!this.context) {
      return { success: false, error: "Not initialized" };
    }

    try {
      // Implementation here
      return { success: true, data: { output: `Processed: ${params.input}` } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
```
