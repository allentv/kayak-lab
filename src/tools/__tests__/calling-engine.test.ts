import { assertEquals, assertThrows } from "@std/assert";
import { ToolCallingEngine } from "../calling-engine.ts";
import { ParameterValidationError } from "../tool-definition.ts";
import type { IToolDefinition, ToolHandlerContext } from "../types.ts";

const echoTool: IToolDefinition = {
  name: "echo",
  description: "Echoes input",
  parameters: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
    required: ["message"],
  },
};

const ctx = (overrides?: Partial<ToolHandlerContext>): ToolHandlerContext => ({
  session_id: "sess-1",
  tool_call_id: "call-1",
  ...overrides,
});

Deno.test("ToolCallingEngine", async (t) => {
  const engine = new ToolCallingEngine();

  await t.step("validates correct parameters", () => {
    engine.validate(echoTool, { message: "hello" });
  });

  await t.step("rejects invalid parameters", () => {
    assertThrows(
      () => engine.validate(echoTool, {}),
      ParameterValidationError,
    );
  });

  await t.step("invokes a tool successfully", async () => {
    const result = await engine.invoke(
      echoTool,
      async (params) => ({
        tool_call_id: "call-1",
        tool_name: "echo",
        exit_code: 0,
        stdout: String(params.message ?? ""),
        stderr: "",
        duration_ms: 0,
        success: true,
      }),
      { message: "hello" },
      ctx(),
    );

    assertEquals(result.success, true);
    assertEquals(result.stdout, "hello");
    assertEquals(result.exit_code, 0);
  });

  await t.step("rejects invocation with invalid params", async () => {
    const result = await engine.invoke(
      echoTool,
      async () => ({
        tool_call_id: "call-2",
        tool_name: "echo",
        exit_code: 0,
        stdout: "",
        stderr: "",
        duration_ms: 0,
        success: true,
      }),
      {},
      ctx({ tool_call_id: "call-2" }),
    );

    assertEquals(result.success, false);
    assertEquals(result.exit_code, 1);
  });

  await t.step("handles handler errors", async () => {
    const result = await engine.invoke(
      echoTool,
      async () => {
        throw new Error("boom");
      },
      { message: "hello" },
      ctx({ tool_call_id: "call-3" }),
    );

    assertEquals(result.success, false);
    assertEquals(result.stderr, "boom");
    assertEquals(result.exit_code, 1);
  });

  await t.step("formats success result", () => {
    const result = engine.formatSuccess("call-4", "echo", "output", 100);
    assertEquals(result.tool_call_id, "call-4");
    assertEquals(result.tool_name, "echo");
    assertEquals(result.exit_code, 0);
    assertEquals(result.stdout, "output");
    assertEquals(result.stderr, "");
    assertEquals(result.success, true);
    assertEquals(result.duration_ms, 100);
  });

  await t.step("formats error result", () => {
    const result = engine.formatError("call-5", "echo", new Error("fail"), 50);
    assertEquals(result.tool_call_id, "call-5");
    assertEquals(result.tool_name, "echo");
    assertEquals(result.exit_code, 1);
    assertEquals(result.stdout, "");
    assertEquals(result.stderr, "fail");
    assertEquals(result.success, false);
  });

  await t.step("formats non-string output as JSON", () => {
    const result = engine.formatSuccess("call-6", "echo", { key: "value" }, 10);
    assertEquals(result.stdout, '{"key":"value"}');
  });
});
