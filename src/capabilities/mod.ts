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
