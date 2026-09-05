import { assertEquals, assertThrows } from "@std/assert";
import { ToolDefinition, ToolDefinitionError, ParameterValidationError } from "../tool-definition.ts";
import type { IToolDefinition } from "../types.ts";

const validTool: IToolDefinition = {
  name: "echo",
  description: "Echoes input",
  parameters: {
    type: "object",
    properties: {
      message: { type: "string", description: "Message to echo" },
      count: { type: "number", description: "Repeat count" },
    },
    required: ["message"],
  },
};

Deno.test("ToolDefinition", async (t) => {
  await t.step("creates a valid definition", () => {
    const def = ToolDefinition.create(validTool);
    assertEquals(def.name, "echo");
    assertEquals(def.definition.description, "Echoes input");
  });

  await t.step("rejects missing name", () => {
    assertThrows(
      () => ToolDefinition.create({ ...validTool, name: "" }),
      ToolDefinitionError,
    );
  });

  await t.step("rejects invalid name characters", () => {
    assertThrows(
      () => ToolDefinition.create({ ...validTool, name: "has spaces" }),
      ToolDefinitionError,
    );
  });

  await t.step("accepts underscore and hyphen in name", () => {
    const def = ToolDefinition.create({ ...validTool, name: "my_tool-2" });
    assertEquals(def.name, "my_tool-2");
  });

  await t.step("rejects missing description", () => {
    assertThrows(
      () => ToolDefinition.create({ ...validTool, description: "" }),
      ToolDefinitionError,
    );
  });

  await t.step("rejects missing parameters", () => {
    assertThrows(
      () => ToolDefinition.create({ ...validTool, parameters: undefined as unknown as IToolDefinition["parameters"] }),
      ToolDefinitionError,
    );
  });

  await t.step("rejects non-object parameters type", () => {
    assertThrows(
      () => ToolDefinition.create({
        ...validTool,
        parameters: { type: "string" },
      }),
      ToolDefinitionError,
    );
  });

  await t.step("rejects required field not in properties", () => {
    assertThrows(
      () => ToolDefinition.create({
        ...validTool,
        parameters: {
          type: "object",
          properties: {},
          required: ["missing"],
        },
      }),
      ToolDefinitionError,
    );
  });

  await t.step("validates correct parameters", () => {
    const def = ToolDefinition.create(validTool);
    // Should not throw
    def.validateParameters({ message: "hello" });
  });

  await t.step("validates parameters with all fields", () => {
    const def = ToolDefinition.create(validTool);
    def.validateParameters({ message: "hello", count: 3 });
  });

  await t.step("rejects missing required parameter", () => {
    const def = ToolDefinition.create(validTool);
    assertThrows(
      () => def.validateParameters({}),
      ParameterValidationError,
    );
  });

  await t.step("rejects wrong parameter type", () => {
    const def = ToolDefinition.create(validTool);
    assertThrows(
      () => def.validateParameters({ message: 123 }),
      ParameterValidationError,
    );
  });

  await t.step("rejects enum violation", () => {
    const enumTool: IToolDefinition = {
      name: "mode",
      description: "Set mode",
      parameters: {
        type: "object",
        properties: {
          level: { type: "string", enum: ["low", "high"] },
        },
      },
    };
    const def = ToolDefinition.create(enumTool);
    assertThrows(
      () => def.validateParameters({ level: "medium" }),
      ParameterValidationError,
    );
  });

  await t.step("allows extra parameters", () => {
    const def = ToolDefinition.create(validTool);
    // Extra params should be allowed (OpenAI pattern)
    def.validateParameters({ message: "hello", extra: "field" });
  });

  await t.step("validates nested objects", () => {
    const nestedTool: IToolDefinition = {
      name: "nested",
      description: "Nested tool",
      parameters: {
        type: "object",
        properties: {
          config: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
            required: ["name"],
          },
        },
      },
    };
    const def = ToolDefinition.create(nestedTool);
    def.validateParameters({ config: { name: "test" } });
    assertThrows(
      () => def.validateParameters({ config: {} }),
      ParameterValidationError,
    );
  });

  await t.step("toJSON returns plain object", () => {
    const def = ToolDefinition.create(validTool);
    const json = def.toJSON();
    assertEquals(json.name, "echo");
    assertEquals(typeof json, "object");
  });

  await t.step("validate returns errors without throwing", () => {
    const errors = ToolDefinition.validate({ name: "", description: "", parameters: { type: "object" } });
    assertEquals(errors.length > 0, true);
  });

  await t.step("validate returns empty for valid definition", () => {
    const errors = ToolDefinition.validate(validTool);
    assertEquals(errors.length, 0);
  });
});
