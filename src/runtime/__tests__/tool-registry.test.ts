import {
  assertEquals,
} from "@std/assert";
import {
  ToolRegistry,
} from "../tool-registry.ts";
import type { ToolCall } from "../model-provider.ts";

Deno.test("ToolRegistry", async (t) => {
  await t.step("registers a tool", () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "test-tool",
      description: "A test tool",
      parameters: { type: "object" },
      handler: () => "result",
    });

    assertEquals(registry.has("test-tool"), true);
  });

  await t.step("unregisters a tool", () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "test-tool",
      description: "A test tool",
      parameters: { type: "object" },
      handler: () => "result",
    });

    assertEquals(registry.has("test-tool"), true);
    registry.unregister("test-tool");
    assertEquals(registry.has("test-tool"), false);
  });

  await t.step("gets tool definition", () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "test-tool",
      description: "A test tool",
      parameters: { type: "object", properties: { foo: { type: "string" } } },
      handler: () => "result",
    });

    const def = registry.getDefinition("test-tool");
    assertEquals(def !== undefined, true);
    assertEquals(def!.name, "test-tool");
    assertEquals(def!.description, "A test tool");
  });

  await t.step("gets all definitions", () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "tool1",
      description: "Tool 1",
      parameters: {},
      handler: () => "result",
    });
    registry.register({
      name: "tool2",
      description: "Tool 2",
      parameters: {},
      handler: () => "result",
    });

    const defs = registry.getDefinitions();
    assertEquals(defs.length, 2);
  });

  await t.step("invokes a tool successfully", async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "echo",
      description: "Echoes input",
      parameters: { type: "object" },
      handler: (params: unknown) => {
        const p = params as { message: string };
        return { echoed: p.message };
      },
    });

    const toolCall: ToolCall = {
      id: "call-1",
      name: "echo",
      arguments: { message: "Hello" },
    };

    const result = await registry.invoke(toolCall, {
      session_id: "session-1",
    });

    assertEquals(result.success, true);
    assertEquals(result.result, { echoed: "Hello" });
    assertEquals(result.tool_call_id, "call-1");
    assertEquals(typeof result.duration_ms, "number");
  });

  await t.step("handles tool not found", async () => {
    const registry = new ToolRegistry();
    const toolCall: ToolCall = {
      id: "call-1",
      name: "nonexistent",
      arguments: {},
    };

    const result = await registry.invoke(toolCall, {
      session_id: "session-1",
    });

    assertEquals(result.success, false);
    assertEquals(result.error?.includes("Tool not found"), true);
  });

  await t.step("handles tool failure", async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "failing",
      description: "Failing tool",
      parameters: {},
      handler: () => {
        throw new Error("Tool failed");
      },
    });

    const toolCall: ToolCall = {
      id: "call-1",
      name: "failing",
      arguments: {},
    };

    const result = await registry.invoke(toolCall, {
      session_id: "session-1",
    });

    assertEquals(result.success, false);
    assertEquals(result.error, "Tool failed");
  });

  await t.step("handles async tool", async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "async-tool",
      description: "Async tool",
      parameters: {},
      handler: async () => {
        await new Promise((r) => setTimeout(r, 10));
        return "async result";
      },
    });

    const toolCall: ToolCall = {
      id: "call-1",
      name: "async-tool",
      arguments: {},
    };

    const result = await registry.invoke(toolCall, {
      session_id: "session-1",
    });

    assertEquals(result.success, true);
    assertEquals(result.result, "async result");
  });

  await t.step("handles tool timeout", async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "slow-tool",
      description: "Slow tool",
      parameters: {},
      timeout_ms: 50,
      handler: async () => {
        await new Promise((r) => setTimeout(r, 200));
        return "done";
      },
    });

    const toolCall: ToolCall = {
      id: "call-1",
      name: "slow-tool",
      arguments: {},
    };

    const result = await registry.invoke(toolCall, {
      session_id: "session-1",
    });

    assertEquals(result.success, false);
    assertEquals(result.error?.includes("timed out"), true);
  });

  await t.step("passes context to handler", async () => {
    const registry = new ToolRegistry();
    let receivedContext: unknown = null;

    registry.register({
      name: "context-tool",
      description: "Context tool",
      parameters: {},
      handler: (_params: unknown, context) => {
        receivedContext = context;
        return "ok";
      },
    });

    const toolCall: ToolCall = {
      id: "call-1",
      name: "context-tool",
      arguments: {},
    };

    await registry.invoke(toolCall, {
      session_id: "session-1",
    });

    assertEquals(receivedContext !== null, true);
    assertEquals((receivedContext as { session_id: string }).session_id, "session-1");
  });
});
