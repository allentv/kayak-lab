/**
 * Capabilities module exports.
 *
 * Typed interfaces for external system access.
 */

// Base capability
export {
  CapabilityRegistry,
  CapabilityError,
  CapabilityNotInitializedError,
  CapabilityExecutionError,
} from "./capability.ts";

export type {
  CapabilityDefinition,
  CapabilityContext,
  CapabilityResult,
  ICapability,
  RateLimitConfig,
} from "./capability.ts";

// Git capability
export { GitCapability } from "./git.ts";

export type {
  IGitCapability,
  GitFileChange,
  GitBranch,
  GitCommit,
  GitStatus,
  FileStatus,
} from "./git.ts";

// Shell capability
export { ShellCapability } from "./shell.ts";

export type {
  IShellCapability,
  ShellExecOptions,
  ShellExecResult,
  ShellEnvironment,
} from "./shell.ts";

// GitHub capability
export { GitHubCapability } from "./github.ts";

export type {
  IGitHubCapability,
  GitHubRepository,
  GitHubIssue,
  GitHubPullRequest,
  GitHubWorkflow,
  GitHubWorkflowRun,
  IssueState,
  PullRequestState,
  GitHubComment,
} from "./github.ts";

// File capability
export { FileCapability } from "./file.ts";

export type {
  IFileCapability,
  DirectoryEntry,
  FileReadData,
  FileReadOptions,
  FileEditOptions,
  FileWriteData,
  FileEditData,
} from "./file.ts";

// Search capability
export { SearchCapability } from "./search.ts";

export type {
  ISearchCapability,
  GrepMatch,
  GrepOptions,
  GlobOptions,
} from "./search.ts";

// Kubernetes capability
export { KubernetesCapability } from "./kubernetes.ts";

export type {
  IKubernetesCapability,
  ResourceStatus,
  ResourcePhase,
  KubernetesPod,
  KubernetesService,
  KubernetesServicePort,
  KubernetesDeployment,
  KubernetesNamespace,
  KubernetesEvent,
} from "./kubernetes.ts";

// Sandbox execution
export { SandboxedShellCapability } from "./sandboxed-shell.ts";
export type { SandboxedShellExecOptions } from "./sandboxed-shell.ts";
export {
  DockerRuntime,
  GVisorRuntime,
} from "./sandbox/mod.ts";
export type {
  ISandboxRuntime,
  SandboxExecConfig,
  SandboxExecResult,
  SandboxResourceLimits,
  SandboxMount,
  HealthStatus,
  HealthCheckResult,
  DockerRuntimeConfig,
  GVisorRuntimeConfig,
} from "./sandbox/mod.ts";
