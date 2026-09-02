/**
 * Pattern analyzer for event history.
 *
 * Provides statistical analysis of event patterns: tool trends, session efficiency,
 * model usage, and error clustering. Wraps EventQueryEngine for data access.
 */

import { IEventQueryEngine, TimeRange } from "../store/query-engine.ts";

// ============================================================================
// Analysis Types
// ============================================================================

/** Trend direction for a metric. */
export type TrendDirection = "improving" | "degrading" | "stable" | "insufficient_data";

/** Tool performance trend. */
export interface ToolTrend {
  toolName: string;
  direction: TrendDirection;
  currentSuccessRate: number;
  previousSuccessRate: number;
  changeMagnitude: number;
}

/** Session efficiency metrics. */
export interface SessionEfficiency {
  sessionId: string;
  score: number;
  toolCompletions: number;
  totalEffort: number;
  modelInvocations: number;
}

/** Model usage pattern. */
export interface ModelUsage {
  totalTokens: number;
  averagePerResponse: number;
  highUsageSessions: string[];
  tokenTrend: TrendDirection;
}

/** Error cluster entry. */
export interface ErrorCluster {
  toolName: string;
  errorPattern: string;
  count: number;
  percentage: number;
}

/** Complete analysis report. */
export interface AnalysisReport {
  toolTrends: ToolTrend[];
  sessionEfficiency: SessionEfficiency[];
  modelUsage: ModelUsage;
  errorClusters: ErrorCluster[];
  generatedAt: string;
}

// ============================================================================
// Pattern Analyzer Interface
// ============================================================================

export interface IPatternAnalyzer {
  analyzeToolTrends(range?: TimeRange): ToolTrend[];
  analyzeSessionEfficiency(sessionIds?: string[]): SessionEfficiency[];
  analyzeModelUsage(range?: TimeRange): ModelUsage;
  clusterErrors(range?: TimeRange): ErrorCluster[];
  generateReport(range?: TimeRange): AnalysisReport;
}

// ============================================================================
// Pattern Analyzer Implementation
// ============================================================================

export class PatternAnalyzer implements IPatternAnalyzer {
  constructor(private readonly queryEngine: IEventQueryEngine) {}

  analyzeToolTrends(range?: TimeRange): ToolTrend[] {
    const metrics = this.queryEngine.getToolPerformance(undefined, range);
    const trends: ToolTrend[] = [];

    for (const metric of metrics) {
      // Determine trend based on success rate
      // With aggregated metrics, we use the success rate as the primary indicator
      let direction: TrendDirection;
      if (metric.totalInvocations < 3) {
        direction = "insufficient_data";
      } else if (metric.successRate >= 0.9) {
        direction = "stable";
      } else if (metric.successRate >= 0.5) {
        direction = "improving";
      } else {
        direction = "degrading";
      }

      trends.push({
        toolName: metric.toolName,
        direction,
        currentSuccessRate: metric.successRate,
        previousSuccessRate: metric.successRate,
        changeMagnitude: 0,
      });
    }

    return trends;
  }

  analyzeSessionEfficiency(sessionIds?: string[]): SessionEfficiency[] {
    const ids = sessionIds ?? this.queryEngine.getRecentSessions(100).map((s) => s.sessionId);
    const efficiencies: SessionEfficiency[] = [];

    for (const id of ids) {
      const summary = this.queryEngine.getSessionSummary(id);
      if (!summary) continue;

      const toolCompletions = summary.toolCallCount;
      const totalEffort = summary.toolCallCount + summary.modelInvocationCount;
      const score = totalEffort > 0 ? toolCompletions / totalEffort : 0;

      efficiencies.push({
        sessionId: id,
        score,
        toolCompletions,
        totalEffort,
        modelInvocations: summary.modelInvocationCount,
      });
    }

    return efficiencies.sort((a, b) => b.score - a.score);
  }

  analyzeModelUsage(_range?: TimeRange): ModelUsage {
    const sessions = this.queryEngine.getRecentSessions(100);
    const totalTokens = 0;
    let responseCount = 0;
    const highUsageSessions: string[] = [];

    for (const session of sessions) {
      responseCount += session.modelInvocationCount;

      const avgPerSession = responseCount / (sessions.indexOf(session) + 1);
      if (session.modelInvocationCount > avgPerSession * 2 && session.modelInvocationCount > 5) {
        highUsageSessions.push(session.sessionId);
      }
    }

    const averagePerResponse = responseCount > 0 ? totalTokens / responseCount : 0;

    return {
      totalTokens,
      averagePerResponse,
      highUsageSessions,
      tokenTrend: "stable",
    };
  }

  clusterErrors(range?: TimeRange): ErrorCluster[] {
    const errors = this.queryEngine.getErrorPatterns(undefined, range);
    const totalErrors = errors.reduce((sum, e) => sum + e.count, 0);

    return errors.map((error) => ({
      toolName: error.toolName,
      errorPattern: error.errorType,
      count: error.count,
      percentage: totalErrors > 0 ? error.count / totalErrors : 0,
    }));
  }

  generateReport(range?: TimeRange): AnalysisReport {
    return {
      toolTrends: this.analyzeToolTrends(range),
      sessionEfficiency: this.analyzeSessionEfficiency(),
      modelUsage: this.analyzeModelUsage(range),
      errorClusters: this.clusterErrors(range),
      generatedAt: new Date().toISOString(),
    };
  }
}
