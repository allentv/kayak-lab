/**
 * GitHub capability implementation.
 *
 * Provides typed access to GitHub REST API operations using fetch.
 * Requires GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO environment variables.
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
    issueNumber: number,
    limit?: number,
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
 * GitHub capability that executes real GitHub REST API calls via fetch.
 */
export class GitHubCapability implements IGitHubCapability {
  readonly definition: CapabilityDefinition = {
    name: "github",
    description: "GitHub API operations",
    version: "1.0.0",
    rateLimit: { maxTokens: 60, refillRateMs: 60_000, refillRate: 60 },
  };

  private context: CapabilityContext | null = null;
  private token = "";
  private owner = "";
  private repo = "";
  private apiBase = "https://api.github.com";

  async initialize(context: CapabilityContext): Promise<void> {
    this.context = context;
    const env: Record<string, string> = context.environment ?? {};
    this.token = env["GITHUB_TOKEN"] ?? "";
    this.owner = env["GITHUB_OWNER"] ?? "";
    this.repo = env["GITHUB_REPO"] ?? "";
    this.apiBase = env["GITHUB_API_BASE"] ?? "https://api.github.com";

    if (!this.token) {
      throw new Error("GITHUB_TOKEN environment variable is required");
    }
    if (!this.owner || !this.repo) {
      throw new Error("GITHUB_OWNER and GITHUB_REPO environment variables are required");
    }
  }

  async dispose(): Promise<void> {
    this.context = null;
    this.token = "";
    this.owner = "";
    this.repo = "";
    this.apiBase = "https://api.github.com";
  }

  async getRepository(): Promise<CapabilityResult<GitHubRepository>> {
    this.ensureInitialized();

    try {
      const data = await this.request("GET", `/repos/${this.owner}/${this.repo}`);
      return {
        success: true,
        data: {
          name: data.name as string,
          full_name: data.full_name as string,
          description: data.description as string | undefined,
          private: data.private as boolean,
          default_branch: data.default_branch as string,
        },
      };
    } catch (error) {
      return { success: false, error: `Failed to get repository: ${error}` };
    }
  }

  async listIssues(options?: {
    state?: IssueState;
    labels?: string[];
    assignee?: string;
    limit?: number;
  }): Promise<CapabilityResult<GitHubIssue[]>> {
    this.ensureInitialized();

    try {
      const params = new URLSearchParams();
      if (options?.state) params.set("state", options.state);
      if (options?.labels?.length) params.set("labels", options.labels.join(","));
      if (options?.assignee) params.set("assignee", options.assignee);
      if (options?.limit) params.set("per_page", String(options.limit));

      const qs = params.toString();
      const data = await this.request("GET", `/repos/${this.owner}/${this.repo}/issues${qs ? `?${qs}` : ""}`);
      const issues = (Array.isArray(data) ? data : []) as Record<string, unknown>[];

      return {
        success: true,
        data: issues
          .filter((i) => !i.pull_request) // exclude PRs which GitHub lists as issues
          .map((i) => this.parseIssue(i)),
      };
    } catch (error) {
      return { success: false, error: `Failed to list issues: ${error}` };
    }
  }

  async getIssue(number: number): Promise<CapabilityResult<GitHubIssue>> {
    this.ensureInitialized();

    try {
      const data = await this.request("GET", `/repos/${this.owner}/${this.repo}/issues/${number}`);
      return { success: true, data: this.parseIssue(data) };
    } catch (error) {
      return { success: false, error: `Failed to get issue: ${error}` };
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
      const data = await this.request("POST", `/repos/${this.owner}/${this.repo}/issues`, {
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
        assignees: issue.assignees,
      });
      return { success: true, data: this.parseIssue(data) };
    } catch (error) {
      return { success: false, error: `Failed to create issue: ${error}` };
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
      const data = await this.request("PATCH", `/repos/${this.owner}/${this.repo}/issues/${number}`, {
        title: update.title,
        body: update.body,
        state: update.state,
        labels: update.labels,
        assignees: update.assignees,
      });
      return { success: true, data: this.parseIssue(data) };
    } catch (error) {
      return { success: false, error: `Failed to update issue: ${error}` };
    }
  }

  async listPullRequests(options?: {
    state?: PullRequestState;
    limit?: number;
  }): Promise<CapabilityResult<GitHubPullRequest[]>> {
    this.ensureInitialized();

    try {
      const params = new URLSearchParams();
      if (options?.state) params.set("state", options.state);
      if (options?.limit) params.set("per_page", String(options.limit));

      const qs = params.toString();
      const data = await this.request("GET", `/repos/${this.owner}/${this.repo}/pulls${qs ? `?${qs}` : ""}`);
      const prs = (Array.isArray(data) ? data : []) as Record<string, unknown>[];

      return { success: true, data: prs.map((pr) => this.parsePR(pr)) };
    } catch (error) {
      return { success: false, error: `Failed to list pull requests: ${error}` };
    }
  }

