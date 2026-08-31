/**
 * Mock GitHub capability for testing.
 *
 * Tracks calls and returns configurable responses.
 */

import type {
  CapabilityContext,
  CapabilityResult,
} from "../../capabilities/capability.ts";
import type {
  IGitHubCapability,
  GitHubRepository,
  GitHubIssue,
  GitHubPullRequest,
  GitHubComment,
  IssueState,
  PullRequestState,
} from "../../capabilities/github.ts";

export interface MockGitHubCapabilityConfig {
  repository?: GitHubRepository;
  issues?: GitHubIssue[];
  pullRequests?: GitHubPullRequest[];
  comments?: GitHubComment[];
  failOnInit?: boolean;
}

export class MockGitHubCapability implements IGitHubCapability {
  readonly definition = {
    name: "github",
    description: "Mock GitHub capability for testing",
    version: "1.0.0",
  };

  private config: MockGitHubCapabilityConfig;

  // Call tracking
  public calls: Array<{ method: string; args: unknown[] }> = [];

  constructor(config: MockGitHubCapabilityConfig = {}) {
    this.config = config;
  }

  async initialize(_context: CapabilityContext): Promise<void> {
    this.calls.push({ method: "initialize", args: [_context] });
    if (this.config.failOnInit) {
      throw new Error("Mock github init failure");
    }
  }

  async dispose(): Promise<void> {
    this.calls.push({ method: "dispose", args: [] });
  }

  async getRepository(): Promise<CapabilityResult<GitHubRepository>> {
    this.calls.push({ method: "getRepository", args: [] });
    return {
      success: true,
      data: this.config.repository ?? {
        name: "test-repo",
        full_name: "test-owner/test-repo",
        description: "Test repository",
        private: false,
        default_branch: "main",
      },
    };
  }

  async listIssues(options?: {
    state?: IssueState;
    labels?: string[];
    assignee?: string;
    limit?: number;
  }): Promise<CapabilityResult<GitHubIssue[]>> {
    this.calls.push({ method: "listIssues", args: [options] });
    return {
      success: true,
      data: this.config.issues ?? [],
    };
  }

  async getIssue(number: number): Promise<CapabilityResult<GitHubIssue>> {
    this.calls.push({ method: "getIssue", args: [number] });
    const issue = this.config.issues?.find((i) => i.number === number);
    return {
      success: true,
      data: issue ?? {
        number,
        title: `Issue ${number}`,
        body: "Test issue",
        state: "open" as IssueState,
        author: "test-user",
        labels: [],
        assignees: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  async createIssue(issue: {
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
  }): Promise<CapabilityResult<GitHubIssue>> {
    this.calls.push({ method: "createIssue", args: [issue] });
    return {
      success: true,
      data: {
        number: (this.config.issues?.length ?? 0) + 1,
        title: issue.title,
        body: issue.body ?? "",
        state: "open" as IssueState,
        author: "test-user",
        labels: issue.labels ?? [],
        assignees: issue.assignees ?? [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
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
    this.calls.push({ method: "updateIssue", args: [number, update] });
    return {
      success: true,
      data: {
        number,
        title: update.title ?? `Issue ${number}`,
        body: update.body ?? "Updated",
        state: update.state ?? "open" as IssueState,
        author: "test-user",
        labels: update.labels ?? [],
        assignees: update.assignees ?? [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  async listPullRequests(options?: {
    state?: PullRequestState;
    limit?: number;
  }): Promise<CapabilityResult<GitHubPullRequest[]>> {
    this.calls.push({ method: "listPullRequests", args: [options] });
    return {
      success: true,
      data: this.config.pullRequests ?? [],
    };
  }

  async getPullRequest(
    number: number,
  ): Promise<CapabilityResult<GitHubPullRequest>> {
    this.calls.push({ method: "getPullRequest", args: [number] });
    const pr = this.config.pullRequests?.find((p) => p.number === number);
    return {
      success: true,
      data: pr ?? {
        number,
        title: `PR ${number}`,
        body: "Test PR",
        state: "open" as PullRequestState,
        author: "test-user",
        head: "feature-branch",
        base: "main",
        merged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  async createPullRequest(pr: {
    title: string;
    body?: string;
    head: string;
    base: string;
  }): Promise<CapabilityResult<GitHubPullRequest>> {
    this.calls.push({ method: "createPullRequest", args: [pr] });
    return {
      success: true,
      data: {
        number: (this.config.pullRequests?.length ?? 0) + 1,
        title: pr.title,
        body: pr.body ?? "",
        state: "open" as PullRequestState,
        author: "test-user",
        head: pr.head,
        base: pr.base,
        merged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  async mergePullRequest(
    number: number,
    options?: {
      merge_method?: "merge" | "squash" | "rebase";
      commit_title?: string;
    },
  ): Promise<CapabilityResult<GitHubPullRequest>> {
    this.calls.push({ method: "mergePullRequest", args: [number, options] });
    return {
      success: true,
      data: {
        number,
        title: options?.commit_title ?? `PR ${number}`,
        state: "merged" as PullRequestState,
        author: "test-user",
        head: "feature-branch",
        base: "main",
        merged: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  async listIssueComments(
    _issueNumber: number,
    _limit?: number,
  ): Promise<CapabilityResult<GitHubComment[]>> {
    this.calls.push({
      method: "listIssueComments",
      args: [_issueNumber, _limit],
    });
    return {
      success: true,
      data: this.config.comments ?? [],
    };
  }

  async createIssueComment(
    _issueNumber: number,
    body: string,
  ): Promise<CapabilityResult<GitHubComment>> {
    this.calls.push({
      method: "createIssueComment",
      args: [_issueNumber, body],
    });
    return {
      success: true,
      data: {
        id: Math.floor(Math.random() * 1000),
        body,
        author: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  resetCalls(): void {
    this.calls = [];
  }
}
