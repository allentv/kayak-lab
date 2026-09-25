import { assertEquals, assertExists } from "@std/assert";
import { GitHubCapability } from "../github.ts";
import type { CapabilityContext } from "../capability.ts";

/** Epoch seconds for the mock rate-limit reset header (1.8e9 - 1). */
const RATE_LIMIT_RESET = 1_8e9 - 1;

/** Start a mock GitHub API server. Returns the base URL and a close function. */
function startMockServer(): { url: string; close: () => Promise<void> } {
  const server = Deno.serve({ port: 0, onListen: () => {} }, (req) => {
    const url = new URL(req.url);
    const path = url.pathname;

    // PUT /repos/{owner}/{repo}/pulls/{number}/merge
    if (req.method === "PUT" && path.match(/^\/repos\/[^/]+\/[^/]+\/pulls\/\d+\/merge$/)) {
      return new Response(null, { status: 204 });
    }

    // GET /repos/{owner}/{repo}/pulls/{number} (single PR, after merge)
    if (req.method === "GET" && path.match(/^\/repos\/[^/]+\/[^/]+\/pulls\/\d+$/)) {
      return Response.json({
        number: 10,
        title: "Merged PR",
        state: "closed",
        user: { login: "dev" },
        head: { ref: "feature-branch" },
        base: { ref: "main" },
        merged: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
      });
    }

    // GET /repos/{owner}/{repo}/issues/{number}/comments
    if (req.method === "GET" && path.match(/^\/repos\/[^/]+\/[^/]+\/issues\/\d+\/comments/)) {
      return Response.json([
        {
          id: 100,
          body: "Looks good!",
          user: { login: "reviewer" },
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ]);
    }

    // POST /repos/{owner}/{repo}/issues/{number}/comments
    if (req.method === "POST" && path.match(/^\/repos\/[^/]+\/[^/]+\/issues\/\d+\/comments$/)) {
      return Response.json({
        id: 200,
        body: "Comment added",
        user: { login: "agent" },
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      });
    }

    // GET /repos/{owner}/{repo}/nonexistent (404 error)
    if (req.method === "GET" && path === "/repos/test-owner/test-repo/nonexistent") {
      return Response.json({ message: "Not Found", documentation_url: "https://docs.github.com" }, { status: 404 });
    }

    // GET /repos/{owner}/{repo} (must be after more specific /pulls and /issues routes)
    if (req.method === "GET" && path.match(/^\/repos\/[^/]+\/[^/]+$/)) {
      return Response.json({
        name: "test-repo",
        full_name: "test-owner/test-repo",
        description: "A test repo",
        private: false,
        default_branch: "main",
      });
    }

    // GET /repos/{owner}/{repo}/issues (list — after /issues/{number} routes)
    if (req.method === "GET" && path.match(/^\/repos\/[^/]+\/[^/]+\/issues$/)) {
      return Response.json([
        {
          number: 1,
          title: "Bug report",
          body: "Something is broken",
          state: "open",
          user: { login: "testuser" },
          assignees: [],
          labels: [{ name: "bug" }],
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ]);
    }

    // POST /repos/{owner}/{repo}/issues
    if (req.method === "POST" && path.match(/^\/repos\/[^/]+\/[^/]+\/issues$/)) {
      return Response.json({
        number: 42,
        title: "New issue",
        body: "Created",
        state: "open",
        user: { login: "agent" },
        assignees: [],
        labels: [],
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      });
    }

    // GET /repos/{owner}/{repo}/pulls (list — after /pulls/{number} routes)
    if (req.method === "GET" && path.match(/^\/repos\/[^/]+\/[^/]+\/pulls$/)) {
      return Response.json([
        {
          number: 10,
          title: "Feature PR",
          body: "New feature",
          state: "open",
          user: { login: "dev" },
          head: { ref: "feature-branch" },
          base: { ref: "main" },
          merged: false,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ]);
    }

    // POST /repos/{owner}/{repo}/pulls
    if (req.method === "POST" && path.match(/^\/repos\/[^/]+\/[^/]+\/pulls$/)) {
      return Response.json({
        number: 20,
        title: "New PR",
        body: "Created",
        state: "open",
        user: { login: "agent" },
        head: { ref: "my-branch" },
        base: { ref: "main" },
        merged: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      });
    }

    // GET /repos/{owner}/{repo}/actions/workflows/{id}/runs (before generic workflows/runs routes)
    if (req.method === "GET" && path.match(/^\/repos\/[^/]+\/[^/]+\/actions\/workflows\/\d+\/runs$/)) {
      return Response.json({
        total_count: 1,
        workflow_runs: [
          {
            id: 82001,
            name: "CI",
            status: "completed",
            conclusion: "failure",
            created_at: "2026-02-01T00:00:00Z",
            updated_at: "2026-02-01T00:03:00Z",
            run_started_at: "2026-02-01T00:00:05Z",
          },
        ],
      });
    }

    // GET /repos/{owner}/{repo}/actions/runs
    if (req.method === "GET" && path.match(/^\/repos\/[^/]+\/[^/]+\/actions\/runs$/)) {
      return Response.json({
        total_count: 2,
        workflow_runs: [
          {
            id: 81001,
            name: "CI",
            status: "completed",
            conclusion: "success",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:05:00Z",
            run_started_at: "2026-01-01T00:00:10Z",
          },
          {
            id: 81002,
            name: "CI",
            status: "in_progress",
            created_at: "2026-01-02T00:00:00Z",
            updated_at: "2026-01-02T00:01:00Z",
            run_started_at: "2026-01-02T00:00:00Z",
          },
        ],
      });
    }

    // GET /repos/{owner}/{repo}/actions/workflows (rate-limited owner → 403 with quota headers)
    if (req.method === "GET" && path === "/repos/rate-limited-owner/rate-limited-repo/actions/workflows") {
      return new Response(JSON.stringify({ message: "API rate limit exceeded" }), {
        status: 403,
        headers: {
          "content-type": "application/json",
          "x-ratelimit-limit": "60",
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": String(RATE_LIMIT_RESET),
        },
      });
    }

    // GET /repos/{owner}/{repo}/actions/workflows (list)
    if (req.method === "GET" && path.match(/^\/repos\/[^/]+\/[^/]+\/actions\/workflows$/)) {
      return Response.json({
        total_count: 2,
        workflows: [
          {
            id: 7001,
            name: "CI",
            path: ".github/workflows/ci.yml",
            state: "active",
            last_run_status: "success",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
          {
            id: 7002,
            name: "Release",
            path: ".github/workflows/release.yml",
            state: "disabled_manually",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        ],
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  });

  const addr = server.addr as Deno.NetAddr;
  return {
    url: `http://127.0.0.1:${addr.port}`,
    close: async () => {
      await server.shutdown();
    },
  };
}

Deno.test("GitHubCapability", async (t) => {
  const mock = startMockServer();
  const context: CapabilityContext = {
    session_id: "test-session",
    environment: {
      GITHUB_TOKEN: "ghp_test_token",
      GITHUB_OWNER: "test-owner",
      GITHUB_REPO: "test-repo",
      GITHUB_API_BASE: mock.url,
    },
  };

  try {
    await t.step("initializes with token", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);
      assertEquals(gh.definition.name, "github");
    });

    await t.step("getRepository returns repo info", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);

      const result = await gh.getRepository();
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.name, "test-repo");
      assertEquals(result.data.full_name, "test-owner/test-repo");
    });

    await t.step("listIssues returns issues", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);

      const result = await gh.listIssues();
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length, 1);
      assertEquals(result.data[0].number, 1);
      assertEquals(result.data[0].title, "Bug report");
      assertEquals(result.data[0].author, "testuser");
    });

    await t.step("createIssue creates an issue", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);

      const result = await gh.createIssue({ title: "New issue" });
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.number, 42);
    });

    await t.step("listPullRequests returns PRs", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);

      const result = await gh.listPullRequests();
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length, 1);
      assertEquals(result.data[0].number, 10);
      assertEquals(result.data[0].head, "feature-branch");
      assertEquals(result.data[0].state, "open");
    });

    await t.step("createPullRequest creates a PR", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);

      const result = await gh.createPullRequest({
        title: "New PR",
        head: "my-branch",
        base: "main",
      });
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.number, 20);
    });

    await t.step("mergePullRequest merges a PR", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);

      const result = await gh.mergePullRequest(10);
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.merged, true);
      assertEquals(result.data.state, "merged");
    });

    await t.step("listIssueComments returns comments", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);

      const result = await gh.listIssueComments(1);
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length, 1);
      assertEquals(result.data[0].body, "Looks good!");
      assertEquals(result.data[0].author, "reviewer");
    });

    await t.step("createIssueComment creates a comment", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);

      const result = await gh.createIssueComment(1, "Nice work!");
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.id, 200);
    });

    await t.step("listWorkflows returns workflows", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);

      const result = await gh.listWorkflows("test-owner", "test-repo");
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length, 2);
      assertEquals(result.data[0].id, 7001);
      assertEquals(result.data[0].name, "CI");
      assertEquals(result.data[0].state, "active");
      assertEquals(result.data[0].last_run_status, "success");
      assertEquals(result.data[1].name, "Release");
      assertEquals(result.data[1].state, "disabled_manually");
    });

    await t.step("getWorkflowRuns returns runs without workflowId", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);

      const result = await gh.getWorkflowRuns("test-owner", "test-repo");
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length, 2);
      assertEquals(result.data[0].id, 81001);
      assertEquals(result.data[0].status, "completed");
      assertEquals(result.data[0].conclusion, "success");
      assertEquals(result.data[0].created_at, "2026-01-01T00:00:00Z");
      assertEquals(result.data[0].updated_at, "2026-01-01T00:05:00Z");
      assertEquals(result.data[0].run_started_at, "2026-01-01T00:00:10Z");
      assertEquals(result.data[1].status, "in_progress");
      assertEquals(result.data[1].conclusion, undefined);
    });

    await t.step("getWorkflowRuns returns runs for a workflow when workflowId given", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);

      const result = await gh.getWorkflowRuns("test-owner", "test-repo", "7001");
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(result.data.length, 1);
      assertEquals(result.data[0].id, 82001);
      assertEquals(result.data[0].status, "completed");
      assertEquals(result.data[0].conclusion, "failure");
      assertEquals(result.data[0].updated_at, "2026-02-01T00:03:00Z");
    });

    await t.step("rate limit error includes reset time and remaining quota", async () => {
      const gh = new GitHubCapability();
      await gh.initialize(context);

      const result = await gh.listWorkflows("rate-limited-owner", "rate-limited-repo");
      assertEquals(result.success, false);
      assertExists(result.error);
      const message = result.error as string;
      const expectedIso = new Date(RATE_LIMIT_RESET * 1000).toISOString();
      assertEquals(message.includes("GitHub API rate limit exceeded"), true);
      assertEquals(message.includes("0 requests remaining"), true);
      assertEquals(message.includes(`resets at ${expectedIso}`), true);
    });

    await t.step("fails when not initialized", async () => {
      const gh = new GitHubCapability();

      let threw = false;
      try {
        await gh.getRepository();
      } catch (e) {
        threw = e instanceof Error && e.name === "CapabilityNotInitializedError";
      }
      assertEquals(threw, true);
    });
  } finally {
    await mock.close();
  }
});
