/**
 * Kayak-lab CLI entry point.
 *
 * Provides interactive agent loop for real projects and session analysis.
 *
 * Usage:
 *   kayak run                  # Start interactive REPL in current directory
 *   kayak analyze              # Analyze captured sessions
 *   kayak export [--session]   # Export events as JSON
 */

import { EventStream } from "./core/event-stream.ts";
import { SessionManager } from "./core/session-manager.ts";
import { CapabilityRegistry } from "./capabilities/capability.ts";
import { ShellCapability } from "./capabilities/shell.ts";
import { GitCapability } from "./capabilities/git.ts";
import { FileCapability } from "./capabilities/file.ts";
import { SearchCapability } from "./capabilities/search.ts";
import { GitHubCapability } from "./capabilities/github.ts";
import { PersistentEventStore } from "./store/persistence.ts";
import { SQLitePersistenceBackend } from "./store/sqlite-backend.ts";
import { EventStoreBridge } from "./store/event-store.ts";
import { ProjectionProtocol } from "./projection/protocol.ts";
import { ModelManager, type IModelProvider, type ModelRequest, type ModelResponse, type StreamDelta } from "./runtime/model-provider.ts";
import { AgentRuntime } from "./runtime/agent-runtime.ts";
import {
  ToolRegistry,
  type ToolHandler,
  type ToolContext,
} from "./runtime/tool-registry.ts";
import {
  analyzeSessions,
  formatAnalysisReport,
} from "./analysis.ts";

// ============================================================================
// CLI Types
// ============================================================================

interface CliArgs {
  command: "run" | "analyze" | "export";
  projectDir: string;
  sessionId?: string;
}

// ============================================================================
// Argument Parsing
// ============================================================================

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    command: "run",
    projectDir: Deno.cwd(),
  };

  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--project" && i + 1 < args.length) {
      result.projectDir = args[++i];
    } else if (arg === "--session" && i + 1 < args.length) {
      result.sessionId = args[++i];
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    result.command = positional[0] as CliArgs["command"];
  }

  return result;
}

// ============================================================================
// Project Detection
// ============================================================================

interface ProjectInfo {
  name: string;
  type: string;
  version?: string;
  path: string;
}

async function detectProject(dir: string): Promise<ProjectInfo> {
  const info: ProjectInfo = {
    name: dir.split("/").pop() || "unknown",
    type: "unknown",
    path: dir,
  };

  const projectFiles: Record<string, string> = {
    "deno.json": "deno",
    "deno.jsonc": "deno",
    "package.json": "node",
    "Cargo.toml": "rust",
    "go.mod": "go",
    "pyproject.toml": "python",
    "Gemfile": "ruby",
    "pom.xml": "java",
    "build.gradle": "java",
  };

  for (const [file, type] of Object.entries(projectFiles)) {
    try {
      const content = await Deno.readTextFile(`${dir}/${file}`);
      info.type = type;

      if (file === "package.json") {
        const pkg = JSON.parse(content);
        info.name = pkg.name || info.name;
        info.version = pkg.version;
      }

      if (file === "deno.json" || file === "deno.jsonc") {
        const deno = JSON.parse(content);
        info.name = deno.name || info.name;
        info.version = deno.version;
      }

      break;
    } catch {
      // File doesn't exist, continue
    }
  }

  return info;
}

// ============================================================================
// Harness Initialization
// ============================================================================

interface HarnessComponents {
  eventStream: EventStream;
  sessionManager: SessionManager;
  capabilityRegistry: CapabilityRegistry;
  eventStore: PersistentEventStore;
  projectionProtocol: ProjectionProtocol;
  modelManager: ModelManager;
  toolRegistry: ToolRegistry;
  bridge?: EventStoreBridge;
}

