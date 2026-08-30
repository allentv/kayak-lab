import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { EventStream } from "../../core/event-stream.ts";
import { SessionManager } from "../../core/session-manager.ts";
import { ModelManager } from "../model-provider.ts";
import { ToolRegistry } from "../tool-registry.ts";
import { AgentRuntime } from "../agent-runtime.ts";
import type { IModelProvider, ModelResponse, StreamDelta } from "../model-provider.ts";

/** Mock model provider for agent runtime tests. */
class MockAgentProvider implements IModelProvider {
  name = "mock-agent";
  private responses: ModelResponse[];
  private responseIndex = 0;

  constructor(responses: ModelResponse[]) {
    this.responses = responses;
  }

  async invoke(): Promise<ModelResponse> {
    const response = this.responses[this.responseIndex % this.responses.length];
    this.responseIndex++;
    return response;
  }

  async *stream(): AsyncIterable<StreamDelta> {
    const response = this.responses[this.responseIndex % this.responses.length];
    this.responseIndex++;

    if (response.content) {
      const words = response.content.split(" ");
      for (const word of words) {
        yield { content: word + " " };
      }
    }

    if (response.tool_calls.length > 0) {
      yield {
        tool_calls: response.tool_calls,
        finish_reason: "tool_calls",
      };
    } else {
      yield { finish_reason: "stop" };
    }
  }
}

Deno.test("AgentRuntime", async (t) => {
  await t.step("starts a new session", async () => {
    const eventStream = new EventStream();
    const sessionManager = new SessionManager(eventStream);
    const modelManager = new ModelManager();
    const toolRegistry = new ToolRegistry();

    const agent = new AgentRuntime(
      eventStream,
      sessionManager,
      modelManager,
      toolRegistry,
    );

    const sessionId = await agent.start();
    assertExists(sessionId);

    const state = agent.getState();
    assertExists(state);
    assertEquals(state.session_id, sessionId);
    assertEquals(state.is_running, true);
  });

  await t.step("processes simple user input", async () => {
    const eventStream = new EventStream();
    const sessionManager = new SessionManager(eventStream);
    const modelManager = new ModelManager();
    const toolRegistry = new ToolRegistry();

    const provider = new MockAgentProvider([
      {
        content: "Hello! How can I help you?",
        tool_calls: [],
        finish_reason: "stop",
      },
    ]);
    modelManager.register(provider);

    const agent = new AgentRuntime(
      eventStream,
      sessionManager,
      modelManager,
      toolRegistry,
    );

    await agent.start();
    const response = await agent.processInput("Hi there!");

    assertEquals(response, "Hello! How can I help you?");
  });

  await t.step("executes tool calls", async () => {
    const eventStream = new EventStream();
    const sessionManager = new SessionManager(eventStream);
    const modelManager = new ModelManager();
    const toolRegistry = new ToolRegistry();

    // Register a calculator tool
    toolRegistry.register({
      name: "calculator",
      description: "Performs calculations",
      parameters: { type: "object" },
      handler: (params: unknown) => {
        // Simple calculator - just echo for testing
        return { result: `Calculated: ${(params as { expression: string }).expression}` };
      },
    });

    // First response asks for tool, second gives final answer
    const provider = new MockAgentProvider([
      {
        content: null,
        tool_calls: [
          {
            id: "call-1",
            name: "calculator",
            arguments: { expression: "2 + 2" },
          },
        ],
        finish_reason: "tool_calls",
      },
      {
        content: "The result is 4",
        tool_calls: [],
        finish_reason: "stop",
      },
    ]);
    modelManager.register(provider);

    const agent = new AgentRuntime(
      eventStream,
      sessionManager,
      modelManager,
      toolRegistry,
    );

    await agent.start();
    const response = await agent.processInput("What is 2 + 2?");

    assertEquals(response, "The result is 4");
  });

  await t.step("tracks context across interactions", async () => {
    const eventStream = new EventStream();
    const sessionManager = new SessionManager(eventStream);
    const modelManager = new ModelManager();
    const toolRegistry = new ToolRegistry();

    const provider = new MockAgentProvider([
      {
        content: "Response 1",
        tool_calls: [],
        finish_reason: "stop",
      },
      {
        content: "Response 2",
        tool_calls: [],
        finish_reason: "stop",
      },
    ]);
    modelManager.register(provider);

    const agent = new AgentRuntime(
      eventStream,
      sessionManager,
      modelManager,
      toolRegistry,
    );

    await agent.start();

    await agent.processInput("Message 1");
    const context1 = agent.getContext();
    assertEquals(context1.length, 2); // user + assistant

    await agent.processInput("Message 2");
    const context2 = agent.getContext();
    assertEquals(context2.length, 4); // user + assistant + user + assistant
  });

  await t.step("emits events during processing", async () => {
    const eventStream = new EventStream();
    const sessionManager = new SessionManager(eventStream);
    const modelManager = new ModelManager();
    const toolRegistry = new ToolRegistry();

    const events: string[] = [];

    const provider = new MockAgentProvider([
      {
        content: "Response",
        tool_calls: [],
        finish_reason: "stop",
      },
    ]);
    modelManager.register(provider);

    const agent = new AgentRuntime(
      eventStream,
      sessionManager,
      modelManager,
      toolRegistry,
      {},
      {
        onModelRequest: () => events.push("model-request"),
        onModelResponse: () => events.push("model-response"),
      },
    );

    await agent.start();
    await agent.processInput("Test");

    assertEquals(events.includes("model-request"), true);
    assertEquals(events.includes("model-response"), true);
  });

  await t.step("stops session", async () => {
    const eventStream = new EventStream();
    const sessionManager = new SessionManager(eventStream);
    const modelManager = new ModelManager();
    const toolRegistry = new ToolRegistry();

    const provider = new MockAgentProvider([
      {
        content: "Response",
        tool_calls: [],
        finish_reason: "stop",
      },
    ]);
    modelManager.register(provider);

    const agent = new AgentRuntime(
      eventStream,
      sessionManager,
      modelManager,
      toolRegistry,
    );

    await agent.start();
    await agent.processInput("Test");
    await agent.stop();

    const state = agent.getState();
    assertEquals(state, null);
  });

  await t.step("processes streaming input", async () => {
    const eventStream = new EventStream();
    const sessionManager = new SessionManager(eventStream);
    const modelManager = new ModelManager();
    const toolRegistry = new ToolRegistry();

    const provider = new MockAgentProvider([
      {
        content: "Hello World",
        tool_calls: [],
        finish_reason: "stop",
      },
    ]);
    modelManager.register(provider);

    const agent = new AgentRuntime(
      eventStream,
      sessionManager,
      modelManager,
      toolRegistry,
    );

    await agent.start();

    const chunks: string[] = [];
    for await (const chunk of agent.processInputStreaming("Hi")) {
      if (typeof chunk === "string") {
        chunks.push(chunk);
      }
    }

    assertEquals(chunks.length, 2);
    assertEquals(chunks.join(""), "Hello World ");
  });
});
