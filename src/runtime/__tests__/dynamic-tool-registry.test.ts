import {
  assertEquals,
  assertExists,
} from "@std/assert";
import { DynamicToolRegistry } from "../dynamic-tool-registry.ts";
import { EventStream } from "../../core/event-stream.ts";
import { ToolRegistry } from "../tool-registry.ts";
import { AnalysisReport } from "../pattern-analyzer.ts";

function createEmptyReport(): AnalysisReport {
  return {
    toolTrends: [],
    sessionEfficiency: [],
    modelUsage: { totalTokens: 0, averagePerResponse: 0, highUsageSessions: [], tokenTrend: "stable" },
    errorClusters: [],
    generatedAt: new Date().toISOString(),
  };
}

Deno.test("DynamicToolRegistry", async (t) => {
  await t.step("disableTool disables tool and records event", async () => {
    const eventStream = new EventStream();
    const toolRegistry = new ToolRegistry();
    const registry = new DynamicToolRegistry(eventStream, toolRegistry);

    await registry.disableTool("bash", "repeated failures");

    const state = registry.getToolState("bash");
    assertExists(state);
    assertEquals(state.enabled, false);
    assertEquals(state.reason, "repeated failures");

    const events = eventStream.getEvents("dynamic-registry");
    const disableEvent = events.find((e) =>
      e.payload.observation_type === "tool.disabled" && (e.payload.data as Record<string, unknown>)?.toolName === "bash"
    );
    assertExists(disableEvent);
  });

  await t.step("enableTool enables tool and records event", async () => {
    const eventStream = new EventStream();
    const toolRegistry = new ToolRegistry();
    const registry = new DynamicToolRegistry(eventStream, toolRegistry);

    await registry.disableTool("bash", "failures");
    await registry.enableTool("bash", "recovered");

    const state = registry.getToolState("bash");
    assertExists(state);
    assertEquals(state.enabled, true);
    assertEquals(state.reason, "recovered");
  });

  await t.step("critical tools cannot be disabled", async () => {
    const eventStream = new EventStream();
    const toolRegistry = new ToolRegistry();
    const registry = new DynamicToolRegistry(eventStream, toolRegistry);

    // Manually set as critical
    await registry.enableTool("shell", "essential");
    const state = registry.getToolState("shell");
    if (state) state.critical = true;

    await registry.disableTool("shell", "should not work");

    const afterState = registry.getToolState("shell");
    assertExists(afterState);
    assertEquals(afterState.enabled, true);
  });

  await t.step("evaluatePatterns disables tools with repeated failures", async () => {
    const eventStream = new EventStream();
    const toolRegistry = new ToolRegistry();
    const registry = new DynamicToolRegistry(eventStream, toolRegistry);

    const report = createEmptyReport();
    report.errorClusters = [
      { toolName: "bash", errorPattern: "timeout", count: 5, percentage: 0.8 },
    ];

    const actions = await registry.evaluatePatterns(report);
    assertEquals(actions.length, 1);
    assertEquals(actions[0].action, "disable");
    assertEquals(actions[0].toolName, "bash");

    const state = registry.getToolState("bash");
    assertExists(state);
    assertEquals(state.enabled, false);
  });

  await t.step("evaluatePatterns re-enables improving tools", async () => {
    const eventStream = new EventStream();
    const toolRegistry = new ToolRegistry();
    const registry = new DynamicToolRegistry(eventStream, toolRegistry);

    // First disable
    await registry.disableTool("read", "was failing");

    const report = createEmptyReport();
    report.toolTrends = [
      {
        toolName: "read",
        direction: "improving",
        currentSuccessRate: 0.9,
        previousSuccessRate: 0.5,
        changeMagnitude: 0.4,
      },
    ];

    const actions = await registry.evaluatePatterns(report);
    const enableAction = actions.find((a) => a.action === "enable" && a.toolName === "read");
    assertExists(enableAction);

    const state = registry.getToolState("read");
    assertExists(state);
    assertEquals(state.enabled, true);
  });

  await t.step("lifecycle hooks fire on state changes", async () => {
    const eventStream = new EventStream();
    const toolRegistry = new ToolRegistry();
    const hookCalls: string[] = [];

    const registry = new DynamicToolRegistry(eventStream, toolRegistry, {
      onEnable: (name) => { hookCalls.push(`enable:${name}`); },
      onDisable: (name) => { hookCalls.push(`disable:${name}`); },
      onUpdate: (name) => { hookCalls.push(`update:${name}`); },
    });

    await registry.disableTool("bash", "test");
    await registry.enableTool("bash", "test");
    await registry.updateTool("bash", { reason: "test" });

    assertEquals(hookCalls, ["disable:bash", "enable:bash", "update:bash"]);
  });
});