async function initializeHarness(
  projectDir: string,
  _projectInfo: ProjectInfo,
): Promise<HarnessComponents> {
  const eventStream = new EventStream();
  const sessionManager = new SessionManager(eventStream);

  const capabilityRegistry = new CapabilityRegistry();
  const shellCap = new ShellCapability();
  const gitCap = new GitCapability();
  const fileCap = new FileCapability();
  const searchCap = new SearchCapability();
  const githubCap = new GitHubCapability();
  capabilityRegistry.register(shellCap);
  capabilityRegistry.register(gitCap);
  capabilityRegistry.register(fileCap);
  capabilityRegistry.register(searchCap);
  capabilityRegistry.register(githubCap);

  // Initialize persistent event store with SQLite backend
  const dbPath = `${projectDir}/.kayak/events.sqlite`;
  const backend = new SQLitePersistenceBackend({ dbPath });
  const eventStore = new PersistentEventStore({
    dataDir: `${projectDir}/.kayak`,
    backend,
  });

  // Bridge EventStream to SQLite persistence
  const bridge = new EventStoreBridge(eventStream, {
    dataDir: `${projectDir}/.kayak`,
    backend,
  });
  bridge.connect();

  const projectionProtocol = new ProjectionProtocol(eventStream);

  // ModelManager: check for API key and register provider
  const modelManager = new ModelManager();
  const apiKeyEnv: Record<string, { key: string; baseUrl: string; defaultModel: string; name: string }> = {
    OPENAI_API_KEY: {
      key: Deno.env.get("OPENAI_API_KEY") ?? "",
      baseUrl: "https://api.openai.com/v1",
      defaultModel: "gpt-4o",
      name: "openai",
    },
    ANTHROPIC_API_KEY: {
      key: Deno.env.get("ANTHROPIC_API_KEY") ?? "",
      baseUrl: "https://api.anthropic.com/v1",
      defaultModel: "claude-sonnet-4-20250514",
      name: "anthropic",
    },
    GOOGLE_API_KEY: {
      key: Deno.env.get("GOOGLE_API_KEY") ?? "",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      defaultModel: "gemini-2.0-flash",
      name: "google",
    },
  };

  let detectedProvider: { key: string; baseUrl: string; defaultModel: string; name: string } | null = null;
  for (const envVar of Object.keys(apiKeyEnv)) {
    const entry = apiKeyEnv[envVar];
    if (entry.key) {
      detectedProvider = entry;
      break;
    }
  }

  if (!detectedProvider) {
    console.error("Error: No API key configured. Set one of OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY.");
    Deno.exit(1);
  }

  const providerName = detectedProvider.name;
  const apiKey = detectedProvider.key;
  const baseUrl = detectedProvider.baseUrl;
  const defaultModel = detectedProvider.defaultModel;

  const openaiCompatibleProvider: IModelProvider = {
    name: providerName,
    async invoke(request: ModelRequest): Promise<ModelResponse> {
      const model = request.model ?? defaultModel;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      };
      const body: Record<string, unknown> = {
        model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      };
      if (request.tools && request.tools.length > 0) {
        body.tools = request.tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }));
      }
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Model API error ${response.status}: ${text}`);
      }
      const data = await response.json();
      const choice = data.choices?.[0];
      if (!choice) {
        throw new Error("No choices in model response");
      }
      return {
        content: choice.message?.content ?? null,
        tool_calls: (choice.message?.tool_calls ?? []).map((tc: Record<string, unknown>) => ({
          id: tc.id as string,
          name: (tc.function as Record<string, unknown>)?.name as string,
          arguments: JSON.parse((tc.function as Record<string, unknown>)?.arguments as string ?? "{}"),
        })),
        finish_reason: choice.finish_reason ?? "stop",
        usage: data.usage,
      };
    },
    async *stream(request: ModelRequest): AsyncIterable<StreamDelta> {
      const model = request.model ?? defaultModel;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      };
      const body: Record<string, unknown> = {
        model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        stream: true,
      };
      if (request.tools && request.tools.length > 0) {
        body.tools = request.tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }));
      }
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Model API error ${response.status}: ${text}`);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") return;
            try {
              const chunk = JSON.parse(jsonStr);
              const delta = chunk.choices?.[0]?.delta;
              if (delta) {
                yield {
                  content: delta.content ?? undefined,
                  tool_calls: delta.tool_calls?.map((tc: Record<string, unknown>) => ({
                    id: tc.id as string,
                    name: (tc.function as Record<string, unknown>)?.name as string,
                    arguments: JSON.parse((tc.function as Record<string, unknown>)?.arguments as string ?? "{}"),
                  })),
                  finish_reason: chunk.choices?.[0]?.finish_reason ?? undefined,
                };
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }
    },
  };
  modelManager.register(openaiCompatibleProvider);

  // Initialize runtime tool registry
  const toolRegistry = new ToolRegistry();

  const shellHandler: ToolHandler<{ command: string }, string> = async (
    params,
    _context: ToolContext,
  ) => {
    await shellCap.initialize({ session_id: "cli", working_directory: projectDir });
    const result = await shellCap.exec(params.command);
    if (result.error) {
      const msg = typeof result.error === "string" ? result.error : result.error.message;
      throw new Error(msg);
    }
    if (!result.data) {
      throw new Error("No data returned from shell");
    }
    return result.data.stdout || result.data.stderr;
  };

  toolRegistry.register({
    name: "shell",
    description: "Execute shell commands in the project directory",
    parameters: {
      command: { type: "string", description: "Shell command to execute" },
    },
    handler: shellHandler as ToolHandler,
  });

  const gitHandler: ToolHandler<{ command: string }, string> = async (
    _params,
    _context: ToolContext,
  ) => {
    await gitCap.initialize({ session_id: "cli", working_directory: projectDir });
    // Git capability doesn't have a generic exec, use getStatus as example
    const result = await gitCap.getStatus();
    if (result.error) {
      const msg = typeof result.error === "string" ? result.error : result.error.message;
      throw new Error(msg);
    }
    return JSON.stringify(result.data);
  };

  toolRegistry.register({
    name: "git",
    description: "Execute git commands in the project directory",
    parameters: {
      command: { type: "string", description: "Git command to execute" },
    },
    handler: gitHandler as ToolHandler,
  });

  // File tool handler
  const fileHandler: ToolHandler = async (
    params,
    _context: ToolContext,
  ) => {
    const p = params as {
      action: string;
      path?: string;
      content?: string;
      old_string?: string;
      new_string?: string;
      offset?: number;
      limit?: number;
      replace_all?: boolean;
    };
    await fileCap.initialize({ session_id: "cli", working_directory: projectDir });
    switch (p.action) {
      case "read": {
        if (!p.path) throw new Error("path is required for read");
        const result = await fileCap.read(p.path, {
          offset: p.offset,
          limit: p.limit,
        });
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : result.error.message;
          throw new Error(msg);
        }
        return JSON.stringify(result.data);
      }
      case "write": {
        if (!p.path) throw new Error("path is required for write");
        if (p.content === undefined) throw new Error("content is required for write");
        const result = await fileCap.write(p.path, p.content);
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : result.error.message;
          throw new Error(msg);
        }
        return JSON.stringify(result.data);
      }
      case "edit": {
        if (!p.path) throw new Error("path is required for edit");
        if (!p.old_string) throw new Error("old_string is required for edit");
        if (p.new_string === undefined) throw new Error("new_string is required for edit");
        const result = await fileCap.edit(p.path, p.old_string, p.new_string, {
          replace_all: p.replace_all,
        });
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : result.error.message;
          throw new Error(msg);
        }
        return JSON.stringify(result.data);
      }
      default:
        throw new Error(`Unknown file action: ${p.action}`);
    }
  };

  toolRegistry.register({
    name: "file",
    description: "Read, write, and edit files in the project directory",
    parameters: {
      action: { type: "string", description: "Action to perform: read, write, or edit" },
      path: { type: "string", description: "File path relative to project root" },
      content: { type: "string", description: "Content to write (for write action)" },
      old_string: { type: "string", description: "String to replace (for edit action)" },
      new_string: { type: "string", description: "Replacement string (for edit action)" },
      offset: { type: "number", description: "Line offset for read (1-indexed)" },
      limit: { type: "number", description: "Max lines to read" },
      replace_all: { type: "boolean", description: "Replace all occurrences (for edit action)" },
    },
    handler: fileHandler,
  });

  // Search tool handler
  const searchHandler: ToolHandler = async (
    params,
    _context: ToolContext,
  ) => {
    const p = params as {
      action: string;
      pattern: string;
      path?: string;
      options?: {
        case?: boolean;
        glob?: string;
        hidden?: boolean;
        gitignore?: boolean;
      };
    };
    await searchCap.initialize({ session_id: "cli", working_directory: projectDir });
    switch (p.action) {
      case "grep": {
        const result = await searchCap.grep(p.pattern, p.path, {
          case: p.options?.case,
          glob: p.options?.glob,
        });
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : result.error.message;
          throw new Error(msg);
        }
        return JSON.stringify(result.data);
      }
      case "glob": {
        const result = await searchCap.glob(p.pattern, {
          hidden: p.options?.hidden,
          gitignore: p.options?.gitignore,
        });
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : result.error.message;
          throw new Error(msg);
        }
        return JSON.stringify(result.data);
      }
      default:
        throw new Error(`Unknown search action: ${p.action}`);
    }
  };

  toolRegistry.register({
    name: "search",
    description: "Search the codebase using grep (regex) or glob (file patterns)",
    parameters: {
      action: { type: "string", description: "Action to perform: grep or glob" },
      pattern: { type: "string", description: "Search pattern (regex for grep, glob pattern for glob)" },
      path: { type: "string", description: "File or directory to search in" },
      options: {
        type: "object",
        properties: {
          case: { type: "boolean", description: "Case-sensitive search (default: true)" },
          glob: { type: "string", description: "File glob filter for grep (e.g. *.ts)" },
          hidden: { type: "boolean", description: "Include hidden files for glob" },
          gitignore: { type: "boolean", description: "Respect .gitignore for glob" },
        },
      },
    },
    handler: searchHandler,
  });

  // GitHub tool handler
  const githubHandler: ToolHandler = async (
    params,
    _context: ToolContext,
  ) => {
    const p = params as {
      action: string;
      [key: string]: unknown;
    };
    const env: Record<string, string> = {};
    const ghToken = Deno.env.get("GITHUB_TOKEN");
    if (ghToken) env["GITHUB_TOKEN"] = ghToken;
    const ghOwner = Deno.env.get("GITHUB_OWNER");
    if (ghOwner) env["GITHUB_OWNER"] = ghOwner;
    const ghRepo = Deno.env.get("GITHUB_REPO");
    if (ghRepo) env["GITHUB_REPO"] = ghRepo;
    await githubCap.initialize({ session_id: "cli", working_directory: projectDir, environment: env });
    switch (p.action) {
      case "getRepository": {
        const result = await githubCap.getRepository();
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : result.error.message;
          throw new Error(msg);
        }
        return JSON.stringify(result.data);
      }
      case "listIssues": {
        const result = await githubCap.listIssues({
          state: p.state as "open" | "closed" | undefined,
          labels: p.labels as string[] | undefined,
          assignee: p.assignee as string | undefined,
          limit: p.limit as number | undefined,
        });
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : result.error.message;
          throw new Error(msg);
        }
        return JSON.stringify(result.data);
      }
      case "getIssue": {
        const result = await githubCap.getIssue(p.number as number);
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : result.error.message;
          throw new Error(msg);
        }
        return JSON.stringify(result.data);
      }
      case "createIssue": {
        const result = await githubCap.createIssue({
          title: p.title as string,
          body: p.body as string | undefined,
          labels: p.labels as string[] | undefined,
          assignees: p.assignees as string[] | undefined,
        });
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : result.error.message;
          throw new Error(msg);
        }
        return JSON.stringify(result.data);
      }
      case "listPullRequests": {
        const result = await githubCap.listPullRequests({
          state: p.state as "open" | "closed" | "merged" | undefined,
          limit: p.limit as number | undefined,
        });
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : result.error.message;
          throw new Error(msg);
        }
        return JSON.stringify(result.data);
      }
      case "getPullRequest": {
        const result = await githubCap.getPullRequest(p.number as number);
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : result.error.message;
          throw new Error(msg);
        }
        return JSON.stringify(result.data);
      }
      default:
        throw new Error(`Unknown github action: ${p.action}`);
    }
  };

  toolRegistry.register({
    name: "github",
    description: "GitHub API operations (repository, issues, pull requests)",
    parameters: {
      action: { type: "string", description: "Action to perform (getRepository, listIssues, getIssue, createIssue, listPullRequests, getPullRequest)" },
      state: { type: "string", description: "Filter by state (open, closed, merged)" },
      labels: { type: "array", items: { type: "string" }, description: "Filter by labels" },
      assignee: { type: "string", description: "Filter by assignee" },
      limit: { type: "number", description: "Max results to return" },
      number: { type: "number", description: "Issue or PR number" },
      title: { type: "string", description: "Issue title" },
      body: { type: "string", description: "Issue or PR body" },
    },
    handler: githubHandler,
  });

  return {
    eventStream,
    sessionManager,
    capabilityRegistry,
    eventStore,
    projectionProtocol,
    modelManager,
    toolRegistry,
    bridge,
  };
}

