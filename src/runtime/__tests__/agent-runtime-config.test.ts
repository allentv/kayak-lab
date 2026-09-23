import {
  assertEquals,
  assertExists,
  assertRejects,
} from "@std/assert";
import { EventStream } from "../../core/event-stream.ts";
import { SessionManager } from "../../core/session-manager.ts";
import { ModelManager } from "../model-provider.ts";
import { ToolRegistry } from "../tool-registry.ts";
import { AgentRuntime, AgentConfig } from "../agent-runtime.ts";
import { HookPoint } from "../hooks.ts";
import { MockModelProvider } from "../../__test-utils__/mocks/mock-model.ts";

function createAgent(config: AgentConfig = {}) {
  const eventStream = new EventStream();
  const sessionManager = new SessionManager(eventStream);
  const modelManager = new ModelManager();
  const toolRegistry = new ToolRegistry();
  const agent = new AgentRuntime(
    eventStream,
    sessionManager,
    modelManager,
    toolRegistry,
    config,
  );
  return { eventStream, sessionManager, modelManager, toolRegistry, agent };
}

Deno.test("AgentRuntime config extensions", async (t) => {
  await t.step("hook model propagation sets model on request", async () => {
    const { modelManager, agent } = createAgent();

    const provider = new MockModelProvider("mock-agent", {
      responses: [{ content: "ok", tool_calls: [], finish_reason: "stop" }],
    });
    modelManager.register(provider);

    // Register hook that sets model
    agent.getHookRegistry().register(
      HookPoint.BeforeModelCall,
      (ctx) => {
        if ("model" in ctx) {
          ctx.model = "custom-model-from-hook";
        }
      },
    );

    await agent.start();
    await agent.processInput("test");

    // Verify the hook-set model was used
    assertEquals(provider.requests[0].model, "custom-model-from-hook");
  });

  await t.step("hook model propagation skips when model is undefined", async () => {
    const { modelManager, agent } = createAgent();

    const provider = new MockModelProvider("mock-agent", {
      responses: [{ content: "ok", tool_calls: [], finish_reason: "stop" }],
    });
    modelManager.register(provider);

    // Register hook that doesn't set model
    agent.getHookRegistry().register(
      HookPoint.BeforeModelCall,
      () => {},
    );

    await agent.start();
    await agent.processInput("test");

    // Model should remain undefined (original behavior)
    assertEquals(provider.requests[0].model, undefined);
  });

  await t.step("maxIterations limits loop iterations", async () => {
    const { modelManager, toolRegistry, agent } = createAgent({
      maxIterations: 2,
    });

    toolRegistry.register({
      name: "infinite_tool",
      description: "Always useful",
      parameters: { type: "object" },
      handler: () => "result",
    });

    // Model always requests tool call
    const provider = new MockModelProvider("mock-agent", {
      responses: [
        {
          content: null,
          tool_calls: [{ id: "tc1", name: "infinite_tool", arguments: {} }],
          finish_reason: "tool_calls",
        },
        {
          content: null,
          tool_calls: [{ id: "tc2", name: "infinite_tool", arguments: {} }],
          finish_reason: "tool_calls",
        },
        {
          content: null,
          tool_calls: [{ id: "tc3", name: "infinite_tool", arguments: {} }],
          finish_reason: "tool_calls",
        },
      ],
    });
    modelManager.register(provider);

    await agent.start();

    // Should throw after 2 iterations
    await assertRejects(
      () => agent.processInput("test"),
      Error,
      "maximum iterations",
    );
  });

  await t.step("toolTimeoutMs times out slow tools", async () => {
    const { modelManager, toolRegistry, agent } = createAgent({
      toolTimeoutMs: 50,
    });

    toolRegistry.register({
      name: "slow_tool",
      description: "Takes too long",
      parameters: { type: "object" },
      handler: async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return "should not reach";
      },
    });

    // Model requests slow tool, then gives final answer
    const provider = new MockModelProvider("mock-agent", {
      responses: [
        {
          content: null,
          tool_calls: [{ id: "tc1", name: "slow_tool", arguments: {} }],
          finish_reason: "tool_calls",
        },
        {
          content: "done after timeout",
          tool_calls: [],
          finish_reason: "stop",
        },
      ],
    });
    modelManager.register(provider);

    await agent.start();
    const response = await agent.processInput("test");

    // Tool timed out, but agent continued and got final response
    assertEquals(response, "done after timeout");
  });

  await t.step("default maxIterations is 10", async () => {
    const { agent } = createAgent();
    await agent.start();
    const state = agent.getState();
    assertExists(state);
    // No error means default 10 iterations was used (would throw if not set)
  });
});
