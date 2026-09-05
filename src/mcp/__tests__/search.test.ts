import { assertEquals } from "@std/assert";
import { MCPSearch } from "../search.ts";
import { MCPRegistry } from "../registry.ts";
import type { MCPToolRegistration, IMCPClient, MCPClientState } from "../types.ts";

function createMockClient(state: MCPClientState = "connected"): IMCPClient {
  return {
    config: { name: "test", transport: { type: "http", url: "http://localhost" } },
    state,
    connect: async () => {},
    disconnect: async () => {},
    discover: async () => [],
    invoke: async () => ({ content: [] }),
    on: () => {},
    off: () => {},
  };
}

function createTestRegistration(
  name: string,
  serverName: string,
  capabilities: Array<{ id: string; name: string; description: string }> = [],
  category?: { id: string; name: string },
): MCPToolRegistration {
  return {
    tool: {
      name,
      description: `${name} description`,
      inputSchema: { type: "object" },
    },
    serverName,
    enabled: true,
    registeredAt: Date.now(),
    capabilities,
    category,
  };
}

Deno.test("MCPSearch - search by name", () => {
  const registry = new MCPRegistry();
  registry.register(createTestRegistration("read-file", "server1"));
  registry.register(createTestRegistration("write-file", "server1"));

  const clients = new Map([["server1", createMockClient()]]);
  const search = new MCPSearch(registry, clients);

  const result = search.search({ name: "read" });

  assertEquals(result.count, 1);
  assertEquals(result.items[0].tool.name, "read-file");
});

Deno.test("MCPSearch - search by capability", () => {
  const registry = new MCPRegistry();
  registry.register(createTestRegistration("tool1", "server1", [
    { id: "file-read", name: "File Read", description: "" },
  ]));
  registry.register(createTestRegistration("tool2", "server1", [
    { id: "shell-exec", name: "Shell Exec", description: "" },
  ]));

  const clients = new Map([["server1", createMockClient()]]);
  const search = new MCPSearch(registry, clients);

  const result = search.search({ capability: "file-read" });

  assertEquals(result.count, 1);
  assertEquals(result.items[0].tool.name, "tool1");
});

Deno.test("MCPSearch - search by category", () => {
  const registry = new MCPRegistry();
  registry.register(createTestRegistration("tool1", "server1", [], { id: "files", name: "Files" }));
  registry.register(createTestRegistration("tool2", "server1", [], { id: "shell", name: "Shell" }));

  const clients = new Map([["server1", createMockClient()]]);
  const search = new MCPSearch(registry, clients);

  const result = search.search({ category: "files" });

  assertEquals(result.count, 1);
  assertEquals(result.items[0].tool.name, "tool1");
});

Deno.test("MCPSearch - search results include server status", () => {
  const registry = new MCPRegistry();
  registry.register(createTestRegistration("tool1", "server1"));

  const clients = new Map([["server1", createMockClient("connected")]]);
  const search = new MCPSearch(registry, clients);

  const result = search.search({});

  assertEquals(result.serverStatus["server1"].status, "connected");
  assertEquals(result.serverStatus["server1"].toolCount, 1);
});

Deno.test("MCPSearch - search with no results", () => {
  const registry = new MCPRegistry();
  const clients = new Map<string, IMCPClient>();
  const search = new MCPSearch(registry, clients);

  const result = search.search({ name: "nonexistent" });

  assertEquals(result.count, 0);
  assertEquals(result.items.length, 0);
});

Deno.test("MCPSearch - emits search events", () => {
  const registry = new MCPRegistry();
  const clients = new Map<string, IMCPClient>();
  const search = new MCPSearch(registry, clients);

  const events: Array<{ query: { name?: string }; count: number }> = [];
  search.on("search", (query: { name?: string }) => {
    events.push({ query, count: 0 });
  });
  search.on("searchResult", (query: { name?: string }, count: number) => {
    events.push({ query, count });
  });

  search.search({ name: "test" });

  assertEquals(events.length, 2);
  assertEquals(events[0].query.name, "test");
  assertEquals(events[1].count, 0);
});