// ============================================================================
// REPL
// ============================================================================

async function runRepl(
  components: HarnessComponents,
  projectInfo: ProjectInfo,
  projectDir: string,
): Promise<void> {
  const agentRuntime = new AgentRuntime(
    components.eventStream,
    components.sessionManager,
    components.modelManager,
    components.toolRegistry,
    {}, // config - system_prompt not supported in AgentConfig
    {
      onModelRequest: () => {
        Deno.stdout.write(new TextEncoder().encode("\r\x1b[36mThinking...\x1b[0m"));
      },
      onModelResponse: (response) => {
        Deno.stdout.write(new TextEncoder().encode("\r\x1b[2K"));
        console.log(`\n\x1b[32m${response.content}\x1b[0m\n`);
      },
      onToolCall: (toolCall) => {
        console.log(`\x1b[33m  → ${toolCall.name}(${JSON.stringify(toolCall.arguments)})\x1b[0m`);
      },
      onToolResult: (result) => {
        if (result.error) {
          console.log(`\x1b[31m  ✗ ${result.error}\x1b[0m`);
        } else {
          const preview = String(result.result).length > 200
            ? String(result.result).substring(0, 200) + "..."
            : String(result.result);
          console.log(`\x1b[32m  ✓ ${preview}\x1b[0m`);
        }
      },
    },
  );

  const sessionId = await agentRuntime.start();
  console.log(`\n\x1b[1mKayak CLI\x1b[0m — ${projectInfo.name} (${projectInfo.type})`);
  console.log(`Session: ${sessionId}`);
  console.log(`Project: ${projectDir}\n`);
  console.log(`Type commands to interact. Type :quit to exit.\n`);

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const buffer = new Uint8Array(1024);

  while (true) {
    await Deno.stdout.write(encoder.encode(`\x1b[1m[kayak]$\x1b[0m `));

    let line = "";
    while (true) {
      const n = await Deno.stdin.read(buffer);
      if (n === null) break;
      const chunk = decoder.decode(buffer.subarray(0, n));
      if (chunk.includes("\n")) {
        line += chunk.split("\n")[0];
        break;
      }
      line += chunk;
    }

    if (!line.trim()) continue;

    if (line.trim() === ":quit") {
      console.log("\nEnding session...");
      await agentRuntime.stop();
      console.log("Session ended. Events saved to .kayak/events.sqlite");
      break;
    }

    if (line.trim() === ":status") {
      const session = components.sessionManager.getSession(sessionId);
      console.log(`\nSession: ${session?.id}`);
      console.log(`State: ${session?.state}`);
      console.log(`Events: ${components.eventStream.getEvents(sessionId).length}`);
      console.log(`Project: ${projectInfo.name} (${projectInfo.type})\n`);
      continue;
    }

    if (line.trim() === ":history") {
      const events = components.eventStream.getEvents(sessionId);
      console.log(`\nEvent history (${events.length} events):\n`);
      for (const event of events.slice(-20)) {
        console.log(`  ${event.sequence_number} ${event.event_type}`);
      }
      console.log("");
      continue;
    }

    try {
      await agentRuntime.processInput(line);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`\x1b[31mError: ${msg}\x1b[0m\n`);
    }
  }
}

