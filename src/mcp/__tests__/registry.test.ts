import { assertEquals } from "@std/assert";
import { MCPRegistry } from "../registry.ts";
import type { MCPToolRegistration } from "../types.ts";

function createTestRegistration(
  name: string,
  serverName: string = "test-server",
  enabled: boolean = true,
): MCPToolRegistration {
  return {
    tool: {
      name,
      description: `${name} description`,
      inputSchema: { type: "object" },
    },
    serverName,
    enabled,
    registeredAt: Date.now(),
    capabilities: [{ id: "test-cap", name: "Test Capability", description: "Test" }],
    category: { id: "test-cat", name: "Test Category" },
  };
}

Deno.test("MCPRegistry - registers and lists tools", () => {
  const registry = new MCPRegistry();
  const reg = createTestRegistration("tool1");

  registry.register(reg);
  const tools = registry.list();

  assertEquals(tools.length, 1);
  assertEquals(tools[0].tool.name, "tool1");
});

Deno.test("MCPRegistry - unregisters tools", () => {
  const registry = new MCPRegistry();
  registry.register(createTestRegistration("tool1"));
  registry.unregister("tool1", "test-server");

  assertEquals(registry.list().length, 0);
});

Deno.test("MCPRegistry - get returns tool by name", () => {
  const registry = new MCPRegistry();
  registry.register(createTestRegistration("tool1"));

  const tool = registry.get("tool1");
  assertEquals(tool?.tool.name, "tool1");
  assertEquals(registry.get("nonexistent"), undefined);
});

Deno.test("MCPRegistry - enable/disable tools", () => {
  const registry = new MCPRegistry();
  registry.register(createTestRegistration("tool1", "server1", false));

  // Disabled tool not in list
  assertEquals(registry.list().length, 0);

  registry.enable("tool1", "server1");
  assertEquals(registry.list().length, 1);

  registry.disable("tool1", "server1");
  assertEquals(registry.list().length, 0);
});

Deno.test("MCPRegistry - findByCapability filters tools", () => {
  const registry = new MCPRegistry();
  registry.register({
    ...createTestRegistration("tool1"),
    capabilities: [{ id: "cap1", name: "Cap 1", description: "" }],
  });
  registry.register({
    ...createTestRegistration("tool2"),
    capabilities: [{ id: "cap2", name: "Cap 2", description: "" }],
  });

  const results = registry.findByCapability("cap1");
  assertEquals(results.length, 1);
  assertEquals(results[0].tool.name, "tool1");
});

Deno.test("MCPRegistry - findByCategory filters tools", () => {
  const registry = new MCPRegistry();
  registry.register({
    ...createTestRegistration("tool1"),
    category: { id: "cat1", name: "Cat 1" },
  });
  registry.register({
    ...createTestRegistration("tool2"),
    category: { id: "cat2", name: "Cat 2" },
  });

  const results = registry.findByCategory("cat1");
  assertEquals(results.length, 1);
  assertEquals(results[0].tool.name, "tool1");
});

Deno.test("MCPRegistry - emits events on register/unregister", () => {
  const registry = new MCPRegistry();
  const events: string[] = [];

  registry.on("toolRegistered", (name: string) => events.push(`registered:${name}`));
  registry.on("toolUnregistered", (name: string) => events.push(`unregistered:${name}`));

  registry.register(createTestRegistration("tool1"));
  registry.unregister("tool1", "test-server");

  assertEquals(events.length, 2);
  assertEquals(events[0], "registered:tool1");
  assertEquals(events[1], "unregistered:tool1");
});

Deno.test("MCPRegistry - emits event on state change", () => {
  const registry = new MCPRegistry();
  const events: Array<{ name: string; old: boolean; new_: boolean }> = [];

  registry.on("toolStateChanged", (name: string, oldState: boolean, newState: boolean) => {
    events.push({ name, old: oldState, new_: newState });
  });

  registry.register(createTestRegistration("tool1"));
  registry.disable("tool1", "test-server");
  registry.enable("tool1", "test-server");

  assertEquals(events.length, 2);
  assertEquals(events[0].old, true);
  assertEquals(events[0].new_, false);
  assertEquals(events[1].old, false);
  assertEquals(events[1].new_, true);
});

Deno.test("MCPRegistry - handles multiple tools from same server", () => {
  const registry = new MCPRegistry();
  registry.register(createTestRegistration("tool1", "server1"));
  registry.register(createTestRegistration("tool2", "server1"));
  registry.register(createTestRegistration("tool3", "server2"));

  assertEquals(registry.list().length, 3);
  registry.unregister("tool1", "server1");
  assertEquals(registry.list().length, 2);
});
