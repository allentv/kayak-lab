import { assertEquals, assertThrows } from "@std/assert";
import { ToolRegistry, ToolNotRegisteredError } from "../registry.ts";
import type { IToolDefinition, ToolHandler } from "../types.ts";

const echoDef: IToolDefinition = {
  name: "echo",
  description: "Echoes input",
  parameters: {
    type: "object",
    properties: { message: { type: "string" } },
    required: ["message"],
  },
  capabilities: [{ id: "file-read", name: "File Read", description: "Read files" }],
  category: { id: "utility", name: "Utility" },
};

const echoHandler: ToolHandler = async (params) => ({
  tool_call_id: "call-1",
  tool_name: "echo",
  exit_code: 0,
  stdout: params && typeof params === "object" && "message" in params
    ? String(params.message)
    : "",
  stderr: "",
  duration_ms: 0,
  success: true,
});

Deno.test("ToolRegistry", async (t) => {
  await t.step("registers a tool", () => {
    const reg = new ToolRegistry();
    reg.register(echoDef, echoHandler);
    assertEquals(reg.has("echo"), true);
  });

  await t.step("unregisters a tool", () => {
    const reg = new ToolRegistry();
    reg.register(echoDef, echoHandler);
    assertEquals(reg.has("echo"), true);
    reg.unregister("echo");
    assertEquals(reg.has("echo"), false);
  });

  await t.step("lists registered tools", () => {
    const reg = new ToolRegistry();
    reg.register(echoDef, echoHandler);
    reg.register({ ...echoDef, name: "other" }, echoHandler);
    assertEquals(reg.list().length, 2);
  });

  await t.step("gets tool by name", () => {
    const reg = new ToolRegistry();
    reg.register(echoDef, echoHandler);
    const tool = reg.get("echo");
    assertEquals(tool.name, "echo");
    assertEquals(tool.enabled, true);
  });

  await t.step("throws on missing tool", () => {
    const reg = new ToolRegistry();
    assertThrows(() => reg.get("missing"), ToolNotRegisteredError);
  });

  await t.step("enables and disables tools", () => {
    const reg = new ToolRegistry();
    reg.register(echoDef, echoHandler);
    reg.disable("echo");
    assertEquals(reg.isEnabled("echo"), false);
    reg.enable("echo");
    assertEquals(reg.isEnabled("echo"), true);
  });

  await t.step("emits events on state changes", () => {
    const events: string[] = [];
    const reg = new ToolRegistry({
      onToolRegistered: (name) => events.push(`registered:${name}`),
      onToolUnregistered: (name) => events.push(`unregistered:${name}`),
      onToolStateChanged: (name, _old, _new) => events.push(`state:${name}`),
    });

    reg.register(echoDef, echoHandler);
    reg.disable("echo");
    reg.enable("echo");
    reg.unregister("echo");

    assertEquals(events, [
      "registered:echo",
      "state:echo",
      "state:echo",
      "unregistered:echo",
    ]);
  });

  await t.step("finds tools by capability", () => {
    const reg = new ToolRegistry();
    reg.register(echoDef, echoHandler);
    const found = reg.findByCapability("file-read");
    assertEquals(found.length, 1);
    assertEquals(found[0].name, "echo");
  });

  await t.step("finds tools by category", () => {
    const reg = new ToolRegistry();
    reg.register(echoDef, echoHandler);
    const found = reg.findByCategory("utility");
    assertEquals(found.length, 1);
  });

  await t.step("excludes disabled tools from search", () => {
    const reg = new ToolRegistry();
    reg.register(echoDef, echoHandler);
    reg.disable("echo");
    assertEquals(reg.findByCapability("file-read").length, 0);
    assertEquals(reg.findByCategory("utility").length, 0);
  });

  await t.step("invokes a tool through registry", async () => {
    const reg = new ToolRegistry();
    reg.register(echoDef, echoHandler);
    const result = await reg.invoke("call-1", "echo", { message: "hi" }, {
      session_id: "sess-1",
    });
    assertEquals(result.success, true);
    assertEquals(result.stdout, "hi");
  });

  await t.step("returns error for missing tool invocation", async () => {
    const reg = new ToolRegistry();
    const result = await reg.invoke("call-1", "missing", {}, {
      session_id: "sess-1",
    });
    assertEquals(result.success, false);
    assertEquals(result.exit_code, 1);
  });

  await t.step("returns error for disabled tool invocation", async () => {
    const reg = new ToolRegistry();
    reg.register(echoDef, echoHandler);
    reg.disable("echo");
    const result = await reg.invoke("call-1", "echo", { message: "hi" }, {
      session_id: "sess-1",
    });
    assertEquals(result.success, false);
    assertEquals(result.exit_code, 1);
  });
});
