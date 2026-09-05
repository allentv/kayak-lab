import { assertEquals } from "@std/assert";
import { MCPClient } from "../client.ts";
import { MCPServer } from "../server.ts";
import { MCPRegistry } from "../registry.ts";
import { MCPSearch } from "../search.ts";
import { wireClientEvents, wireServerEvents, wireRegistryEvents, wireSearchEvents } from "../event-emitter.ts";
import { EventTypes } from "../../types/events.ts";
import type { AppendEventInput } from "../../types/events.ts";
import type { IToolDefinition } from "../../tools/types.ts";

function createMockAppendEvent(): { events: AppendEventInput[]; fn: (event: AppendEventInput) => Promise<void> } {
  const events: AppendEventInput[] = [];
  return {
    events,
    fn: async (event: AppendEventInput) => {
      events.push(event);
    },
  };
}

function createMockToolExposure(tools: IToolDefinition[] = []) {
  return {
    getExposableTools: () => tools.filter((t) => t.exposable),
    getTool: (name: string) => tools.find((t) => t.name === name),
    invokeTool: async (name: string) => ({ success: true, output: `Executed ${name}` }),
  };
}

Deno.test("wireClientEvents - emits connected event", async () => {
  const { events, fn } = createMockAppendEvent();
  const client = new MCPClient({
    name: "test-server",
    transport: { type: "stdio", command: "echo" },
    autoReconnect: false,
  });

  wireClientEvents(client, fn);

  // Manually trigger connected state by emitting the event
  client.emit("connected", "test-server");

  assertEquals(events.length, 1);
  assertEquals(events[0].event_type, EventTypes.MCP_CONNECTED);
});

Deno.test("wireClientEvents - emits disconnected event", async () => {
  const { events, fn } = createMockAppendEvent();
  const client = new MCPClient({
    name: "test-server",
    transport: { type: "stdio", command: "echo" },
    autoReconnect: false,
  });

  wireClientEvents(client, fn);
  client.emit("disconnected", "test-server");

  assertEquals(events.length, 1);
  assertEquals(events[0].event_type, EventTypes.MCP_DISCONNECTED);
});

Deno.test("wireClientEvents - emits toolsDiscovered event", async () => {
  const { events, fn } = createMockAppendEvent();
  const client = new MCPClient({
    name: "test-server",
    transport: { type: "stdio", command: "echo" },
    autoReconnect: false,
  });

  wireClientEvents(client, fn);
  client.emit("toolsDiscovered", "test-server", [{ name: "tool1", description: "Test", inputSchema: { type: "object" } }]);

  assertEquals(events.length, 1);
  assertEquals(events[0].event_type, EventTypes.MCP_TOOLS_DISCOVERED);
});

Deno.test("wireServerEvents - emits started event", async () => {
  const { events, fn } = createMockAppendEvent();
  const server = new MCPServer({
    transport: { type: "stdio", command: "echo" },
    toolRegistry: createMockToolExposure(),
  });

  wireServerEvents(server, fn);
  server.emit("started", "stdio");

  assertEquals(events.length, 1);
  assertEquals(events[0].event_type, EventTypes.MCP_SERVER_STARTED);
});

Deno.test("wireServerEvents - emits stopped event", async () => {
  const { events, fn } = createMockAppendEvent();
  const server = new MCPServer({
    transport: { type: "stdio", command: "echo" },
    toolRegistry: createMockToolExposure(),
  });

  wireServerEvents(server, fn);
  server.emit("stopped");

  assertEquals(events.length, 1);
  assertEquals(events[0].event_type, EventTypes.MCP_SERVER_STOPPED);
});

Deno.test("wireRegistryEvents - emits toolRegistered event", async () => {
  const { events, fn } = createMockAppendEvent();
  const registry = new MCPRegistry();

  wireRegistryEvents(registry, fn);
  registry.register({
    tool: { name: "tool1", description: "Test", inputSchema: { type: "object" } },
    serverName: "server1",
    enabled: true,
    registeredAt: Date.now(),
    capabilities: [],
  });

  assertEquals(events.length, 1);
  assertEquals(events[0].event_type, EventTypes.MCP_TOOL_REGISTERED);
});

Deno.test("wireSearchEvents - emits search event", async () => {
  const { events, fn } = createMockAppendEvent();
  const registry = new MCPRegistry();
  const clients = new Map();
  const search = new MCPSearch(registry, clients);

  wireSearchEvents(search, fn);
  search.search({ name: "test" });

  // search and searchResult events
  assertEquals(events.length, 2);
  assertEquals(events[0].event_type, EventTypes.MCP_SEARCH);
  assertEquals(events[1].event_type, EventTypes.MCP_SEARCH_RESULT);
});
