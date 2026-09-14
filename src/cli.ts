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
import { PersistentEventStore } from "./store/persistence.ts";
import { SQLitePersistenceBackend } from "./store/sqlite-backend.ts";
import { ProjectionProtocol } from "./projection/protocol.ts";
import { ModelManager } from "./runtime/model-provider.ts";
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
  capabilityRegistry.register(shellCap);
  capabilityRegistry.register(gitCap);

  // Initialize persistent event store with SQLite backend
  const dbPath = `${projectDir}/.kayak/events.sqlite`;
  const backend = new SQLitePersistenceBackend({ dbPath });
  const eventStore = new PersistentEventStore({
    dataDir: `${projectDir}/.kayak`,
    backend,
  });

  const projectionProtocol = new ProjectionProtocol(eventStream);
  const modelManager = new ModelManager();

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

  return {
    eventStream,
    sessionManager,
    capabilityRegistry,
    eventStore,
    projectionProtocol,
    modelManager,
    toolRegistry,
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
    await Deno.stdout.write(encoder.encode(`\x1b[1m[kayak]\x1b[0m `));

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