// ============================================================================
// Analysis
// ============================================================================

async function analyze(projectDir: string, exportJson: boolean): Promise<void> {
  const dbPath = `${projectDir}/.kayak/events.sqlite`;

  try {
    await Deno.stat(dbPath);
  } catch {
    console.error(`No kayak data found in ${projectDir}`);
    console.error("Run 'kayak run' first to create a session.");
    Deno.exit(1);
  }

  const backend = new SQLitePersistenceBackend({ dbPath });
  const sessionIds = backend.listSessions();

  if (sessionIds.length === 0) {
    console.log("No sessions found.");
    return;
  }

  // Build session summaries from SQLite
  const sessions: { id: string; state: string }[] = [];
  const allEvents: Record<string, unknown[]> = {};

  for (const sessionId of sessionIds) {
    const events = backend.readLines(sessionId);
    const parsed = events.map((line) => JSON.parse(line));

    // Determine state from events
    const lastEvent = parsed[parsed.length - 1];
    const state = lastEvent?.event_type?.replace("session.", "") || "unknown";

    sessions.push({ id: sessionId, state });
    allEvents[sessionId] = parsed;
  }

  if (exportJson) {
    console.log(JSON.stringify(allEvents, null, 2));
  } else {
    const analysis = await analyzeSessions(sessions, {
      getEvents: (id: string) => allEvents[id] || [],
    } as never);
    console.log(formatAnalysisReport(analysis));
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);

  switch (args.command) {
    case "run": {
      await Deno.mkdir(`${args.projectDir}/.kayak`, { recursive: true });
      const projectInfo = await detectProject(args.projectDir);
      console.log(`Detected project: ${projectInfo.name} (${projectInfo.type})`);
      const components = await initializeHarness(args.projectDir, projectInfo);
      await runRepl(components, projectInfo, args.projectDir);
      break;
    }

    case "analyze": {
      await analyze(args.projectDir, false);
      break;
    }

    case "export": {
      await analyze(args.projectDir, true);
      break;
    }

    default:
      console.error(`Unknown command: ${args.command}`);
      console.error("Usage: kayak [run|analyze|export]");
      Deno.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  Deno.exit(1);
});
