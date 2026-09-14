/**
 * Tests for AgentRuntime L3 Core Memory integration.
 */

import { assertEquals, assertExists } from "@std/assert";
import { AgentRuntime, AgentConfig } from "../agent-runtime.ts";
import { EventStream } from "../../core/event-stream.ts";
import { SessionManager } from "../../core/session-manager.ts";
import { ModelManager } from "../model-provider.ts";
import { ToolRegistry } from "../tool-registry.ts";
import { HookRegistry } from "../hooks.ts";
import { MemoryProvider } from "../../memory/provider.ts";
import { SQLitePersistenceBackend } from "../../store/sqlite-backend.ts";

// ============================================================================
// Test Helpers
// ============================================================================

function createMockModelManager(): ModelManager {
  const manager = new ModelManager();
  manager.register({
    name: "test",
    invoke: async () => ({
      content: "Hello!",
      tool_calls: [],
      finish_reason: "stop",
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    }),
    stream: async function* () {
      yield { type: "content", content: "Hello!" };
    },
  });
  manager.setDefaultProvider("test");
  return manager;
}

function createMemoryProvider(): { provider: MemoryProvider; backend: SQLitePersistenceBackend } {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });
  const provider = new MemoryProvider(
    { provider: "custom", settings: {} },
    backend,
  );
  return { provider, backend };
}

// ============================================================================
// L3 Core Memory Tests
// ============================================================================

Deno.test("AgentRuntime - start loads core memory and injects into system prompt", async () => {
  const eventStream = new EventStream();
  const sessionManager = new SessionManager(eventStream);
  const modelManager = createMockModelManager();
  const toolRegistry = new ToolRegistry();
  const hookRegistry = new HookRegistry();
  const { provider, backend } = createMemoryProvider();

  // Write core memory for the agent
  await provider.writeCore("test-agent", {
    name: "Kayak",
    goals: "Assist users with code tasks",
    constraints: "Never fabricate information",
  });

  const config: AgentConfig = {
    agentId: "test-agent",
  };

  const runtime = new AgentRuntime(
    eventStream,
    sessionManager,
    modelManager,
    toolRegistry,
    config,
    {},
    undefined,
    undefined,
    { provider },
    undefined,
    hookRegistry,
  );

  const sessionId = await runtime.start();
  assertExists(sessionId);

  // Process input to trigger buildModelRequest
  const response = await runtime.processInput("Hello");
  assertEquals(response, "Hello!");

  await runtime.stop();
  backend.close();
});

Deno.test("AgentRuntime - start works without memory provider (no core)", async () => {
  const eventStream = new EventStream();
  const sessionManager = new SessionManager(eventStream);
  const modelManager = createMockModelManager();
  const toolRegistry = new ToolRegistry();
  const hookRegistry = new HookRegistry();

  const config: AgentConfig = {
    agentId: "test-agent",
    // No memory provider
  };

  const runtime = new AgentRuntime(
    eventStream,
    sessionManager,
    modelManager,
    toolRegistry,
    config,
    {},
    undefined,
    undefined,
    {}, // Empty memory components
    undefined,
    hookRegistry,
  );

  const sessionId = await runtime.start();
  assertExists(sessionId);

  // Should work without core memory
  const response = await runtime.processInput("Hello");
  assertEquals(response, "Hello!");

  await runtime.stop();
});

Deno.test("AgentRuntime - start works without agentId (no core lookup)", async () => {
  const eventStream = new EventStream();
  const sessionManager = new SessionManager(eventStream);
  const modelManager = createMockModelManager();
  const toolRegistry = new ToolRegistry();
  const hookRegistry = new HookRegistry();
  const { provider, backend } = createMemoryProvider();

  // Write core memory but don't set agentId in config
  await provider.writeCore("test-agent", {
    name: "Kayak",
  });

  const config: AgentConfig = {
    // No agentId
  };

  const runtime = new AgentRuntime(
    eventStream,
    sessionManager,
    modelManager,
    toolRegistry,
    config,
    {},
    undefined,
    undefined,
    { provider },
    undefined,
    hookRegistry,
  );

  const sessionId = await runtime.start();
  assertExists(sessionId);

  // Should work without loading core memory
  const response = await runtime.processInput("Hello");
  assertEquals(response, "Hello!");

  await runtime.stop();
  backend.close();
});

Deno.test("AgentRuntime - core memory sections formatted correctly", async () => {
  const eventStream = new EventStream();
  const sessionManager = new SessionManager(eventStream);
  const modelManager = createMockModelManager();
  const toolRegistry = new ToolRegistry();
  const hookRegistry = new HookRegistry();
  const { provider, backend } = createMemoryProvider();

  // Write core memory with specific sections
  await provider.writeCore("test-agent", {
    name: "Kayak",
    goals: "Build great software",
  });

  const config: AgentConfig = {
    agentId: "test-agent",
  };

  // Capture model requests to verify core memory injection
  const capturedRequests: { messages: { role: string; content: string }[] }[] = [];

  const runtime = new AgentRuntime(
    eventStream,
    sessionManager,
    modelManager,
    toolRegistry,
    config,
    {
      onModelRequest: (request) => {
        capturedRequests.push(request);
      },
    },
    undefined,
    undefined,
    { provider },
    undefined,
    hookRegistry,
  );

  await runtime.start();
  await runtime.processInput("Hello");

  // The core memory should be in the model request's system message
  assertEquals(capturedRequests.length > 0, true);
  const systemMessages = capturedRequests[0].messages.filter((m) => m.role === "system");
  assertEquals(systemMessages.length, 1);

  const systemContent = systemMessages[0].content;
  assertEquals(systemContent.includes("## Agent Identity"), true);
  assertEquals(systemContent.includes("- name: Kayak"), true);
  assertEquals(systemContent.includes("- goals: Build great software"), true);

  await runtime.stop();
  backend.close();
});
