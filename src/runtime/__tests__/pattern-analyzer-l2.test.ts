/**
 * Tests for PatternAnalyzer L2 Scenario integration.
 */

import { assertEquals, assertExists } from "@std/assert";
import { PatternAnalyzer } from "../pattern-analyzer.ts";
import { MemoryProvider } from "../../memory/provider.ts";
import { SQLitePersistenceBackend } from "../../store/sqlite-backend.ts";

// ============================================================================
// Test Helpers
// ============================================================================

function createMockQueryEngine() {
  return {
    getToolPerformance: () => [
      {
        toolName: "shell",
        totalInvocations: 10,
        successCount: 3,
        failureCount: 7,
        successRate: 0.3,
        averageDurationMs: 100,
      },
      {
        toolName: "read",
        totalInvocations: 20,
        successCount: 19,
        failureCount: 1,
        successRate: 0.95,
        averageDurationMs: 50,
      },
    ],
    getRecentSessions: () => [
      { sessionId: "session-1", modelInvocationCount: 5, toolCallCount: 2, totalEvents: 7, durationMs: 1000, completionStatus: "completed", startedAt: "2026-01-01T00:00:00Z", lastEventAt: "2026-01-01T00:00:01Z" },
      { sessionId: "session-2", modelInvocationCount: 3, toolCallCount: 10, totalEvents: 13, durationMs: 2000, completionStatus: "completed", startedAt: "2026-01-01T00:00:00Z", lastEventAt: "2026-01-01T00:00:02Z" },
    ],
    getSessionSummary: (id: string) => {
      if (id === "session-1") {
        return { toolCallCount: 2, modelInvocationCount: 5, sessionId: id, totalEvents: 7, durationMs: 1000, completionStatus: "completed", startedAt: "2026-01-01T00:00:00Z", lastEventAt: "2026-01-01T00:00:01Z" };
      }
      return { toolCallCount: 10, modelInvocationCount: 3, sessionId: id, totalEvents: 13, durationMs: 2000, completionStatus: "completed", startedAt: "2026-01-01T00:00:00Z", lastEventAt: "2026-01-01T00:00:02Z" };
    },
    getErrorPatterns: () => [],
    getEventTypeDistribution: () => [],
    getAggregateToolUsage: () => ({ totalInvocations: 0, uniqueTools: 0, toolBreakdown: {} }),
    getSessionDurationTrends: () => ({ averageMs: 0, minMs: 0, maxMs: 0, sessionCount: 0 }),
  };
}

function createMemoryProvider(): { provider: MemoryProvider; backend: SQLitePersistenceBackend } {
  const backend = new SQLitePersistenceBackend({ dbPath: ":memory:" });
  const provider = new MemoryProvider(
    { provider: "custom", settings: {} },
    backend,
  );
  return { provider, backend };
}

// ============================================================================
// PatternAnalyzer L2 Tests
// ============================================================================

Deno.test("PatternAnalyzer - writes scenario on degrading tool", async () => {
  const { provider, backend } = createMemoryProvider();
  const queryEngine = createMockQueryEngine();

  const analyzer = new PatternAnalyzer(queryEngine, {
    memoryProvider: provider,
    writePatterns: true,
  });

  // Generate report — should write a scenario for the degrading "shell" tool
  const report = analyzer.generateReport();
  assertEquals(report.toolTrends.length, 2);

  // Give async write a moment to complete
  await new Promise((r) => setTimeout(r, 10));

  // Check that scenario was written
  const scenarios = await provider.listScenarios("patterns");
  const shellScenario = scenarios.find((s) => s.path.includes("shell"));

  assertExists(shellScenario);
  assertEquals(shellScenario?.path, "tool-failure.shell");
  assertEquals(shellScenario?.content.includes("shell"), true);
  assertEquals(shellScenario?.content.includes("30.0%"), true);

  backend.close();
});

Deno.test("PatternAnalyzer - writes scenario on low efficiency", async () => {
  const { provider, backend } = createMemoryProvider();
  const queryEngine = createMockQueryEngine();

  const analyzer = new PatternAnalyzer(queryEngine, {
    memoryProvider: provider,
    writePatterns: true,
  });

  // Generate report — should write a scenario for session-1 (score < 0.3)
  analyzer.generateReport();

  // Give async write a moment to complete
  await new Promise((r) => setTimeout(r, 10));

  // Check that scenario was written
  const scenarios = await provider.listScenarios("patterns");
  const efficiencyScenario = scenarios.find((s) => s.path === "efficiency.low-score");

  assertExists(efficiencyScenario);
  assertEquals(efficiencyScenario?.content.includes("session-1"), true);

  backend.close();
});

Deno.test("PatternAnalyzer - does not write when no patterns", async () => {
  const { provider, backend } = createMemoryProvider();

  // Query engine with no degrading tools and no low efficiency sessions
  const queryEngine = {
    getToolPerformance: () => [
      {
        toolName: "shell",
        totalInvocations: 10,
        successCount: 9,
        failureCount: 1,
        successRate: 0.95,
        averageDurationMs: 100,
      },
    ],
    getRecentSessions: () => [
      { sessionId: "session-1", modelInvocationCount: 3, toolCallCount: 10, totalEvents: 13, durationMs: 2000, completionStatus: "completed", startedAt: "2026-01-01T00:00:00Z", lastEventAt: "2026-01-01T00:00:02Z" },
    ],
    getSessionSummary: (_id: string) => ({
      toolCallCount: 10, modelInvocationCount: 3, sessionId: _id, totalEvents: 13, durationMs: 2000, completionStatus: "completed", startedAt: "2026-01-01T00:00:00Z", lastEventAt: "2026-01-01T00:00:02Z",
    }),
    getErrorPatterns: () => [],
    getEventTypeDistribution: () => [],
    getAggregateToolUsage: () => ({ totalInvocations: 0, uniqueTools: 0, toolBreakdown: {} }),
    getSessionDurationTrends: () => ({ averageMs: 0, minMs: 0, maxMs: 0, sessionCount: 0 }),
  };

  const analyzer = new PatternAnalyzer(queryEngine, {
    memoryProvider: provider,
    writePatterns: true,
  });

  analyzer.generateReport();
  await new Promise((r) => setTimeout(r, 10));

  // No scenarios should be written
  const scenarios = await provider.listScenarios("patterns");
  assertEquals(scenarios.length, 0);

  backend.close();
});

Deno.test("PatternAnalyzer - writePatterns=false disables writing", async () => {
  const { provider, backend } = createMemoryProvider();
  const queryEngine = createMockQueryEngine();

  const analyzer = new PatternAnalyzer(queryEngine, {
    memoryProvider: provider,
    writePatterns: false, // Disable writing
  });

  analyzer.generateReport();
  await new Promise((r) => setTimeout(r, 10));

  // No scenarios should be written even though there are degrading tools
  const scenarios = await provider.listScenarios("patterns");
  assertEquals(scenarios.length, 0);

  backend.close();
});
