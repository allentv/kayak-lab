/**
 * Integration tests for the coding harness (tasks 8.1–8.3).
 *
 * Tests individual harness components working together:
 * - 8.1  File read via REPL-style tool handler
 * - 8.2  Git status + event persistence through the bridge
 * - 8.3  Analysis report generation from persisted session data
 */

import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import { v4 as uuidv4 } from "uuid";

// Core
import { EventStream } from "../core/event-stream.ts";
import { SessionManager } from "../core/session-manager.ts";

// Capabilities
import { CapabilityRegistry } from "../capabilities/capability.ts";
import { FileCapability } from "../capabilities/file.ts";
import { ShellCapability } from "../capabilities/shell.ts";
import { GitCapability } from "../capabilities/git.ts";

// Runtime
import { ToolRegistry, type ToolContext } from "../runtime/tool-registry.ts";

// Store / persistence
import { EventStore, EventStoreBridge } from "../store/event-store.ts";
import { SQLitePersistenceBackend } from "../store/sqlite-backend.ts";

// Analysis
import {
  analyzeSessions,
  formatAnalysisReport,
} from "../analysis.ts";

// Types
import type { BaseEvent } from "../types/events.ts";
import { EventTypes, CURRENT_SCHEMA_VERSION } from "../types/events.ts";

// ============================================================================
// Helpers
// ============================================================================

/** Create a temp directory and return its path. */
async function makeTempDir(prefix: string): Promise<string> {
  return await Deno.makeTempDir({ prefix });
}

/** Recursively remove a directory. */
async function removeDir(dir: string): Promise<void> {
  await Deno.remove(dir, { recursive: true });
}

/** Create a temp SQLite db path inside a parent dir. */
function tempDbPath(dir: string): string {
  return `${dir}/events.sqlite`;
}

// ============================================================================
// 8.1 — File read via REPL flow
// ============================================================================

