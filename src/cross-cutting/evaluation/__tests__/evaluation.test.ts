import { assertAlmostEquals, assertEquals, assertExists } from "@std/assert";
import { MetricCollector } from "../metrics.ts";
import { BenchmarkRunner } from "../benchmark.ts";
import { QualityScorer } from "../quality.ts";
import type {
  BenchmarkDefinition,
} from "../types.ts";

// ============================================================================
// MetricCollector Tests
// ============================================================================

Deno.test("MetricCollector: record and retrieve metrics", () => {
  const collector = new MetricCollector();

  collector.record({
    metric_name: "task.started",
    value: 1,
    session_id: "s1",
  });
  collector.record({
    metric_name: "task.completed",
    value: 1,
    session_id: "s1",
  });
  collector.record({
    metric_name: "task.started",
    value: 1,
    session_id: "s2",
  });

  const s1Metrics = collector.getMetrics("s1");
  assertEquals(s1Metrics.length, 2);

  const s2Metrics = collector.getMetrics("s2");
  assertEquals(s2Metrics.length, 1);

  const allStarted = collector.getMetricsByName("task.started");
  assertEquals(allStarted.length, 2);
});

Deno.test("MetricCollector: compute task completion rate", () => {
  const collector = new MetricCollector();

  // 3 started, 2 completed → 2/3
  for (let i = 0; i < 3; i++) {
    collector.record({ metric_name: "task.started", value: 1, session_id: "s1" });
  }
  collector.record({ metric_name: "task.completed", value: 1, session_id: "s1" });
  collector.record({ metric_name: "task.completed", value: 1, session_id: "s1" });

  assertEquals(collector.getTaskCompletionRate("s1"), 2 / 3);
});

Deno.test("MetricCollector: task completion rate is 0 when no tasks", () => {
  const collector = new MetricCollector();
  assertEquals(collector.getTaskCompletionRate("empty"), 0);
});

Deno.test("MetricCollector: compute response quality", () => {
  const collector = new MetricCollector();

  collector.record({ metric_name: "response.quality", value: 0.8, session_id: "s1" });
  collector.record({ metric_name: "response.quality", value: 0.6, session_id: "s1" });

  assertEquals(collector.getResponseQuality("s1"), 0.7);
});

Deno.test("MetricCollector: compute tool usage efficiency", () => {
  const collector = new MetricCollector();

  // 8 success, 2 failure → 0.8
  for (let i = 0; i < 8; i++) {
    collector.record({ metric_name: "tool.success", value: 1, session_id: "s1" });
  }
  for (let i = 0; i < 2; i++) {
    collector.record({ metric_name: "tool.failure", value: 1, session_id: "s1" });
  }

  assertEquals(collector.getToolUsageEfficiency("s1"), 0.8);
});

Deno.test("MetricCollector: tool efficiency is 0 when no tool calls", () => {
  const collector = new MetricCollector();
  assertEquals(collector.getToolUsageEfficiency("empty"), 0);
});

Deno.test("MetricCollector: clear removes all metrics", () => {
  const collector = new MetricCollector();
  collector.record({ metric_name: "x", value: 1, session_id: "s1" });
  assertEquals(collector.getMetrics("s1").length, 1);
  collector.clear();
  assertEquals(collector.getMetrics("s1").length, 0);
});

// ============================================================================
// BenchmarkRunner Tests
// ============================================================================

Deno.test("BenchmarkRunner: run benchmark with passing test cases", async () => {
  const collector = new MetricCollector();
  const runner = new BenchmarkRunner(collector);

  const definition: BenchmarkDefinition = {
    id: "bench-1",
    name: "Echo Benchmark",
    description: "Echo input back",
    testCases: [
      {
        id: "tc-1",
        name: "echo hello",
        input: "hello",
        expectedOutput: "hello",
        criteria: { type: "exact" },
      },
      {
        id: "tc-2",
        name: "echo world",
        input: "world",
        expectedOutput: "world",
        criteria: { type: "exact" },
      },
    ],
  };

  const executor = async (input: unknown) => input;
  const result = await runner.runBenchmark(definition, executor, "s1");

  assertEquals(result.benchmarkId, "bench-1");
  assertEquals(result.total, 2);
  assertEquals(result.passed, 2);
  assertEquals(result.failed, 0);
  assertEquals(result.aggregateScore, 1);
});

