import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { createTransport, StdioTransport, HttpTransport, WebSocketTransport } from "../transport.ts";
import { MCPError } from "../types.ts";

Deno.test("createTransport - throws on missing command for stdio", () => {
  assertThrows(
    () => createTransport({ type: "stdio" }),
    MCPError,
    "stdio transport requires a command",
  );
});

Deno.test("createTransport - throws on missing URL for http", () => {
  assertThrows(
    () => createTransport({ type: "http" }),
    MCPError,
    "http transport requires a URL",
  );
});

Deno.test("createTransport - throws on missing URL for websocket", () => {
  assertThrows(
    () => createTransport({ type: "websocket" }),
    MCPError,
    "websocket transport requires a URL",
  );
});

Deno.test("createTransport - throws on unknown type", () => {
  assertThrows(
    () => createTransport({ type: "unknown" as "stdio" }),
    MCPError,
    "Unknown transport type",
  );
});

Deno.test("createTransport - creates StdioTransport", () => {
  const transport = createTransport({ type: "stdio", command: "echo", args: ["hello"] });
  assertEquals(transport instanceof StdioTransport, true);
  assertEquals(transport.state, "disconnected");
});

Deno.test("createTransport - creates HttpTransport", () => {
  const transport = createTransport({ type: "http", url: "http://localhost:3000" });
  assertEquals(transport instanceof HttpTransport, true);
  assertEquals(transport.state, "disconnected");
});

Deno.test("createTransport - creates WebSocketTransport", () => {
  const transport = createTransport({ type: "websocket", url: "ws://localhost:3000" });
  assertEquals(transport instanceof WebSocketTransport, true);
  assertEquals(transport.state, "disconnected");
});

Deno.test("StdioTransport - starts disconnected", () => {
  const transport = new StdioTransport("echo", ["hello"]);
  assertEquals(transport.state, "disconnected");
});

Deno.test("HttpTransport - starts disconnected", () => {
  const transport = new HttpTransport("http://localhost:3000");
  assertEquals(transport.state, "disconnected");
});

Deno.test("WebSocketTransport - starts disconnected", () => {
  const transport = new WebSocketTransport("ws://localhost:3000");
  assertEquals(transport.state, "disconnected");
});

Deno.test("StdioTransport - send throws when disconnected", async () => {
  const transport = new StdioTransport("echo", ["hello"]);
  await assertRejects(
    () => transport.send({
      jsonrpc: "2.0",
      id: 1,
      method: "test",
    }),
    MCPError,
    "Transport not connected",
  );
});

Deno.test("HttpTransport - send throws when disconnected", async () => {
  const transport = new HttpTransport("http://localhost:3000");
  await assertRejects(
    () => transport.send({
      jsonrpc: "2.0",
      id: 1,
      method: "test",
    }),
    MCPError,
    "Transport not connected",
  );
});

Deno.test("WebSocketTransport - send throws when disconnected", async () => {
  const transport = new WebSocketTransport("ws://localhost:3000");
  await assertRejects(
    () => transport.send({
      jsonrpc: "2.0",
      id: 1,
      method: "test",
    }),
    MCPError,
    "Transport not connected",
  );
});
