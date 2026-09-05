import { assertEquals } from "@std/assert";
import { ToolSelfImprovement } from "../self-improvement.ts";
import { ToolRegistry } from "../registry.ts";
import { ToolAuthoring } from "../authoring.ts";

Deno.test("ToolSelfImprovement", async (t) => {
  await t.step("returns empty suggestions below min invocations", () => {
    const reg = new ToolRegistry();
    const authoring = new ToolAuthoring(reg);
    const si = new ToolSelfImprovement(reg, authoring, {}, { min_invocations: 10 });

    si.recordUsage({ tool_name: "echo", parameters: {}, success: true, duration_ms: 100, timestamp: Date.now() });

    const suggestions = si.analyze();
    assertEquals(suggestions.length, 0);
  });

  await t.step("suggests robust version for failing tools", () => {
    const reg = new ToolRegistry();
    const authoring = new ToolAuthoring(reg);
    const si = new ToolSelfImprovement(reg, authoring, {}, { min_invocations: 3 });

    for (let i = 0; i < 5; i++) {
      si.recordUsage({ tool_name: "flaky", parameters: {}, success: false, duration_ms: 100, timestamp: Date.now() });
    }

    const suggestions = si.analyze();
    assertEquals(suggestions.length > 0, true);
    assertEquals(suggestions[0].is_improvement, true);
    assertEquals(suggestions[0].existing_tool, "flaky");
  });

  await t.step("suggests fast version for slow tools", () => {
    const reg = new ToolRegistry();
    const authoring = new ToolAuthoring(reg);
    const si = new ToolSelfImprovement(reg, authoring, {}, { min_invocations: 3 });

    for (let i = 0; i < 5; i++) {
      si.recordUsage({ tool_name: "slow", parameters: {}, success: true, duration_ms: 10000, timestamp: Date.now() });
    }

    const suggestions = si.analyze();
    const slowSuggestion = suggestions.find((s) => s.definition.name === "slow-fast");
    assertEquals(slowSuggestion !== undefined, true);
    assertEquals(slowSuggestion!.is_improvement, true);
  });

  await t.step("auto-creates when configured", () => {
    const reg = new ToolRegistry();
    const authoring = new ToolAuthoring(reg);
    const events: string[] = [];
    const si = new ToolSelfImprovement(
      reg,
      authoring,
      { onToolAutoCreated: (name) => events.push(`created:${name}`) },
      { min_invocations: 3, auto_create: true },
    );

    // Generate repeated param patterns
    for (let i = 0; i < 6; i++) {
      si.recordUsage({
        tool_name: "echo",
        parameters: { file: "/tmp/test", mode: "read" },
        success: true,
        duration_ms: 100,
        timestamp: Date.now(),
      });
    }

    const suggestions = si.analyze();
    assertEquals(suggestions.length > 0, true);
    // At least one should be auto-created
    assertEquals(events.some((e) => e.startsWith("created:")), true);
  });

  await t.step("config get/set", () => {
    const reg = new ToolRegistry();
    const authoring = new ToolAuthoring(reg);
    const si = new ToolSelfImprovement(reg, authoring, {}, { auto_create: true });

    assertEquals(si.getConfig().auto_create, true);
    si.setConfig({ auto_create: false });
    assertEquals(si.getConfig().auto_create, false);
  });
});