  async getPullRequest(number: number): Promise<CapabilityResult<GitHubPullRequest>> {
    this.ensureInitialized();

    try {
      const data = await this.request("GET", `/repos/${this.owner}/${this.repo}/pulls/${number}`);
      return { success: true, data: this.parsePR(data) };
    } catch (error) {
      return { success: false, error: `Failed to get pull request: ${error}` };
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
      const data = await this.request("POST", `/repos/${this.owner}/${this.repo}/pulls`, {
        title: pr.title,
        body: pr.body,
        head: pr.head,
        base: pr.base,
      });
      return { success: true, data: this.parsePR(data) };
    } catch (error) {
      return { success: false, error: `Failed to create pull request: ${error}` };
    }
  }

  async mergePullRequest(
    number: number,
    options?: {
      merge_method?: "merge" | "squash" | "rebase";
      commit_title?: string;
    },
  ): Promise<CapabilityResult<GitHubPullRequest>> {
    this.ensureInitialized();

    try {
      await this.request("PUT", `/repos/${this.owner}/${this.repo}/pulls/${number}/merge`, {
        merge_method: options?.merge_method ?? "merge",
        commit_title: options?.commit_title,
      });

      // Fetch the updated PR state
      const data = await this.request("GET", `/repos/${this.owner}/${this.repo}/pulls/${number}`);
      return { success: true, data: this.parsePR(data) };
    } catch (error) {
      return { success: false, error: `Failed to merge pull request: ${error}` };
    }
  }

  async listIssueComments(
    issueNumber: number,
    limit?: number,
  ): Promise<CapabilityResult<GitHubComment[]>> {
    this.ensureInitialized();

    try {
      const params = new URLSearchParams();
      if (limit) params.set("per_page", String(limit));

      const qs = params.toString();
      const data = await this.request(
        "GET",
        `/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments${qs ? `?${qs}` : ""}`,
      );
      const comments = (Array.isArray(data) ? data : []) as Record<string, unknown>[];

      return { success: true, data: comments.map((c) => this.parseComment(c)) };
    } catch (error) {
      return { success: false, error: `Failed to list issue comments: ${error}` };
    }
  }

  async createIssueComment(
    issueNumber: number,
    body: string,
  ): Promise<CapabilityResult<GitHubComment>> {
    this.ensureInitialized();

    try {
      const data = await this.request(
        "POST",
        `/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`,
        { body },
      );
      return { success: true, data: this.parseComment(data) };
    } catch (error) {
      return { success: false, error: `Failed to create issue comment: ${error}` };
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    // Path is already constructed with safe values (owner/repo are URL-safe,
    // issue/PR numbers are integers). Encode only query params via URLSearchParams.
    const url = `${this.apiBase}${path}`;
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${this.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const init: RequestInit = { method, headers };
    if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitHub API ${response.status}: ${text}`);
    }

    // Some endpoints return 204 No Content (e.g., PUT merge)
    if (response.status === 204) {
      return {};
    }

    return await response.json() as Record<string, unknown>;
  }

  private parseIssue(data: Record<string, unknown>): GitHubIssue {
    const user = data.user as Record<string, unknown> | undefined;
    const labels = (data.labels as Array<Record<string, unknown>> ?? []);
    const assignees = (data.assignees as Array<Record<string, unknown>> ?? []);

    return {
      number: data.number as number,
      title: data.title as string,
      body: (data.body as string) ?? undefined,
      state: data.state as IssueState,
      author: (user?.login as string) ?? "",
      assignees: assignees.map((a) => (a.login as string) ?? ""),
      labels: labels.map((l) => (l.name as string) ?? ""),
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    };
  }

  private parsePR(data: Record<string, unknown>): GitHubPullRequest {
    const user = data.user as Record<string, unknown> | undefined;
    const head = data.head as Record<string, unknown> | undefined;
    const base = data.base as Record<string, unknown> | undefined;
    const merged = data.merged as boolean ?? false;

    let state: PullRequestState = "open";
    if (merged) {
      state = "merged";
    } else if (data.state === "closed") {
      state = "closed";
    }

    return {
      number: data.number as number,
      title: data.title as string,
      body: (data.body as string) ?? undefined,
      state,
      author: (user?.login as string) ?? "",
      head: (head?.ref as string) ?? "",
      base: (base?.ref as string) ?? "",
      merged,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    };
  }

  private parseComment(data: Record<string, unknown>): GitHubComment {
    const user = data.user as Record<string, unknown> | undefined;

    return {
      id: data.id as number,
      body: data.body as string,
      author: (user?.login as string) ?? "",
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    };
  }

  private ensureInitialized(): void {
    if (!this.context) {
      throw new CapabilityNotInitializedError(this.definition.name);
    }
  }
}
