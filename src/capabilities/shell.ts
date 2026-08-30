/**
 * Shell capability implementation.
 *
 * Provides typed access to shell command execution with safety constraints.
 */

import {
  ICapability,
  CapabilityDefinition,
  CapabilityContext,
  CapabilityResult,
  CapabilityNotInitializedError,
} from "./capability.ts";

// ============================================================================
// Shell Types
// ============================================================================

/** Shell command execution options. */
export interface ShellExecOptions {
  /** Working directory for the command. */
  cwd?: string;
  /** Environment variables. */
  env?: Record<string, string>;
  /** Timeout in milliseconds. */
  timeout_ms?: number;
  /** Maximum output size in bytes. */
  max_output_bytes?: number;
  /** Run in background. */
  background?: boolean;
}

/** Shell command result. */
export interface ShellExecResult {
  /** Command exit code. */
  exit_code: number;
  /** Standard output. */
  stdout: string;
  /** Standard error. */
  stderr: string;
  /** Execution time in milliseconds. */
  duration_ms: number;
  /** Whether the command was killed due to timeout. */
  timed_out: boolean;
}

/** Shell environment info. */
export interface ShellEnvironment {
  shell: string;
  platform: string;
  arch: string;
  home: string;
  user?: string;
}

// ============================================================================
// Shell Capability Interface
// ============================================================================

/**
 * Interface for shell operations.
 */
export interface IShellCapability extends ICapability {
  /** Execute a command. */
  exec(
    commandStr: string,
    options?: ShellExecOptions,
  ): Promise<CapabilityResult<ShellExecResult>>;

  /** Get environment information. */
  getEnvironment(): Promise<CapabilityResult<ShellEnvironment>>;

  /** Check if a command exists. */
  commandExists(name: string): Promise<CapabilityResult<boolean>>;

  /** Get working directory. */
  getWorkingDirectory(): Promise<CapabilityResult<string>>;

  /** Change working directory. */
  setWorkingDirectory(path: string): Promise<CapabilityResult<void>>;
}

// ============================================================================
// Shell Safety Constraints
// ============================================================================

/** Dangerous commands that require explicit approval. */
const DANGEROUS_COMMANDS = [
  "rm -rf",
  "rm -r",
  "rmdir",
  "mkfs",
  "dd",
  "format",
  "shutdown",
  "reboot",
  "halt",
  "kill",
  "killall",
  "pkill",
  "kill -9",
];

/** Commands that are always blocked. */
const BLOCKED_COMMANDS = [
  "sudo",
  "su",
  "chmod 777",
  "chown",
  "passwd",
];

// ============================================================================
// Shell Capability Implementation
// ============================================================================

/**
 * Shell capability that executes commands with safety constraints.
 */
export class ShellCapability implements IShellCapability {
  readonly definition: CapabilityDefinition = {
    name: "shell",
    description: "Shell command execution",
    version: "1.0.0",
  };

  private context: CapabilityContext | null = null;
  private workingDirectory: string = "";

  async initialize(context: CapabilityContext): Promise<void> {
    this.context = context;
    this.workingDirectory = context.working_directory || Deno.cwd();
  }

  async dispose(): Promise<void> {
    this.context = null;
  }

  async exec(
    commandStr: string,
    options: ShellExecOptions = {},
  ): Promise<CapabilityResult<ShellExecResult>> {
    this.ensureInitialized();

    // Check for blocked commands
    const blockCheck = this.checkBlocked(commandStr);
    if (blockCheck) {
      return {
        success: false,
        error: blockCheck,
      };
    }

    // Check for dangerous commands
    const dangerCheck = this.checkDangerous(commandStr);
    if (dangerCheck) {
      // In production, this would require approval
      return {
        success: false,
        error: `Command requires approval: ${dangerCheck}`,
      };
    }

    const startTime = Date.now();
    const cwd = options.cwd || this.workingDirectory;
    const env = { ...this.context!.environment, ...options.env };
    const timeoutMs = options.timeout_ms || 30000;
    const maxOutputBytes = options.max_output_bytes || 1024 * 1024; // 1MB

    try {
      const cmd = new Deno.Command("sh", {
        args: ["-c", commandStr],
        cwd,
        env,
        stdout: "piped",
        stderr: "piped",
      });

      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

      try {
        const output = await cmd.output();
        clearTimeout(timeoutId);

        const duration_ms = Date.now() - startTime;
        const stdout = new TextDecoder().decode(output.stdout);
        const stderr = new TextDecoder().decode(output.stderr);

        // Truncate if too large
        const truncatedStdout =
          stdout.length > maxOutputBytes
            ? stdout.slice(0, maxOutputBytes) + "\n... (truncated)"
            : stdout;
        const truncatedStderr =
          stderr.length > maxOutputBytes
            ? stderr.slice(0, maxOutputBytes) + "\n... (truncated)"
            : stderr;

        const result: ShellExecResult = {
          exit_code: output.code,
          stdout: truncatedStdout,
          stderr: truncatedStderr,
          duration_ms,
          timed_out: false,
        };

        return { success: true, data: result };
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === "AbortError") {
          // Timeout
          const duration_ms = Date.now() - startTime;
          return {
            success: true,
            data: {
              exit_code: -1,
              stdout: "",
              stderr: "Command timed out",
              duration_ms,
              timed_out: true,
            },
          };
        }

        throw error;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getEnvironment(): Promise<CapabilityResult<ShellEnvironment>> {
    this.ensureInitialized();

    try {
      const env: ShellEnvironment = {
        shell: Deno.env.get("SHELL") || "/bin/sh",
        platform: Deno.build.os,
        arch: Deno.build.arch,
        home: Deno.env.get("HOME") || "/root",
        user: Deno.env.get("USER"),
      };

      return { success: true, data: env };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async commandExists(name: string): Promise<CapabilityResult<boolean>> {
    this.ensureInitialized();

    try {
      const cmd = new Deno.Command("which", {
        args: [name],
        stdout: "piped",
        stderr: "piped",
      });

      const output = await cmd.output();
      return { success: true, data: output.code === 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getWorkingDirectory(): Promise<CapabilityResult<string>> {
    this.ensureInitialized();
    return { success: true, data: this.workingDirectory };
  }

  async setWorkingDirectory(
    path: string,
  ): Promise<CapabilityResult<void>> {
    this.ensureInitialized();

    try {
      // Verify directory exists
      const stat = await Deno.stat(path);
      if (!stat.isDirectory) {
        return {
          success: false,
          error: `Not a directory: ${path}`,
        };
      }

      this.workingDirectory = path;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private checkBlocked(command: string): string | null {
    const lower = command.toLowerCase().trim();
    for (const blocked of BLOCKED_COMMANDS) {
      if (lower.startsWith(blocked) || lower.includes(` ${blocked} `)) {
        return `Blocked command: ${blocked}`;
      }
    }
    return null;
  }

  private checkDangerous(command: string): string | null {
    const lower = command.toLowerCase().trim();
    for (const dangerous of DANGEROUS_COMMANDS) {
      if (lower.includes(dangerous)) {
        return dangerous;
      }
    }
    return null;
  }

  private ensureInitialized(): void {
    if (!this.context) {
      throw new CapabilityNotInitializedError(this.definition.name);
    }
  }
}
