/**
 * Git capability implementation.
 *
 * Provides typed access to Git operations using Deno.Command for real execution.
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
 * Git capability that executes real Git commands via Deno.Command.
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
      const result = await this.execute(["status", "--porcelain", "-b"]);
      const lines = result.stdout.trim().split("\n");

      // First line: "## main...origin/main [ahead 1, behind 2]"
      // or "## No commits yet on master" (before first commit)
      const branchLine = lines[0] ?? "";
      let branch = "";
      let upstream: string | undefined;

      if (branchLine.includes("No commits yet on")) {
        // "## No commits yet on master"
        const fallback = branchLine.match(/on (\S+)$/);
        branch = fallback?.[1] ?? "main";
      } else {
        // "## main...origin/main [ahead 1, behind 2]"
        const branchMatch = branchLine.match(/^## ([^.]+)(?:\.\.\.(\S+))?/);
        branch = branchMatch?.[1]?.trim() ?? "main";
        upstream = branchMatch?.[2];
      }

      let ahead = 0;
      let behind = 0;
      const aheadMatch = branchLine.match(/ahead (\d+)/);
      const behindMatch = branchLine.match(/behind (\d+)/);
      if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
      if (behindMatch) behind = parseInt(behindMatch[1], 10);

      const changes: GitFileChange[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.length < 4) continue;

        const indexStatus = line[0];
        const workTreeStatus = line[1];
        const filePath = line.substring(3);

        const status = this.parseFileStatus(indexStatus, workTreeStatus);
        if (status) {
          changes.push({ path: filePath, status });
        }
      }

      // Check stash count
      let stashed = 0;
      try {
        const stashResult = await this.execute(["stash", "list"]);
        stashed = stashResult.stdout.trim().split("\n").filter((l) => l.length > 0).length;
      } catch {
        // Stash list can fail in bare repos
      }

      return {
        success: true,
        data: { branch, upstream, changes, stashed, ahead, behind },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getChanges(): Promise<CapabilityResult<GitFileChange[]>> {
    this.ensureInitialized();

    const status = await this.getStatus();
    if (!status.success) {
      return { success: false, error: status.error };
    }
    return { success: true, data: status.data?.changes ?? [] };
  }

  async stage(paths: string[]): Promise<CapabilityResult<void>> {
    this.ensureInitialized();

    try {
      await this.execute(["add", ...paths]);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async unstage(paths: string[]): Promise<CapabilityResult<void>> {
    this.ensureInitialized();

    try {
      await this.execute(["reset", "HEAD", "--", ...paths]);
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
      await this.execute(["commit", "-m", message]);

      // Get the commit hash — use %%x00 (NUL) as delimiter to avoid pipe-in-content bugs
      const logResult = await this.execute(["log", "-1", "--format=%H%x00%an%x00%ai%x00%s"]);
      const parts = logResult.stdout.trim().split("\0");

      const commit: GitCommit = {
        hash: parts[0] ?? "",
        author: parts[1] ?? "",
        date: parts[2] ?? "",
        message: parts[3] ?? message,
      };

      return { success: true, data: commit };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getHistory(limit: number = 10): Promise<CapabilityResult<GitCommit[]>> {
    this.ensureInitialized();

    try {
      const result = await this.execute([
        "log",
        `--max-count=${limit}`,
        "--format=%H%x00%an%x00%ai%x00%s",
      ]);

      const commits: GitCommit[] = [];
      const lines = result.stdout.trim().split("\n");

      for (const line of lines) {
        if (!line) continue;
        const parts = line.split("\0");
        commits.push({
          hash: parts[0] ?? "",
          author: parts[1] ?? "",
          date: parts[2] ?? "",
          message: parts[3] ?? "",
        });
      }

      return { success: true, data: commits };
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
      const result = await this.execute(["branch", "-a", "--format=%(refname:short)|%(refname:strip=2)|%(upstream:short)"]);
      const branches: GitBranch[] = [];
      const current = await this.getCurrentBranch();

      for (const line of result.stdout.trim().split("\n")) {
        if (!line) continue;
        const parts = line.split("|");
        const name = parts[0] ?? "";
        const rawRef = parts[1] ?? "";
        const upstream = parts[2] || undefined;

        const isRemote = rawRef.startsWith("remotes/") || name.includes("/");
        const displayName = isRemote ? name.replace(/^origin\//, "") : name;

        branches.push({
          name: displayName,
          is_current: displayName === current,
          is_remote: isRemote,
          upstream,
        });
      }

      return { success: true, data: branches };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async createBranch(name: string): Promise<CapabilityResult<void>> {
    this.ensureInitialized();

    try {
      await this.execute(["branch", name]);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async switchBranch(name: string): Promise<CapabilityResult<void>> {
    this.ensureInitialized();

    try {
      await this.execute(["checkout", name]);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async execute(args: string[]): Promise<{ stdout: string; stderr: string }> {
    const command = new Deno.Command("git", {
      args,
      cwd: this.context!.working_directory,
      stdout: "piped",
      stderr: "piped",
    });

    const output = await command.output();

    if (!output.success) {
      const stderr = new TextDecoder().decode(output.stderr);
      throw new Error(`git ${args[0]} failed: ${stderr}`);
    }

    return {
      stdout: new TextDecoder().decode(output.stdout),
      stderr: new TextDecoder().decode(output.stderr),
    };
  }

  private async getCurrentBranch(): Promise<string> {
    try {
      const result = await this.execute(["rev-parse", "--abbrev-ref", "HEAD"]);
      return result.stdout.trim();
    } catch {
      return "";
    }
  }

  private parseFileStatus(indexStatus: string, workTreeStatus: string): FileStatus | null {
    // Index status takes priority
    const statusMap: Record<string, FileStatus> = {
      "A": "staged",
      "M": "modified",
      "D": "deleted",
      "R": "renamed",
      "C": "copied",
      "?": "untracked",
      "!": "conflicted",
    };

    if (indexStatus !== " " && indexStatus !== "?") {
      return statusMap[indexStatus] ?? "modified";
    }

    if (workTreeStatus !== " " && workTreeStatus !== "?") {
      return statusMap[workTreeStatus] ?? "modified";
    }

    if (indexStatus === "?" && workTreeStatus === "?") {
      return "untracked";
    }

    return null;
  }

  private ensureInitialized(): void {
    if (!this.context) {
      throw new CapabilityNotInitializedError(this.definition.name);
    }
  }
}
