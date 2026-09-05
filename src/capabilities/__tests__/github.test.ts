import { assertEquals, assertExists } from "@std/assert";
import { GitHubCapability } from "../github.ts";
import type { CapabilityContext } from "../capability.ts";

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
