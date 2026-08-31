/**
 * Mock Shell capability for testing.
 *
 * Tracks calls and returns configurable responses.
 */

import type {
  CapabilityContext,
  CapabilityResult,
} from "../../capabilities/capability.ts";
import type {
  IShellCapability,
  ShellExecResult,
  ShellEnvironment,
} from "../../capabilities/shell.ts";

export interface ShellExecOptions {
  timeout_ms?: number;
  env?: Record<string, string>;
  cwd?: string;
}

export interface MockShellCapabilityConfig {
  execResults?: Map<string, ShellExecResult>;
  defaultExecResult?: ShellExecResult;
  environment?: ShellEnvironment;
  workingDirectory?: string;
  commandExists?: Map<string, boolean>;
  failOnInit?: boolean;
}

export class MockShellCapability implements IShellCapability {
  readonly definition = {
    name: "shell",
    description: "Mock Shell capability for testing",
    version: "1.0.0",
  };

  private config: MockShellCapabilityConfig;
  private workingDir: string;

  // Call tracking
  public calls: Array<{ method: string; args: unknown[] }> = [];

  constructor(config: MockShellCapabilityConfig = {}) {
    this.config = config;
    this.workingDir = config.workingDirectory ?? "/tmp";
  }

  async initialize(context: CapabilityContext): Promise<void> {
    this.calls.push({ method: "initialize", args: [context] });
    if (this.config.failOnInit) {
      throw new Error("Mock shell init failure");
    }
    if (context.working_directory) {
      this.workingDir = context.working_directory;
    }
  }

  async dispose(): Promise<void> {
    this.calls.push({ method: "dispose", args: [] });
  }

  async exec(
    command: string,
    options?: ShellExecOptions,
  ): Promise<CapabilityResult<ShellExecResult>> {
    this.calls.push({ method: "exec", args: [command, options] });

    if (this.config.execResults?.has(command)) {
      return {
        success: true,
        data: this.config.execResults.get(command)!,
      };
    }

    return {
      success: true,
      data: this.config.defaultExecResult ?? {
        exit_code: 0,
        stdout: "",
        stderr: "",
        duration_ms: 0,
        timed_out: false,
      },
    };
  }

  async getEnvironment(): Promise<CapabilityResult<ShellEnvironment>> {
    this.calls.push({ method: "getEnvironment", args: [] });
    return {
      success: true,
      data: this.config.environment ?? {
        shell: "/bin/bash",
        platform: Deno.build.os,
        arch: Deno.build.arch,
        home: "/home/test",
        user: "test",
      },
    };
  }

  async commandExists(name: string): Promise<CapabilityResult<boolean>> {
    this.calls.push({ method: "commandExists", args: [name] });
    if (this.config.commandExists?.has(name)) {
      return {
        success: true,
        data: this.config.commandExists.get(name)!,
      };
    }
    return { success: true, data: true };
  }

  async getWorkingDirectory(): Promise<CapabilityResult<string>> {
    this.calls.push({ method: "getWorkingDirectory", args: [] });
    return { success: true, data: this.workingDir };
  }

  async setWorkingDirectory(
    path: string,
  ): Promise<CapabilityResult<void>> {
    this.calls.push({ method: "setWorkingDirectory", args: [path] });
    this.workingDir = path;
    return { success: true };
  }

  resetCalls(): void {
    this.calls = [];
  }
}
