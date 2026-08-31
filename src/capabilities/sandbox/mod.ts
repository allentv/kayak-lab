/**
 * Sandbox execution module.
 *
 * OS-level sandboxed execution for untrusted code.
 */

// Types
export type {
  ISandboxRuntime,
  SandboxExecConfig,
  SandboxExecResult,
  SandboxResourceLimits,
  SandboxMount,
  HealthStatus,
  HealthCheckResult,
} from "./types.ts";

// Runtime implementations
export { DockerRuntime } from "./docker-runtime.ts";
export type { DockerRuntimeConfig } from "./docker-runtime.ts";

export { GVisorRuntime } from "./gvisor-runtime.ts";
export type { GVisorRuntimeConfig } from "./gvisor-runtime.ts";
