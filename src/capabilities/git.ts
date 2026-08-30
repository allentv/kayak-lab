/**
 * Git capability implementation.
 *
 * Provides typed access to Git operations with abstract interface.
 */

import {
  ICapability,
  CapabilityDefinition,
  CapabilityContext,
  CapabilityResult,
  CapabilityNotInitializedError,
} from "./capability.ts";

// ============================================================================
// Git Types
// ============================================================================

/** Git status of a file. */
export type FileStatus =
  | "untracked"
  | "modified"
  | "staged"
  | "deleted"
  | "renamed"
  | "copied"
  | "conflicted";

/** Git file change. */
export interface GitFileChange {
  path: string;
  status: FileStatus;
  old_path?: string;
}

/** Git branch. */
export interface GitBranch {
  name: string;
  is_current: boolean;
  is_remote: boolean;
  upstream?: string;
}

/** Git commit. */
export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

/** Git status result. */
export interface GitStatus {
  branch: string;
  upstream?: string;
  changes: GitFileChange[];
  stashed: number;
  ahead: number;
  behind: number;
}

// ============================================================================
// Git Capability Interface
// ============================================================================

/**
 * Interface for Git operations.
 */
export interface IGitCapability extends ICapability {
  /** Get repository status. */
  getStatus(): Promise<CapabilityResult<GitStatus>>;

  /** Get file changes. */
  getChanges(): Promise<CapabilityResult<GitFileChange[]>>;

  /** Stage files. */
  stage(paths: string[]): Promise<CapabilityResult<void>>;

  /** Unstage files. */
  unstage(paths: string[]): Promise<CapabilityResult<void>>;

  /** Commit changes. */
  commit(message: string): Promise<CapabilityResult<GitCommit>>;

  /** Get commit history. */
  getHistory(limit?: number): Promise<CapabilityResult<GitCommit[]>>;

  /** List branches. */
  getBranches(): Promise<CapabilityResult<GitBranch[]>>;

  /** Create a branch. */
  createBranch(name: string): Promise<CapabilityResult<void>>;

  /** Switch branch. */
  switchBranch(name: string): Promise<CapabilityResult<void>>;
}

// ============================================================================
// Git Capability Implementation
// ============================================================================

/**
 * Git capability that executes Git commands.
 *
 * Note: This is a simplified implementation. In production, this would
 * use a Git library like simple-git or isomorphic-git.
 */
export class GitCapability implements IGitCapability {
  readonly definition: CapabilityDefinition = {
    name: "git",
    description: "Git version control operations",
    version: "1.0.0",
  };

  private context: CapabilityContext | null = null;

  async initialize(context: CapabilityContext): Promise<void> {
    this.context = context;
  }

  async dispose(): Promise<void> {
    this.context = null;
  }

  async getStatus(): Promise<CapabilityResult<GitStatus>> {
    this.ensureInitialized();

    try {
      // Simulated Git status
      const status: GitStatus = {
        branch: "main",
        changes: [],
        stashed: 0,
        ahead: 0,
        behind: 0,
      };

      return { success: true, data: status };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getChanges(): Promise<CapabilityResult<GitFileChange[]>> {
    this.ensureInitialized();

    try {
      const status = await this.getStatus();
      return {
        success: true,
        data: status.data?.changes ?? [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async stage(_paths: string[]): Promise<CapabilityResult<void>> {
    this.ensureInitialized();

    try {
      // Would execute: git add <paths>
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async unstage(_paths: string[]): Promise<CapabilityResult<void>> {
    this.ensureInitialized();

    try {
      // Would execute: git reset HEAD <paths>
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async commit(message: string): Promise<CapabilityResult<GitCommit>> {
    this.ensureInitialized();

    try {
      // Would execute: git commit -m <message>
      const commit: GitCommit = {
        hash: "abc123",
        author: "Agent",
        date: new Date().toISOString(),
        message,
      };

      return { success: true, data: commit };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getHistory(
    _limit: number = 10,
  ): Promise<CapabilityResult<GitCommit[]>> {
    this.ensureInitialized();

    try {
      // Would execute: git log --oneline -n <limit>
      return { success: true, data: [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getBranches(): Promise<CapabilityResult<GitBranch[]>> {
    this.ensureInitialized();

    try {
      // Would execute: git branch -a
      const branches: GitBranch[] = [
        { name: "main", is_current: true, is_remote: false },
      ];

      return { success: true, data: branches };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async createBranch(_name: string): Promise<CapabilityResult<void>> {
    this.ensureInitialized();

    try {
      // Would execute: git branch <name>
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async switchBranch(_name: string): Promise<CapabilityResult<void>> {
    this.ensureInitialized();

    try {
      // Would execute: git checkout <name>
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private ensureInitialized(): void {
    if (!this.context) {
      throw new CapabilityNotInitializedError(this.definition.name);
    }
  }
}