Deno.test("Integration: coding harness", async (t) => {
  await t.step("8.1 — file read via REPL flow", async () => {
    const projectDir = await makeTempDir("file-read-test-");

    try {
      // Write a test file
      const testFileName = "hello.txt";
      const testContent = "Hello from integration test!\nLine two.\n";
      await Deno.writeTextFile(`${projectDir}/${testFileName}`, testContent);

      // Construct harness components
      const eventStream = new EventStream();
      const sessionManager = new SessionManager(eventStream);

      const capabilityRegistry = new CapabilityRegistry();
      const fileCap = new FileCapability();
      const shellCap = new ShellCapability();
      capabilityRegistry.register(fileCap);
      capabilityRegistry.register(shellCap);

      const toolRegistry = new ToolRegistry();

      // Register file tool handler (mirrors cli.ts wiring)
      const fileHandler = async (
        params: unknown,
        _context: ToolContext,
      ) => {
        const p = params as Record<string, unknown>;
        await fileCap.initialize({
          session_id: "test",
          working_directory: projectDir,
        });
        const action = p.action as string;
        switch (action) {
          case "read": {
            const filePath = p.path as string;
            if (!filePath) throw new Error("path is required for read");
            const result = await fileCap.read(filePath);
            if (result.error) {
              const msg = typeof result.error === "string"
                ? result.error
                : result.error.message;
              throw new Error(msg);
            }
            return JSON.stringify(result.data);
          }
          default:
            throw new Error(`Unknown file action: ${action}`);
        }
      };

      toolRegistry.register({
        name: "file",
        description: "Read, write, and edit files",
        parameters: {
          action: { type: "string", description: "Action: read, write, or edit" },
          path: { type: "string", description: "File path" },
        },
        handler: fileHandler,
      });

      // Create a session
      const session = sessionManager.createSession({
        description: "File read integration test",
      });
      assertExists(session.id);

      // Invoke the file tool via ToolRegistry
      const toolCallId = uuidv4();
      const result = await toolRegistry.invoke(
        {
          id: toolCallId,
          name: "file",
          arguments: { action: "read", path: testFileName },
        },
        { session_id: session.id },
      );

      assertEquals(result.success, true);
      assertExists(result.result);

      // The handler returns JSON-stringified data (a string)
      const fileContent = result.result as string;
      assertStringIncludes(fileContent, "Hello from integration test!");
      assertStringIncludes(fileContent, "Line two.");
    } finally {
      await removeDir(projectDir);
    }
  });

  // ========================================================================
  // 8.2 — Git status + event persistence
  // ========================================================================

  await t.step("8.2 — git status + event persistence", async () => {
    const projectDir = await makeTempDir("git-persist-test-");
    const dbDir = await makeTempDir("git-persist-db-");

    try {
      // Initialise a git repo in projectDir
      const gitInit = new Deno.Command("git", {
        args: ["init"],
        cwd: projectDir,
      });
      await gitInit.output();

      const gitConfigName = new Deno.Command("git", {
        args: ["config", "user.email", "test@test.com"],
        cwd: projectDir,
      });
      await gitConfigName.output();

      const gitConfigUser = new Deno.Command("git", {
        args: ["config", "user.name", "Test User"],
        cwd: projectDir,
      });
      await gitConfigUser.output();

      // Create an initial commit so git status has a branch to report
      await Deno.writeTextFile(`${projectDir}/README.md`, "# test\n");
      const gitAdd = new Deno.Command("git", {
        args: ["add", "."],
        cwd: projectDir,
      });
      await gitAdd.output();
      const gitCommit = new Deno.Command("git", {
        args: ["commit", "-m", "initial"],
        cwd: projectDir,
      });
      await gitCommit.output();

      // Harness components
      const eventStream = new EventStream();
      const sessionManager = new SessionManager(eventStream);

      // Persistence layer
      const dbPath = tempDbPath(dbDir);
      const backend = new SQLitePersistenceBackend({ dbPath });

      // Bridge EventStream → PersistentEventStore
      const bridge = new EventStoreBridge(eventStream, { dataDir: dbDir, backend });
      bridge.connect();

      // Capabilities
      const capabilityRegistry = new CapabilityRegistry();
      const gitCap = new GitCapability();
      capabilityRegistry.register(gitCap);

      const toolRegistry = new ToolRegistry();

      // Register git tool handler (mirrors cli.ts wiring)
      const gitHandler = async (
        _params: unknown,
        _context: ToolContext,
      ) => {
        await gitCap.initialize({
          session_id: "test",
          working_directory: projectDir,
        });
        const result = await gitCap.getStatus();
        if (result.error) {
          const msg = typeof result.error === "string"
            ? result.error
            : result.error.message;
          throw new Error(msg);
        }
        return JSON.stringify(result.data);
      };

      toolRegistry.register({
        name: "git",
        description: "Execute git commands",
        parameters: {
          command: { type: "string", description: "Git command" },
        },
        handler: gitHandler,
      });

      // Create session and emit events through the EventStream
      const session = sessionManager.createSession({
        description: "Git integration test",
      });

      // Manually append tool_call and tool_result events so the bridge persists them.
      // session.created was already emitted by createSession (seq 1).
      eventStream.append({
        session_id: session.id,
        sequence_number: 2,
        event_type: EventTypes.TOOL_CALL_INVOCATION,
        payload: {
          tool_name: "git",
          tool_call_id: "tc-1",
          parameters: { command: "status" },
        },
        metadata: { source: "integration-test" },
      });

      const toolResult = await toolRegistry.invoke(
        {
          id: "tc-1",
          name: "git",
          arguments: { command: "status" },
        },
        { session_id: session.id },
      );

      assertEquals(toolResult.success, true);

      // Append tool_result event
      eventStream.append({
        session_id: session.id,
        sequence_number: 3,
        event_type: EventTypes.TOOL_CALL_RESULT,
        payload: {
          tool_name: "git",
          tool_call_id: "tc-1",
          exit_code: 0,
          stdout: toolResult.result as string,
          stderr: "",
          duration_ms: toolResult.duration_ms,
          success: true,
        },
        metadata: { source: "integration-test" },
      });

      // Verify events persisted through the backend
      const lines = backend.readLines(session.id);
      assertExists(lines);
      assertEquals(lines.length > 0, true, "Backend should have persisted event lines");

      // Parse persisted lines and verify they contain tool_call and tool_result
      const parsedEvents: BaseEvent[] = lines.map((line) => JSON.parse(line));
      const toolCallEvents = parsedEvents.filter(
        (e) => e.event_type === EventTypes.TOOL_CALL_INVOCATION,
      );
      const toolResultEvents = parsedEvents.filter(
        (e) => e.event_type === EventTypes.TOOL_CALL_RESULT,
      );

      assertEquals(toolCallEvents.length > 0, true, "Should have persisted tool_call event");
      assertEquals(toolResultEvents.length > 0, true, "Should have persisted tool_result event");

      // Verify the tool_result payload contains git output
      const gitOutput = JSON.parse(toolResultEvents[0].payload.stdout as string);
      assertExists(gitOutput.branch, "Git status should include branch name");
    } finally {
      await removeDir(projectDir);
      await removeDir(dbDir);
    }
  });

  // ========================================================================
  // 8.3 — Analysis report
  // ========================================================================

  await t.step("8.3 — analysis report", async () => {
    const dbDir = await makeTempDir("analysis-test-db-");

    try {
      // Create a SQLite backend and write known fixture event lines
      const dbPath = tempDbPath(dbDir);
      const backend = new SQLitePersistenceBackend({ dbPath });

      const sessionId = "session-analysis-001";
      const sessionId2 = "session-analysis-002";

      // Session 1: active session with tool events
      const s1Events: BaseEvent[] = [
        {
          event_id: uuidv4(),
          session_id: sessionId,
          sequence_number: 1,
          timestamp: new Date(Date.now() - 60000).toISOString(),
          event_type: EventTypes.SESSION_CREATED,
          schema_version: CURRENT_SCHEMA_VERSION,
          payload: { initial_state: "active", description: "test session 1" },
          metadata: { source: "test" },
        },
        {
          event_id: uuidv4(),
          session_id: sessionId,
          sequence_number: 2,
          timestamp: new Date(Date.now() - 55000).toISOString(),
          event_type: EventTypes.TOOL_EXECUTION_STARTED,
          schema_version: CURRENT_SCHEMA_VERSION,
          payload: { tool_name: "shell", command: "deno check", parameters: {} },
          metadata: { source: "test" },
        },
        {
          event_id: uuidv4(),
          session_id: sessionId,
          sequence_number: 3,
          timestamp: new Date(Date.now() - 50000).toISOString(),
          event_type: EventTypes.TOOL_EXECUTION_COMPLETED,
          schema_version: CURRENT_SCHEMA_VERSION,
          payload: {
            tool_name: "shell",
            command: "deno check",
            parameters: {},
            duration_ms: 5000,
          },
          metadata: { source: "test" },
        },
        {
          event_id: uuidv4(),
          session_id: sessionId,
          sequence_number: 4,
          timestamp: new Date(Date.now() - 40000).toISOString(),
          event_type: EventTypes.TOOL_EXECUTION_STARTED,
          schema_version: CURRENT_SCHEMA_VERSION,
          payload: { tool_name: "git", command: "git status", parameters: {} },
          metadata: { source: "test" },
        },
        {
          event_id: uuidv4(),
          session_id: sessionId,
          sequence_number: 5,
          timestamp: new Date(Date.now() - 39000).toISOString(),
          event_type: EventTypes.TOOL_EXECUTION_COMPLETED,
          schema_version: CURRENT_SCHEMA_VERSION,
          payload: {
            tool_name: "git",
            command: "git status",
            parameters: {},
            duration_ms: 1000,
          },
          metadata: { source: "test" },
        },
        {
          event_id: uuidv4(),
          session_id: sessionId,
          sequence_number: 6,
          timestamp: new Date(Date.now() - 30000).toISOString(),
          event_type: EventTypes.SESSION_COMPLETED,
          schema_version: CURRENT_SCHEMA_VERSION,
          payload: { final_state: "completed" },
          metadata: { source: "test" },
        },
      ];

      // Session 2: a shorter session
      const s2Events: BaseEvent[] = [
        {
          event_id: uuidv4(),
          session_id: sessionId2,
          sequence_number: 1,
          timestamp: new Date(Date.now() - 25000).toISOString(),
          event_type: EventTypes.SESSION_CREATED,
          schema_version: CURRENT_SCHEMA_VERSION,
          payload: { initial_state: "active", description: "test session 2" },
          metadata: { source: "test" },
        },
        {
          event_id: uuidv4(),
          session_id: sessionId2,
          sequence_number: 2,
          timestamp: new Date(Date.now() - 20000).toISOString(),
          event_type: EventTypes.TOOL_EXECUTION_STARTED,
          schema_version: CURRENT_SCHEMA_VERSION,
          payload: { tool_name: "file", command: "file read", parameters: {} },
          metadata: { source: "test" },
        },
        {
          event_id: uuidv4(),
          session_id: sessionId2,
          sequence_number: 3,
          timestamp: new Date(Date.now() - 19000).toISOString(),
          event_type: EventTypes.TOOL_EXECUTION_COMPLETED,
          schema_version: CURRENT_SCHEMA_VERSION,
          payload: {
            tool_name: "file",
            command: "file read",
            parameters: {},
            duration_ms: 100,
          },
          metadata: { source: "test" },
        },
        {
          event_id: uuidv4(),
          session_id: sessionId2,
          sequence_number: 4,
          timestamp: new Date(Date.now() - 10000).toISOString(),
          event_type: EventTypes.SESSION_COMPLETED,
          schema_version: CURRENT_SCHEMA_VERSION,
          payload: { final_state: "completed" },
          metadata: { source: "test" },
        },
      ];

      // Write fixture events to the SQLite backend
      for (const event of s1Events) {
        backend.write(sessionId, JSON.stringify(event));
      }
      for (const event of s2Events) {
        backend.write(sessionId2, JSON.stringify(event));
      }

      // Verify backend can read them back
      const s1Lines = backend.readLines(sessionId);
      const s2Lines = backend.readLines(sessionId2);
      assertEquals(s1Lines.length, s1Events.length, "Session 1 lines match");
      assertEquals(s2Lines.length, s2Events.length, "Session 2 lines match");

      // Build an in-memory EventStore populated with the same events
      const eventStore = new EventStore();
      for (const event of s1Events) {
        eventStore.store(event);
      }
      for (const event of s2Events) {
        eventStore.store(event);
      }

      // Run analysis
      const sessions = [
        { id: sessionId, state: "completed" },
        { id: sessionId2, state: "completed" },
      ];

      const result = await analyzeSessions(sessions, eventStore);

      // Verify result shape
      assertExists(result, "Analysis result should exist");
      assertEquals(result.sessions.length, 2, "Should have 2 session summaries");
      assertEquals(result.totalEvents > 0, true, "Should report total events");
      assertEquals(result.totalDurationMs >= 0, true, "Should report non-negative duration");

      // Verify suggestions (always non-empty — generateSuggestions adds a default)
      assertExists(result.suggestions, "Suggestions should exist");
      assertEquals(result.suggestions.length > 0, true, "Should have at least one suggestion");

      // Verify command stats — we injected tool.execution.started events with commands
      assertExists(result.commandStats, "Command stats should exist");
      assertEquals(result.commandStats.length > 0, true, "Should have command stats");

      // Verify the report format produces a non-empty string
      const report = formatAnalysisReport(result);
      assertEquals(typeof report, "string", "Report should be a string");
      assertEquals(report.length > 0, true, "Report should be non-empty");
      assertStringIncludes(report, "KAYAK SESSION ANALYSIS");
    } finally {
      await removeDir(dbDir);
    }
  });
});
