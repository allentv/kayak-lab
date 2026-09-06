/**
 * Benchmark runner for evaluating system performance.
 *
 * Executes benchmark definitions against an executor function,
 * scores results using configurable criteria, and records metrics.
 */

import type {
  BenchmarkDefinition,
  BenchmarkResult,
  BenchmarkTestCase,
  TestCaseResult,
} from "./types.ts";
import type { MetricCollector } from "./metrics.ts";

// ============================================================================
// Benchmark Runner
// ============================================================================

/**
 * Runs benchmarks against an executor function.
 *
 * Each benchmark defines test cases with inputs and expected outputs.
 * The runner executes each case, evaluates results against criteria,
 * and produces an aggregate score.
 */
export class BenchmarkRunner {
  private metricCollector: MetricCollector;

  constructor(metricCollector: MetricCollector) {
    this.metricCollector = metricCollector;
  }

  /**
   * Execute a benchmark definition against an executor.
   *
   * Runs all test cases sequentially, scores each result, and records
   * per-case metrics. Returns aggregate results.
   */
  async runBenchmark(
    definition: BenchmarkDefinition,
    executor: (input: unknown) => Promise<unknown>,
    sessionId: string,
  ): Promise<BenchmarkResult> {
    const startTime = Date.now();
    const testCaseResults: TestCaseResult[] = [];

    for (const testCase of definition.testCases) {
      const caseStart = Date.now();
      let actualOutput: unknown;
      let passed = false;
      let score = 0;

      try {
        actualOutput = await executor(testCase.input);
        const result = this.evaluateTestCase(testCase, actualOutput);
        passed = result.passed;
        score = result.score;
      } catch (_error) {
        passed = false;
        score = 0;
      }

      const duration_ms = Date.now() - caseStart;
      testCaseResults.push({
        testCaseId: testCase.id,
        passed,
        score,
        actualOutput,
        duration_ms,
      });

      // Record per-case metrics
      this.metricCollector.record({
        metric_name: "benchmark.test_case",
        value: score,
        session_id: sessionId,
        context: { benchmarkId: definition.id, testCaseId: testCase.id, passed },
      });
    }

    const aggregateScore = this.calculateAggregateScore(testCaseResults);
    const passedCount = testCaseResults.filter((r) => r.passed).length;

    return {
      benchmarkId: definition.id,
      sessionId,
      startTime,
      endTime: Date.now(),
      testCaseResults,
      aggregateScore,
      passed: passedCount,
      failed: testCaseResults.length - passedCount,
      total: testCaseResults.length,
    };
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Evaluate a single test case against its criteria.
   */
  private evaluateTestCase(
    testCase: BenchmarkTestCase,
    actualOutput: unknown,
  ): TestCaseResult {
    const { criteria } = testCase;
    let score = 0;

    switch (criteria.type) {
      case "exact":
        score = actualOutput === testCase.expectedOutput ? 1 : 0;
        break;
      case "contains": {
        const actual = String(actualOutput);
        const expected = String(testCase.expectedOutput);
        score = actual.includes(expected) ? 1 : 0;
        break;
      }
      case "semantic": {
        // Approximate matching using threshold on string similarity
        const threshold = criteria.threshold ?? 0.8;
        const actual = String(actualOutput);
        const expected = String(testCase.expectedOutput);
        score = stringSimilarity(actual, expected) >= threshold ? 1 : 0;
        break;
      }
      case "custom":
        if (criteria.customFn) {
          score = criteria.customFn(actualOutput, testCase.expectedOutput) ? 1 : 0;
        }
        break;
    }

    return {
      testCaseId: testCase.id,
      passed: score >= 1,
      score,
      actualOutput,
      duration_ms: 0, // caller sets actual duration
    };
  }

  /**
   * Calculate the aggregate score as the average of all test case scores.
   */
  private calculateAggregateScore(results: TestCaseResult[]): number {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    return totalScore / results.length;
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Simple string similarity using bigram overlap (Sorensen–Dice style).
 * Returns a value between 0 and 1.
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);
  let intersection = 0;

  const bSet = new Set(bigramsB);
  for (const bg of bigramsA) {
    if (bSet.has(bg)) intersection++;
  }

  return (2 * intersection) / (bigramsA.length + bigramsB.length);
}

function bigrams(s: string): string[] {
  const result: string[] = [];
  for (let i = 0; i < s.length - 1; i++) {
    result.push(s.substring(i, i + 2));
  }
  return result;
}
