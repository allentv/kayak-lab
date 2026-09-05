import { assertEquals } from "@std/assert";
import { ToolAuthoring } from "../authoring.ts";
import { ToolRegistry } from "../registry.ts";
import type { IToolDefinition, ToolHandler } from "../types.ts";

const testDef: IToolDefinition = {
  name: "greet",
  description: "Greets a user",
  parameters: {
    type: "object",
    properties: { name: { type: "string" } },
    required: ["name"],
  },
};

const testHandler: ToolHandler = async (params) => ({
  tool_call_id: "c1",
  tool_name: "greet",
  exit_code: 0,
  stdout: "Hello " + String(params.name ?? ""),
  stderr: "",
  duration_ms: 0,
  success: true,
});

Deno.test("ToolAuthoring", async (t) => {
  await t.step("creates a proposal", () => {
    const reg = new ToolRegistry();
    const authoring = new ToolAuthoring(reg);
    const proposal = authoring.propose(testDef, {
      current_task: "testing",
      gap_description: "need greeting",
      examples: ["greet Alice"],
    });

    assertEquals(proposal.definition.name, "greet");
    assertEquals(proposal.context.current_task, "testing");
    assertEquals(authoring.pending().length, 1);
  });

  await t.step("accept registers tool", () => {
    const reg = new ToolRegistry();
    const authoring = new ToolAuthoring(reg);
    const proposal = authoring.propose(testDef, {
      current_task: "testing",
      gap_description: "need greeting",
      examples: [],
    });

    authoring.decide(proposal, { action: "accept", definition: testDef, handler: testHandler });

    assertEquals(authoring.pending().length, 0);
    assertEquals(reg.has("greet"), true);
  });

  await t.step("reject removes proposal", () => {
    const reg = new ToolRegistry();
    const authoring = new ToolAuthoring(reg);
    const proposal = authoring.propose(testDef, {
      current_task: "testing",
      gap_description: "need greeting",
      examples: [],
    });

    authoring.decide(proposal, { action: "reject", reason: "not needed" });

    assertEquals(authoring.pending().length, 0);
    assertEquals(reg.has("greet"), false);
  });

  await t.step("emits events", () => {
    const events: string[] = [];
    const reg = new ToolRegistry();
    const authoring = new ToolAuthoring(reg, {
      onToolProposed: () => events.push("proposed"),
      onToolCreated: () => events.push("created"),
      onToolRejected: () => events.push("rejected"),
    });

    const p1 = authoring.propose(testDef, {
      current_task: "t",
      gap_description: "g",
      examples: [],
    });
    authoring.decide(p1, { action: "accept", definition: testDef, handler: testHandler });

    const p2 = authoring.propose(testDef, {
      current_task: "t",
      gap_description: "g",
      examples: [],
    });
    authoring.decide(p2, { action: "reject", reason: "no" });

    assertEquals(events, ["proposed", "created", "proposed", "rejected"]);
  });
});
