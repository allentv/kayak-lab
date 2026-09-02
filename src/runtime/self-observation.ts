/**
 * Self-observation layer for agent runtime.
 *
 * Provides hooks that query the agent's own event history before/after turns.
 * Integrates with EventQueryEngine for analytics and records observations as events.
 */

import { IEventStream } from "../core/event-stream.ts";
import { IEventQueryEngine, ToolPerformanceMetrics, ErrorPattern, SessionSummary } from "../store/query-engine.ts";

// ============================================================================
// Observation Types
// ============================================================================

/** Observation context surfaced to the agent before each turn. */
export interface ObservationContext {
  /** Tool performance metrics from recent sessions */
  toolPerformance: ToolPerformanceMetrics[];
  /** Error patterns observed */
  errorPatterns: ErrorPattern[];
  /** Current session summary */
  sessionSummary: SessionSummary | undefined;
  /** Timestamp of observation */
  observedAt: string;
}

/** Self-observation interface. */
export interface ISelfObservation {
  /** Query event history before a model call. */
  preTurn(sessionId: string): Promise<ObservationContext>;
  /** Record observation after a model call. */
  postTurn(sessionId: string, context: ObservationContext): Promise<void>;
  /** Detect patterns in event history. */
  detectPatterns(sessionId: string): Promise<PatternDetection[]>;
}

/** Detected pattern entry. */
export interface PatternDetection {
  patternId: string;
  confidence: number;
  description: string;
  sessionIds: string[];
}

// ============================================================================
// Self-Observation Implementation
// ============================================================================

export class SelfObservation implements ISelfObservation {
  constructor(
    private readonly queryEngine: IEventQueryEngine,
    private readonly eventStream: IEventStream,
  ) {}

  async preTurn(sessionId: string): Promise<ObservationContext> {
    const toolPerformance = this.queryEngine.getToolPerformance();
    const errorPatterns = this.queryEngine.getErrorPatterns();
    const sessionSummary = this.queryEngine.getSessionSummary(sessionId);

    return {
      toolPerformance,
      errorPatterns,
      sessionSummary,
      observedAt: new Date().toISOString(),
    };
  }

  async postTurn(sessionId: string, context: ObservationContext): Promise<void> {
    const patterns = await this.detectPatterns(sessionId);

    this.eventStream.append({
      session_id: sessionId,
      sequence_number: this.eventStream.getCurrentSequence(sessionId) + 1,
      event_type: "agent.self_observed" as const,
      payload: {
        observation_type: "post_turn",
        data: {
          toolPerformanceCount: context.toolPerformance.length,
          errorPatternCount: context.errorPatterns.length,
          patternsDetected: patterns.length,
        },
        source_session_id: sessionId,
      },
      metadata: { source: "self-observation" },
    });

    for (const pattern of patterns) {
      this.eventStream.append({
        session_id: sessionId,
        sequence_number: this.eventStream.getCurrentSequence(sessionId) + 1,
        event_type: "agent.pattern_detected" as const,
        payload: {
          pattern_id: pattern.patternId,
          confidence: pattern.confidence,
          description: pattern.description,
          session_ids: pattern.sessionIds,
        },
        metadata: { source: "self-observation" },
      });
    }
  }

  async detectPatterns(sessionId: string): Promise<PatternDetection[]> {
    const patterns: PatternDetection[] = [];

    // Detect repeated tool failures
    const errorPatterns = this.queryEngine.getErrorPatterns();
    for (const error of errorPatterns) {
      if (error.count >= 3) {
        patterns.push({
          patternId: `repeated_failure_${error.toolName}`,
          confidence: Math.min(error.count / 10, 1),
          description: `Tool "${error.toolName}" has failed ${error.count} times`,
          sessionIds: [sessionId],
        });
      }
    }

    // Detect low success rate tools
    const toolPerformance = this.queryEngine.getToolPerformance();
    for (const tool of toolPerformance) {
      if (tool.totalInvocations >= 5 && tool.successRate < 0.5) {
        patterns.push({
          patternId: `low_success_rate_${tool.toolName}`,
          confidence: 1 - tool.successRate,
          description: `Tool "${tool.toolName}" has ${(tool.successRate * 100).toFixed(0)}% success rate over ${tool.totalInvocations} invocations`,
          sessionIds: [sessionId],
        });
      }
    }

    return patterns;
  }
}