Deno.test("BenchmarkRunner: run benchmark with failing test cases", async () => {
  const collector = new MetricCollector();
  const runner = new BenchmarkRunner(collector);

  const definition: BenchmarkDefinition = {
    id: "bench-2",
    name: "Failing Benchmark",
    description: "Some fail",
    testCases: [
      {
        id: "tc-1",
        name: "pass",
        input: "a",
        expectedOutput: "a",
        criteria: { type: "exact" },
      },
      {
        id: "tc-2",
        name: "fail",
        input: "a",
        expectedOutput: "b",
        criteria: { type: "exact" },
      },
    ],
  };

  const executor = async (input: unknown) => input;
  const result = await runner.runBenchmark(definition, executor, "s1");

  assertEquals(result.passed, 1);
  assertEquals(result.failed, 1);
  assertEquals(result.aggregateScore, 0.5);
});

Deno.test("BenchmarkRunner: contains criteria", async () => {
  const collector = new MetricCollector();
  const runner = new BenchmarkRunner(collector);

  const definition: BenchmarkDefinition = {
    id: "bench-3",
    name: "Contains",
    description: "Contains check",
    testCases: [
      {
        id: "tc-1",
        name: "contains check",
        input: "hello world",
        expectedOutput: "world",
        criteria: { type: "contains" },
      },
    ],
  };

  const executor = async (input: unknown) => input;
  const result = await runner.runBenchmark(definition, executor, "s1");

  assertEquals(result.passed, 1);
  assertEquals(result.aggregateScore, 1);
});

Deno.test("BenchmarkRunner: empty test cases returns 0 score", async () => {
  const collector = new MetricCollector();
  const runner = new BenchmarkRunner(collector);

  const definition: BenchmarkDefinition = {
    id: "bench-empty",
    name: "Empty",
    description: "No cases",
    testCases: [],
  };

  const executor = async (input: unknown) => input;
  const result = await runner.runBenchmark(definition, executor, "s1");

  assertEquals(result.total, 0);
  assertEquals(result.aggregateScore, 0);
});

// ============================================================================
// QualityScorer Tests
// ============================================================================

Deno.test("QualityScorer: compute quality score from metrics", () => {
  const collector = new MetricCollector();
  const scorer = new QualityScorer(collector);

  // Set up metrics for session "s1"
  collector.record({ metric_name: "task.started", value: 1, session_id: "s1" });
  collector.record({ metric_name: "task.started", value: 1, session_id: "s1" });
  collector.record({ metric_name: "task.completed", value: 1, session_id: "s1" });
  collector.record({ metric_name: "response.quality", value: 0.9, session_id: "s1" });
  collector.record({ metric_name: "response.quality", value: 0.8, session_id: "s1" });
  collector.record({ metric_name: "tool.success", value: 1, session_id: "s1" });
  collector.record({ metric_name: "tool.success", value: 1, session_id: "s1" });
  collector.record({ metric_name: "tool.failure", value: 1, session_id: "s1" });

  const score = scorer.computeScore("s1");

  assertExists(score);
  assertEquals(score.sessionId, "s1");
  assertEquals(score.taskCompletion, 0.5); // 1 of 2 completed
  assertAlmostEquals(score.responseQuality, 0.85, 1e-10); // (0.9+0.8)/2
  assertAlmostEquals(score.toolEfficiency, 2 / 3, 1e-10); // 2 success / 3 total
  assertEquals(score.overallScore > 0, true);
});

Deno.test("QualityScorer: getScore returns cached score", () => {
  const collector = new MetricCollector();
  const scorer = new QualityScorer(collector);

  collector.record({ metric_name: "task.started", value: 1, session_id: "s1" });
  const computed = scorer.computeScore("s1");
  const retrieved = scorer.getScore("s1");

  assertEquals(retrieved?.sessionId, computed.sessionId);
  assertEquals(retrieved?.overallScore, computed.overallScore);
});

Deno.test("QualityScorer: getScore returns undefined for unknown session", () => {
  const collector = new MetricCollector();
  const scorer = new QualityScorer(collector);
  assertEquals(scorer.getScore("unknown"), undefined);
});

Deno.test("QualityScorer: track quality trends over time", () => {
  const collector = new MetricCollector();
  const scorer = new QualityScorer(collector);

  // Session 1
  collector.record({ metric_name: "task.started", value: 1, session_id: "s1" });
  collector.record({ metric_name: "task.completed", value: 1, session_id: "s1" });
  scorer.computeScore("s1");

  // Session 2
  collector.record({ metric_name: "task.started", value: 1, session_id: "s2" });
  collector.record({ metric_name: "task.completed", value: 1, session_id: "s2" });
  collector.record({ metric_name: "task.completed", value: 1, session_id: "s2" });
  scorer.computeScore("s2");

  const trend = scorer.getTrend("overallScore");
  assertEquals(trend.dataPoints.length, 2);
  assertEquals(trend.metricName, "overallScore");
});

