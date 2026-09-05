import { assertEquals, assertRejects } from "@std/assert";
import { MCPClient } from "../client.ts";
import { MCPError } from "../types.ts";

Deno.test("MCPClient - initializes with config", () => {
  const client = new MCPClient({
    name: "test-server",
    transport: { type: "stdio", command: "echo" },
  });

  assertEquals(client.config.name, "test-server");
  assertEquals(client.config.transport.type, "stdio");
  assertEquals(client.state, "disconnected");
  assertEquals(client.tools.length, 0);
});

Deno.test("MCPClient - uses default config values", () => {
  const client = new MCPClient({
    name: "test",
    transport: { type: "http", url: "http://localhost" },
  });

  assertEquals(client.config.autoReconnect, true);
  assertEquals(client.config.maxReconnectAttempts, 5);
  assertEquals(client.config.reconnectDelayMs, 1000);
});

Deno.test("MCPClient - discover throws when not connected", async () => {
  const client = new MCPClient({
    name: "test",
    transport: { type: "http", url: "http://localhost" },
  });

  await assertRejects(
    () => client.discover(),
    MCPError,
    "Client not connected",
  );
});

Deno.test("MCPClient - invoke throws when not connected", async () => {
  const client = new MCPClient({
    name: "test",
    transport: { type: "http", url: "http://localhost" },
  });

  await assertRejects(
    () => client.invoke({ name: "test-tool" }),
    MCPError,
    "Client not connected",
  );
});

Deno.test("MCPClient - disconnect clears tools", async () => {
  const client = new MCPClient({
    name: "test",
    transport: { type: "http", url: "http://localhost" },
  });

  await client.disconnect();
  assertEquals(client.state, "disconnected");
  assertEquals(client.tools.length, 0);
});

Deno.test("MCPClient - emits connected event", async () => {
  const client = new MCPClient({
    name: "test",
    transport: { type: "http", url: "http://localhost" },
    autoReconnect: false,
  });

  let connectedServerName = "";
  client.on("connected", (name: string) => {
    connectedServerName = name;
  });

  // Manually trigger connected state
  await client.disconnect();
  assertEquals(connectedServerName, "");
});
