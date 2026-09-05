/**
 * GitHub capability implementation.
 *
 * Provides typed access to GitHub API operations with abstract interface.
 */

import {
  ICapability,
  CapabilityDefinition,
  CapabilityContext,
  CapabilityResult,
  CapabilityNotInitializedError,
} from "./capability.ts";

// ============================================================================
// GitHub Types
// ============================================================================

/** GitHub issue state. */
export type IssueState = "open" | "closed";

/** GitHub pull request state. */
export type PullRequestState = "open" | "closed" | "merged";

/** GitHub issue. */
export interface GitHubIssue {
  number: number;
  title: string;
  body?: string;
  state: IssueState;
  author: string;
  assignees: string[];
  labels: string[];
  created_at: string;
  updated_at: string;
}

/** GitHub pull request. */
export interface GitHubPullRequest {
  number: number;
  title: string;
  body?: string;
  state: PullRequestState;
  author: string;
  head: string;
  base: string;
  merged: boolean;
  created_at: string;
  updated_at: string;
}

/** GitHub repository. */
export interface GitHubRepository {
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  default_branch: string;
}

/** GitHub comment. */
export interface GitHubComment {
  id: number;
  body: string;
  author: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// GitHub Capability Interface
// ============================================================================

/**
 * Interface for GitHub operations.
 */
export interface IGitHubCapability extends ICapability {
  /** Get repository information. */
  getRepository(): Promise<CapabilityResult<GitHubRepository>>;

  /** List issues. */
  listIssues(options?: {
    state?: IssueState;
    labels?: string[];
    assignee?: string;
    limit?: number;
  }): Promise<CapabilityResult<GitHubIssue[]>>;

  /** Get issue by number. */
  getIssue(number: number): Promise<CapabilityResult<GitHubIssue>>;

  /** Create issue. */
  createIssue(issue: {
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
  }): Promise<CapabilityResult<GitHubIssue>>;

  /** Update issue. */
  updateIssue(
    number: number,
    update: {
      title?: string;
      body?: string;
      state?: IssueState;
      labels?: string[];
      assignees?: string[];
    },
  ): Promise<CapabilityResult<GitHubIssue>>;

  /** List pull requests. */
  listPullRequests(options?: {
    state?: PullRequestState;
    limit?: number;
  }): Promise<CapabilityResult<GitHubPullRequest[]>>;

  /** Get pull request by number. */
  getPullRequest(number: number): Promise<CapabilityResult<GitHubPullRequest>>;

  /** Create pull request. */
  createPullRequest(pr: {
    title: string;
    body?: string;
    head: string;
    base: string;
  }): Promise<CapabilityResult<GitHubPullRequest>>;

  /** Merge pull request. */
  mergePullRequest(
    number: number,
    options?: {
      merge_method?: "merge" | "squash" | "rebase";
      commit_title?: string;
    },
  ): Promise<CapabilityResult<GitHubPullRequest>>;

  /** List issue comments. */
  listIssueComments(
    _issueNumber: number,
    _limit?: number,
  ): Promise<CapabilityResult<GitHubComment[]>>;

  /** Create issue comment. */
  createIssueComment(
    issueNumber: number,
    body: string,
  ): Promise<CapabilityResult<GitHubComment>>;
}

// ============================================================================
// GitHub Capability Implementation
// ============================================================================

/**
 * GitHub capability that executes GitHub API operations.
 *
 * Note: This is a simplified implementation. In production, this would
 * use the GitHub REST API or Octokit library.
 */
export class GitHubCapability implements IGitHubCapability {
  readonly definition: CapabilityDefinition = {
    name: "github",
    description: "GitHub API operations",
    version: "1.0.0",
    rateLimit: { maxTokens: 60, refillRateMs: 60_000, refillRate: 60 },
  };

  private context: CapabilityContext | null = null;

  async initialize(context: CapabilityContext): Promise<void> {
    this.context = context;
  }

  async dispose(): Promise<void> {
    this.context = null;
  }

  async getRepository(): Promise<CapabilityResult<GitHubRepository>> {
    this.ensureInitialized();

    try {
      // In production, this would call the GitHub API
      const repo: GitHubRepository = {
        name: "kayak-lab",
        full_name: "kayak-lab/kayak-lab",
        description: "Agent interaction control plane",
        private: false,
        default_branch: "main",
      };

      return { success: true, data: repo };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get repository: ${error}`,
      };
    }
  }

  async listIssues(_options?: {
    state?: IssueState;
    labels?: string[];
    assignee?: string;
    limit?: number;
  }): Promise<CapabilityResult<GitHubIssue[]>> {
    this.ensureInitialized();

    try {
      // In production, this would call the GitHub API
      const issues: GitHubIssue[] = [];

      return { success: true, data: issues };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list issues: ${error}`,
      };
    }
  }

