/**
 * Sandbox execution types and interfaces.
 *
 * Provides OS-level sandboxed execution of untrusted code,
 * decoupled from the specific container/VM technology.
 */

// ============================================================================
// Sandbox Configuration
// ============================================================================

/** Resource limits for sandbox execution. */
export interface SandboxResourceLimits {
  /** CPU cores limit (default: 1). */
  cpus?: number;
  /** Memory limit as string e.g. "512m", "1g" (default: "512m"). */
  memory?: string;
  /** Maximum number of processes/PIDs (default: 128). */
  pids?: number;
  /** Execution timeout in milliseconds (default: 30000). */
  timeout_ms?: number;
}

/** File mount configuration. */
export interface SandboxMount {
  /** Host path to mount. */
  host_path: string;
  /** Path inside the container. */
  container_path: string;
  /** Whether the mount is read-only (default: false for output, true for input). */
  read_only?: boolean;
}

/** Configuration for sandboxed command execution. */
export interface SandboxExecConfig {
  /** Command to execute. */
  command: string;
  /** Working directory inside the container. */
  working_directory?: string;
  /** Environment variables. */
  env?: Record<string, string>;
  /** Resource limits. */
  resource_limits?: SandboxResourceLimits;
  /** Input file mounts (read-only). */
  input_mounts?: SandboxMount[];
  /** Output directory mount (writable). */
  output_mount?: SandboxMount;
  /** Docker image to use (default: "denoland/deno:latest"). */
  image?: string;
  /** Additional Docker flags. */
  extra_flags?: string[];
  /** Maximum stdout/stderr size in bytes before truncation (default: 1MB). */
  max_output_bytes?: number;
}

// ============================================================================
// Sandbox Result
// ============================================================================

/** Result of sandboxed command execution. */
export interface SandboxExecResult {
  /** Command exit code. */
  exit_code: number;
  /** Standard output (may be truncated). */
  stdout: string;
  /** Standard error (may be truncated). */
  stderr: string;
  /** Execution duration in milliseconds. */
  duration_ms: number;
  /** Whether the command was killed due to timeout. */
  timed_out: boolean;
  /** Whether output was truncated. */
  truncated: boolean;
}

// ============================================================================
// Health Check
// ============================================================================

/** Status of a single health check. */
export interface HealthCheckResult {
  /** Check name. */
  name: string;
  /** Whether the check passed. */
  passed: boolean;
  /** Diagnostic message (especially on failure). */
  message: string;
}

/** Overall health status. */
export interface HealthStatus {
  /** Whether all checks passed. */
  healthy: boolean;
  /** Individual check results. */
  checks: HealthCheckResult[];
}

// ============================================================================
// Sandbox Runtime Interface
// ============================================================================

/**
 * Interface for sandbox runtime implementations.
 *
 * All sandbox runtimes (Docker, gVisor, etc.) implement this interface,
 * allowing callers to swap implementations without code changes.
 */
export interface ISandboxRuntime {
  /** Runtime name for identification. */
  readonly name: string;

  /** Execute a command inside the sandbox. */
  execute(config: SandboxExecConfig): Promise<SandboxExecResult>;

  /** Check if the runtime is healthy and available. */
  healthCheck(): Promise<HealthStatus>;

  /** Perform one-time setup (e.g. pull images, verify installation). */
  setup(): Promise<void>;
}