Deno.test("QualityScorer: detect improving trend", () => {
  const collector = new MetricCollector();
  const scorer = new QualityScorer(collector);

  // Simulate improving scores over multiple sessions
  for (let i = 0; i < 5; i++) {
    const sessionId = `s${i}`;
    collector.record({ metric_name: "task.started", value: 1, session_id: sessionId });
    // More completions each time
    for (let j = 0; j <= i; j++) {
      collector.record({ metric_name: "task.completed", value: 1, session_id: sessionId });
    }
    scorer.computeScore(sessionId);
  }

  const trend = scorer.getTrend("taskCompletion");
  assertEquals(trend.trend, "improving");
  assertEquals(trend.changeRate > 0, true);
});

Deno.test("QualityScorer: detect declining trend", () => {
  const collector = new MetricCollector();
  const scorer = new QualityScorer(collector);

  // Simulate declining scores
  for (let i = 0; i < 5; i++) {
    const sessionId = `s${i}`;
    collector.record({ metric_name: "task.started", value: 1, session_id: sessionId });
    collector.record({ metric_name: "task.started", value: 1, session_id: sessionId });
    // Fewer completions each time
    for (let j = 0; j < 5 - i; j++) {
      collector.record({ metric_name: "task.completed", value: 1, session_id: sessionId });
    }
    scorer.computeScore(sessionId);
  }

  const trend = scorer.getTrend("taskCompletion");
  assertEquals(trend.trend, "declining");
  assertEquals(trend.changeRate < 0, true);
});

Deno.test("QualityScorer: stable trend for constant values", () => {
  const collector = new MetricCollector();
  const scorer = new QualityScorer(collector);

  // Simulate stable scores — same completion rate every time
  for (let i = 0; i < 5; i++) {
    const sessionId = `s${i}`;
    collector.record({ metric_name: "task.started", value: 1, session_id: sessionId });
    collector.record({ metric_name: "task.completed", value: 1, session_id: sessionId });
    scorer.computeScore(sessionId);
  }

  const trend = scorer.getTrend("taskCompletion");
  assertEquals(trend.trend, "stable");
  assertEquals(trend.changeRate, 0);
});

Deno.test("QualityScorer: getAllTrends returns all metrics", () => {
  const collector = new MetricCollector();
  const scorer = new QualityScorer(collector);

  // Need at least 2 data points for meaningful trends
  collector.record({ metric_name: "task.started", value: 1, session_id: "s1" });
  collector.record({ metric_name: "task.completed", value: 1, session_id: "s1" });
  scorer.computeScore("s1");

  collector.record({ metric_name: "task.started", value: 1, session_id: "s2" });
  collector.record({ metric_name: "task.completed", value: 1, session_id: "s2" });
  scorer.computeScore("s2");

  const trends = scorer.getAllTrends();
  assertEquals(trends.length, 5); // all 5 metric names
});

// ============================================================================
// Integration Tests
// ============================================================================

Deno.test("Integration: metric collection → quality scoring → trends", async () => {
  const collector = new MetricCollector();
  const runner = new BenchmarkRunner(collector);
  const scorer = new QualityScorer(collector);

  // Run a benchmark
  const definition: BenchmarkDefinition = {
    id: "int-bench",
    name: "Integration",
    description: "End-to-end test",
    testCases: [
      {
        id: "tc-1",
        name: "test 1",
        input: "a",
        expectedOutput: "a",
        criteria: { type: "exact" },
      },
      {
        id: "tc-2",
        name: "test 2",
        input: "b",
        expectedOutput: "b",
        criteria: { type: "exact" },
      },
    ],
  };

  const executor = async (input: unknown) => input;
  const benchResult = await runner.runBenchmark(definition, executor, "s1");

  assertEquals(benchResult.passed, 2);
  assertEquals(benchResult.aggregateScore, 1);

  // Compute quality score from benchmark metrics
  const quality = scorer.computeScore("s1");
  assertExists(quality);
  assertEquals(quality.sessionId, "s1");

  // Track trends across multiple benchmarks
  const definition2: BenchmarkDefinition = {
    id: "int-bench-2",
    name: "Integration 2",
    description: "Second run",
    testCases: [
      {
        id: "tc-1",
        name: "test 1",
        input: "x",
        expectedOutput: "y", // will fail
        criteria: { type: "exact" },
      },
    ],
  };

  await runner.runBenchmark(definition2, executor, "s2");
  scorer.computeScore("s2");

  const trends = scorer.getAllTrends();
  assertEquals(trends.length > 0, true);
  assertExists(trends.find((t) => t.metricName === "overallScore"));
});
