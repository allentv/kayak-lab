/**
 * Sandboxed shell capability.
 *
 * Executes commands inside an OS-level sandbox via ISandboxRuntime.
 * Provides the same IShellCapability interface as ShellCapability
 * but with OS-level isolation for untrusted code.
 */

import {
  type CapabilityDefinition,
  type CapabilityContext,
  type CapabilityResult,
  CapabilityNotInitializedError,
} from "./capability.ts";
import type {
  IShellCapability,
  ShellExecOptions,
  ShellExecResult,
  ShellEnvironment,
} from "./shell.ts";
import type {
  ISandboxRuntime,
  SandboxExecConfig,
  SandboxResourceLimits,
  SandboxMount,
} from "./sandbox/types.ts";

/** Extended options for sandboxed shell execution. */
export interface SandboxedShellExecOptions extends ShellExecOptions {
  /** Resource limits for the sandbox. */
  resource_limits?: SandboxResourceLimits;
  /** Input file mounts. */
  input_mounts?: SandboxMount[];
  /** Output directory mount. */
  output_mount?: SandboxMount;
  /** Runtime to use (docker, gvisor). Falls back to configured default. */
  runtime?: "docker" | "gvisor";
}

/** Default resource limits for sandboxed execution. */
const DEFAULT_SANDBOX_LIMITS: SandboxResourceLimits = {
  cpus: 1,
  memory: "512m",
  pids: 128,
  timeout_ms: 30_000,
};

/**
 * Shell capability that executes commands inside an OS-level sandbox.
 */
export class SandboxedShellCapability implements IShellCapability {
  readonly definition: CapabilityDefinition = {
    name: "sandboxed-shell",
    description: "Executes commands inside an OS-level sandbox for untrusted code",
    version: "1.0.0",
  };

  private runtime: ISandboxRuntime;
  private context?: CapabilityContext;
  private _initialized = false;

  constructor(runtime: ISandboxRuntime) {
    this.runtime = runtime;
  }

  async initialize(context: CapabilityContext): Promise<void> {
    this.context = context;
    this._initialized = true;
  }

  async dispose(): Promise<void> {
    this._initialized = false;
    this.context = undefined;
  }

  async exec(
    command: string,
    options?: SandboxedShellExecOptions,
  ): Promise<CapabilityResult<ShellExecResult>> {
    if (!this._initialized) {
      throw new CapabilityNotInitializedError("SandboxedShellCapability not initialized");
    }

    const startTime = Date.now();

    // Inject Deno permission flags if this is a Deno command
    const processedCommand = this.injectDenoPermissions(command);

    // Build sandbox config from options
    const config: SandboxExecConfig = {
      command: processedCommand,
      working_directory: options?.cwd ?? this.context?.working_directory,
      env: options?.env,
      resource_limits: {
        ...DEFAULT_SANDBOX_LIMITS,
        ...options?.resource_limits,
        // Use ShellExecOptions timeout if provided
        ...(options?.timeout_ms ? { timeout_ms: options.timeout_ms } : {}),
      },
      input_mounts: options?.input_mounts,
      output_mount: options?.output_mount,
      max_output_bytes: options?.max_output_bytes,
    };

    try {
      const result = await this.runtime.execute(config);

      return {
        success: true,
        data: {
          exit_code: result.exit_code,
          stdout: result.stdout,
          stderr: result.stderr,
          duration_ms: result.duration_ms,
          timed_out: result.timed_out,
        },
        metadata: {
          truncated: result.truncated,
          sandbox_runtime: this.runtime.name,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        data: {
          exit_code: 1,
          stdout: "",
          stderr: err instanceof Error ? err.message : String(err),
          duration_ms: Date.now() - startTime,
          timed_out: false,
        },
      };
    }
  }

  async getEnvironment(): Promise<CapabilityResult<ShellEnvironment>> {
    return {
      success: true,
      data: {
        platform: "sandbox",
        shell: "sh",
        arch: "x86_64",
        home: "/workspace",
        user: "nobody (65532)",
      },
    };
  }

  async commandExists(name: string): Promise<CapabilityResult<boolean>> {
    const result = await this.exec(`which ${name}`);
    return {
      success: true,
      data: result.success && result.data?.exit_code === 0,
    };
  }

  async getWorkingDirectory(): Promise<CapabilityResult<string>> {
    return {
      success: true,
      data: this.context?.working_directory ?? "/workspace",
    };
  }

  async setWorkingDirectory(path: string): Promise<CapabilityResult<void>> {
    if (this.context) {
      this.context.working_directory = path;
    }
    return { success: true };
  }

  /**
   * Inject Deno permission flags for Deno commands.
   *
   * Defense in depth: even if sandbox escape occurs, Deno permissions
   * provide a second barrier.
   */
  private injectDenoPermissions(command: string): string {
    // Only inject for deno commands
    if (!command.match(/\bdeno\s+run\b/)) {
      return command;
    }

    // Deno permission flags for sandboxed execution
    const deniedFlags = [
      "--no-prompt",           // Never ask for permissions interactively
      "--cached-only",         // Only use cached dependencies
      "--frozen",              // Lock file is immutable
      "--deny-net",            // No network access
      "--deny-env",            // No env var access beyond what's passed
      "--deny-run",            // No subprocess spawning
      "--deny-ffi",            // No FFI/native code
    ];

    // Insert flags before the script path (after "deno run")
    // Pattern: deno run [flags] script.ts [args]
    return command.replace(
      /(\bdeno\s+run\b)/,
      `$1 ${deniedFlags.join(" ")}`,
    );
  }
}
