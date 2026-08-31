/**
 * Mock Git capability for testing.
 *
 * Tracks calls and returns configurable responses.
 */

import type {
  CapabilityContext,
  CapabilityResult,
} from "../../capabilities/capability.ts";
import type {
  IGitCapability,
  GitStatus,
  GitFileChange,
  GitBranch,
  GitCommit,
} from "../../capabilities/git.ts";

export interface MockGitCapabilityConfig {
  status?: GitStatus;
  changes?: GitFileChange[];
  history?: GitCommit[];
  branches?: GitBranch[];
  failOnInit?: boolean;
}

export class MockGitCapability implements IGitCapability {
  readonly definition = {
    name: "git",
    description: "Mock Git capability for testing",
    version: "1.0.0",
  };

  private config: MockGitCapabilityConfig;

  // Call tracking
  public calls: Array<{ method: string; args: unknown[] }> = [];

  constructor(config: MockGitCapabilityConfig = {}) {
    this.config = config;
  }

  async initialize(_context: CapabilityContext): Promise<void> {
    this.calls.push({ method: "initialize", args: [_context] });
    if (this.config.failOnInit) {
      throw new Error("Mock git init failure");
    }
  }

  async dispose(): Promise<void> {
    this.calls.push({ method: "dispose", args: [] });
  }

  async getStatus(): Promise<CapabilityResult<GitStatus>> {
    this.calls.push({ method: "getStatus", args: [] });
    return {
      success: true,
      data: this.config.status ?? {
        branch: "main",
        changes: [],
        stashed: 0,
        ahead: 0,
        behind: 0,
      },
    };
  }

  async getChanges(): Promise<CapabilityResult<GitFileChange[]>> {
    this.calls.push({ method: "getChanges", args: [] });
    return {
      success: true,
      data: this.config.changes ?? [],
    };
  }

  async stage(_paths: string[]): Promise<CapabilityResult<void>> {
    this.calls.push({ method: "stage", args: [_paths] });
    return { success: true };
  }

  async unstage(_paths: string[]): Promise<CapabilityResult<void>> {
    this.calls.push({ method: "unstage", args: [_paths] });
    return { success: true };
  }

  async commit(_message: string): Promise<CapabilityResult<GitCommit>> {
    this.calls.push({ method: "commit", args: [_message] });
    return {
      success: true,
      data: {
        hash: "abc123",
        author: "Test Author",
        date: new Date().toISOString(),
        message: _message,
      },
    };
  }

  async getHistory(
    _limit?: number,
  ): Promise<CapabilityResult<GitCommit[]>> {
    this.calls.push({ method: "getHistory", args: [_limit] });
    return {
      success: true,
      data: this.config.history ?? [
        {
          hash: "abc123",
          author: "Test Author",
          date: new Date().toISOString(),
          message: "Initial commit",
        },
      ],
    };
  }

  async getBranches(): Promise<CapabilityResult<GitBranch[]>> {
    this.calls.push({ method: "getBranches", args: [] });
    return {
      success: true,
      data: this.config.branches ?? [
        { name: "main", is_current: true, is_remote: false },
      ],
    };
  }

  async createBranch(_name: string): Promise<CapabilityResult<void>> {
    this.calls.push({ method: "createBranch", args: [_name] });
    return { success: true };
  }

  async switchBranch(_name: string): Promise<CapabilityResult<void>> {
    this.calls.push({ method: "switchBranch", args: [_name] });
    return { success: true };
  }

  resetCalls(): void {
    this.calls = [];
  }
}
