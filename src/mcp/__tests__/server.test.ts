import { assertEquals } from "@std/assert";
import { MCPServer } from "../server.ts";
import type { MCPToolExposure } from "../types.ts";
import type { IToolDefinition } from "../../tools/types.ts";

function createMockToolExposure(tools: IToolDefinition[] = []): MCPToolExposure {
  return {
    getExposableTools: () => tools.filter((t) => t.exposable),
    getTool: (name: string) => tools.find((t) => t.name === name),
    invokeTool: async (name: string, _params: Record<string, unknown>) => {
      const tool = tools.find((t) => t.name === name);
      if (!tool) throw new Error(`Tool not found: ${name}`);
      return { success: true, output: `Executed ${name}` };
    },
  };
}

Deno.test("MCPServer - initializes in stopped state", () => {
  const server = new MCPServer({
    transport: { type: "stdio", command: "echo" },
    toolRegistry: createMockToolExposure(),
  });

  assertEquals(server.state, "stopped");
});

Deno.test("MCPServer - start sets state to running", async () => {
  const server = new MCPServer({
    transport: { type: "stdio", command: "echo" },
    toolRegistry: createMockToolExposure(),
  });

  await server.start();
  assertEquals(server.state, "running");
  await server.stop();
});

Deno.test("MCPServer - stop sets state to stopped", async () => {
  const server = new MCPServer({
    transport: { type: "stdio", command: "echo" },
    toolRegistry: createMockToolExposure(),
  });

  await server.start();
  await server.stop();
  assertEquals(server.state, "stopped");
});

Deno.test("MCPServer - listTools returns exposable tools", async () => {
  const tools: IToolDefinition[] = [
    { name: "tool1", description: "Tool 1", parameters: { type: "object" }, exposable: true },
    { name: "tool2", description: "Tool 2", parameters: { type: "object" }, exposable: false },
  ];

  const server = new MCPServer({
    transport: { type: "stdio", command: "echo" },
    toolRegistry: createMockToolExposure(tools),
  });

  await server.start();
  const exposed = server.listTools();

  assertEquals(exposed.length, 1);
  assertEquals(exposed[0].name, "tool1");

  await server.stop();
});

Deno.test("MCPServer - getTool returns tool by name", async () => {
  const tools: IToolDefinition[] = [
    { name: "tool1", description: "Tool 1", parameters: { type: "object" }, exposable: true },
  ];

  const server = new MCPServer({
    transport: { type: "stdio", command: "echo" },
    toolRegistry: createMockToolExposure(tools),
  });

  await server.start();
  const tool = server.getTool("tool1");

  assertEquals(tool?.name, "tool1");
  assertEquals(server.getTool("nonexistent"), undefined);

  await server.stop();
});

Deno.test("MCPServer - handleToolCall invokes exposed tool", async () => {
  const tools: IToolDefinition[] = [
    { name: "tool1", description: "Tool 1", parameters: { type: "object" }, exposable: true },
  ];

  const server = new MCPServer({
    transport: { type: "stdio", command: "echo" },
    toolRegistry: createMockToolExposure(tools),
  });

  await server.start();
  const result = await server.handleToolCall({ name: "tool1", arguments: { input: "test" } });

  assertEquals(result.isError, false);
  assertEquals(result.content[0].text, "Executed tool1");

  await server.stop();
});

Deno.test("MCPServer - handleToolCall returns error for non-exposed tool", async () => {
  const tools: IToolDefinition[] = [
    { name: "tool1", description: "Tool 1", parameters: { type: "object" }, exposable: false },
  ];

  const server = new MCPServer({
    transport: { type: "stdio", command: "echo" },
    toolRegistry: createMockToolExposure(tools),
  });

  await server.start();
  const result = await server.handleToolCall({ name: "tool1" });

  assertEquals(result.isError, true);
  assertEquals(result.content[0].text, "Tool not found: tool1");

  await server.stop();
});