  async getIssue(number: number): Promise<CapabilityResult<GitHubIssue>> {
    this.ensureInitialized();

    try {
      // In production, this would call the GitHub API
      const issue: GitHubIssue = {
        number,
        title: "Sample Issue",
        state: "open",
        author: "user",
        assignees: [],
        labels: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { success: true, data: issue };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get issue: ${error}`,
      };
    }
  }

  async createIssue(issue: {
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
  }): Promise<CapabilityResult<GitHubIssue>> {
    this.ensureInitialized();

    try {
      // In production, this would call the GitHub API
      const created: GitHubIssue = {
        number: 1,
        title: issue.title,
        body: issue.body,
        state: "open",
        author: "user",
        assignees: issue.assignees || [],
        labels: issue.labels || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { success: true, data: created };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create issue: ${error}`,
      };
    }
  }

  async updateIssue(
    number: number,
    update: {
      title?: string;
      body?: string;
      state?: IssueState;
      labels?: string[];
      assignees?: string[];
    },
  ): Promise<CapabilityResult<GitHubIssue>> {
    this.ensureInitialized();

    try {
      // In production, this would call the GitHub API
      const updated: GitHubIssue = {
        number,
        title: update.title || "Updated Issue",
        body: update.body,
        state: update.state || "open",
        author: "user",
        assignees: update.assignees || [],
        labels: update.labels || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update issue: ${error}`,
      };
    }
  }

  async listPullRequests(_options?: {
    state?: PullRequestState;
    limit?: number;
  }): Promise<CapabilityResult<GitHubPullRequest[]>> {
    this.ensureInitialized();

    try {
      // In production, this would call the GitHub API
      const prs: GitHubPullRequest[] = [];

      return { success: true, data: prs };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list pull requests: ${error}`,
      };
    }
  }

  async getPullRequest(
    number: number,
  ): Promise<CapabilityResult<GitHubPullRequest>> {
    this.ensureInitialized();

    try {
      // In production, this would call the GitHub API
      const pr: GitHubPullRequest = {
        number,
        title: "Sample PR",
        state: "open",
        author: "user",
        head: "feature-branch",
        base: "main",
        merged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { success: true, data: pr };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get pull request: ${error}`,
      };
    }
  }

  async createPullRequest(pr: {
    title: string;
    body?: string;
    head: string;
    base: string;
  }): Promise<CapabilityResult<GitHubPullRequest>> {
    this.ensureInitialized();

    try {
      // In production, this would call the GitHub API
      const created: GitHubPullRequest = {
        number: 1,
        title: pr.title,
        body: pr.body,
        state: "open",
        author: "user",
        head: pr.head,
        base: pr.base,
        merged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { success: true, data: created };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create pull request: ${error}`,
      };
    }
  }

  async mergePullRequest(
    number: number,
    _options?: {
      merge_method?: "merge" | "squash" | "rebase";
      commit_title?: string;
    },
  ): Promise<CapabilityResult<GitHubPullRequest>> {
    this.ensureInitialized();

    try {
      // In production, this would call the GitHub API
      const merged: GitHubPullRequest = {
        number,
        title: "Merged PR",
        state: "closed",
        author: "user",
        head: "feature-branch",
        base: "main",
        merged: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { success: true, data: merged };
    } catch (error) {
      return {
        success: false,
        error: `Failed to merge pull request: ${error}`,
      };
    }
  }

  async listIssueComments(
    _issueNumber: number,
    _limit?: number,
  ): Promise<CapabilityResult<GitHubComment[]>> {
    this.ensureInitialized();

    try {
      // In production, this would call the GitHub API
      const comments: GitHubComment[] = [];

      return { success: true, data: comments };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list issue comments: ${error}`,
      };
    }
  }

  async createIssueComment(
    _issueNumber: number,
    body: string,
  ): Promise<CapabilityResult<GitHubComment>> {
    this.ensureInitialized();

    try {
      // In production, this would call the GitHub API
      const comment: GitHubComment = {
        id: 1,
        body,
        author: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { success: true, data: comment };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create issue comment: ${error}`,
      };
    }
  }

  private ensureInitialized(): void {
    if (!this.context) {
      throw new CapabilityNotInitializedError(this.definition.name);
    }
  }
}
