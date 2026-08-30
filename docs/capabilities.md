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
