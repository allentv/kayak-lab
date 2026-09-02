/**
 * Event query engine for analytics and self-observation.
 *
 * Provides read-only analytics queries on top of IEventStore.
 * Does not modify the store — purely computational over stored events.
 */

import { BaseEvent, EventTypes } from "../types/events.ts";
import { IEventStore } from "./event-store.ts";

// ============================================================================
// Query Types
// ============================================================================

/** Time range filter for queries. */
export interface TimeRange {
  startTime?: string;
  endTime?: string;
}

/** Tool performance metrics. */
export interface ToolPerformanceMetrics {
  toolName: string;
  totalInvocations: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageDurationMs: number;
}

/** Error pattern entry. */
export interface ErrorPattern {
  errorType: string;
  toolName: string;
  count: number;
  lastOccurrence: string;
}

/** Session summary. */
export interface SessionSummary {
  sessionId: string;
  totalEvents: number;
  durationMs: number;
  toolCallCount: number;
  modelInvocationCount: number;
  completionStatus: string;
  startedAt: string;
  lastEventAt: string;
}

/** Event type distribution entry. */
export interface EventTypeDistribution {
  eventType: string;
  count: number;
  percentage: number;
}

/** Aggregate tool usage stats. */
export interface AggregateToolUsage {
  totalInvocations: number;
  uniqueTools: number;
  toolBreakdown: Record<string, number>;
}

/** Session duration trends. */
export interface SessionDurationTrends {
  averageMs: number;
  minMs: number;
  maxMs: number;
  sessionCount: number;
}

// ============================================================================
// Query Engine Interface
// ============================================================================

export interface IEventQueryEngine {
  getToolPerformance(toolName?: string, range?: TimeRange): ToolPerformanceMetrics[];
  getErrorPatterns(toolName?: string, range?: TimeRange): ErrorPattern[];
  getSessionSummary(sessionId: string): SessionSummary | undefined;
  getRecentSessions(limit: number): SessionSummary[];
  getEventTypeDistribution(range?: TimeRange): EventTypeDistribution[];
  getAggregateToolUsage(range?: TimeRange): AggregateToolUsage;
  getSessionDurationTrends(range?: TimeRange): SessionDurationTrends;
}

// ============================================================================
// Query Engine Implementation
// ============================================================================

export class EventQueryEngine implements IEventQueryEngine {
  constructor(private readonly store: IEventStore) {}

  getToolPerformance(toolName?: string, range?: TimeRange): ToolPerformanceMetrics[] {
    const allEvents = this.getAllFilteredEvents(range);
    const toolEvents = allEvents.filter(
      (e) =>
        e.event_type === EventTypes.TOOL_EXECUTION_STARTED ||
        e.event_type === EventTypes.TOOL_EXECUTION_COMPLETED ||
        e.event_type === EventTypes.TOOL_EXECUTION_FAILED,
    );

    const byTool = new Map<string, { started: number; completed: number; failed: number; durations: number[] }>();

    for (const event of toolEvents) {
      const name = event.payload.tool_name as string;
      if (toolName && name !== toolName) continue;

      const entry = byTool.get(name) ?? { started: 0, completed: 0, failed: 0, durations: [] };
      if (event.event_type === EventTypes.TOOL_EXECUTION_STARTED) entry.started++;
      else if (event.event_type === EventTypes.TOOL_EXECUTION_COMPLETED) {
        entry.completed++;
        if (typeof event.payload.duration_ms === "number") entry.durations.push(event.payload.duration_ms);
      } else if (event.event_type === EventTypes.TOOL_EXECUTION_FAILED) {
        entry.failed++;
        if (typeof event.payload.duration_ms === "number") entry.durations.push(event.payload.duration_ms);
      }
      byTool.set(name, entry);
    }

    const metrics: ToolPerformanceMetrics[] = [];
    for (const [name, data] of byTool) {
      const total = data.completed + data.failed;
      const avgDuration = data.durations.length > 0
        ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length
        : 0;
      metrics.push({
        toolName: name,
        totalInvocations: data.started,
        successCount: data.completed,
        failureCount: data.failed,
        successRate: total > 0 ? data.completed / total : 0,
        averageDurationMs: avgDuration,
      });
    }

    return metrics;
  }

  getErrorPatterns(toolName?: string, range?: TimeRange): ErrorPattern[] {
    const allEvents = this.getAllFilteredEvents(range);
    const failedEvents = allEvents.filter((e) => e.event_type === EventTypes.TOOL_EXECUTION_FAILED);

    const byError = new Map<string, { count: number; lastOccurrence: string; toolName: string }>();

    for (const event of failedEvents) {
      const name = event.payload.tool_name as string;
      if (toolName && name !== toolName) continue;

      const error = (event.payload.error as string) ?? "unknown";
      const key = `${name}::${error}`;
      const entry = byError.get(key) ?? { count: 0, lastOccurrence: event.timestamp, toolName: name };
      entry.count++;
      if (event.timestamp > entry.lastOccurrence) entry.lastOccurrence = event.timestamp;
      byError.set(key, entry);
    }

    const patterns: ErrorPattern[] = [];
    for (const [, data] of byError) {
      patterns.push({
        errorType: data.toolName,
        toolName: data.toolName,
        count: data.count,
        lastOccurrence: data.lastOccurrence,
      });
    }

    return patterns.sort((a, b) => b.count - a.count);
  }

  getSessionSummary(sessionId: string): SessionSummary | undefined {
    const events = this.store.getEvents(sessionId);
    if (events.length === 0) return undefined;

    const toolCalls = events.filter((e) => e.event_type === EventTypes.TOOL_EXECUTION_COMPLETED || e.event_type === EventTypes.TOOL_EXECUTION_FAILED).length;
    const modelCalls = events.filter((e) => e.event_type === EventTypes.MODEL_REQUEST).length;

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const durationMs = new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime();

    let completionStatus = "unknown";
    const lastSessionEvent = events.filter((e) => e.event_type.startsWith("session.")).pop();
    if (lastSessionEvent) {
      completionStatus = lastSessionEvent.event_type.replace("session.", "");
    }

    return {
      sessionId,
      totalEvents: events.length,
      durationMs,
      toolCallCount: toolCalls,
      modelInvocationCount: modelCalls,
      completionStatus,
      startedAt: firstEvent.timestamp,
      lastEventAt: lastEvent.timestamp,
    };
  }

  getRecentSessions(limit: number): SessionSummary[] {
    const sessionIds = this.store.getSessionIds();
    const summaries: SessionSummary[] = [];

    for (const id of sessionIds) {
      const summary = this.getSessionSummary(id);
      if (summary) summaries.push(summary);
    }

    return summaries
      .sort((a, b) => new Date(b.lastEventAt).getTime() - new Date(a.lastEventAt).getTime())
      .slice(0, limit);
  }

  getEventTypeDistribution(range?: TimeRange): EventTypeDistribution[] {
    const allEvents = this.getAllFilteredEvents(range);
    const counts = new Map<string, number>();

    for (const event of allEvents) {
      counts.set(event.event_type, (counts.get(event.event_type) ?? 0) + 1);
    }

    const total = allEvents.length;
    const distribution: EventTypeDistribution[] = [];

    for (const [eventType, count] of counts) {
      distribution.push({
        eventType,
        count,
        percentage: total > 0 ? count / total : 0,
      });
    }

    return distribution.sort((a, b) => b.count - a.count);
  }

  getAggregateToolUsage(range?: TimeRange): AggregateToolUsage {
    const allEvents = this.getAllFilteredEvents(range);
    const toolEvents = allEvents.filter(
      (e) =>
        e.event_type === EventTypes.TOOL_EXECUTION_COMPLETED ||
        e.event_type === EventTypes.TOOL_EXECUTION_FAILED,
    );

    const breakdown = new Map<string, number>();
    for (const event of toolEvents) {
      const name = event.payload.tool_name as string;
      breakdown.set(name, (breakdown.get(name) ?? 0) + 1);
    }

    const toolBreakdown: Record<string, number> = {};
    for (const [name, count] of breakdown) {
      toolBreakdown[name] = count;
    }

    return {
      totalInvocations: toolEvents.length,
      uniqueTools: breakdown.size,
      toolBreakdown,
    };
  }

  getSessionDurationTrends(range?: TimeRange): SessionDurationTrends {
    const sessionIds = this.store.getSessionIds();
    const durations: number[] = [];

    for (const id of sessionIds) {
      const summary = this.getSessionSummary(id);
      if (summary) {
        if (range?.startTime && summary.startedAt < range.startTime) continue;
        if (range?.endTime && summary.lastEventAt > range.endTime) continue;
        durations.push(summary.durationMs);
      }
    }

    if (durations.length === 0) {
      return { averageMs: 0, minMs: 0, maxMs: 0, sessionCount: 0 };
    }

    return {
      averageMs: durations.reduce((a, b) => a + b, 0) / durations.length,
      minMs: Math.min(...durations),
      maxMs: Math.max(...durations),
      sessionCount: durations.length,
    };
  }

  private getAllFilteredEvents(range?: TimeRange): BaseEvent[] {
    const sessionIds = this.store.getSessionIds();
    const events: BaseEvent[] = [];

    for (const id of sessionIds) {
      const sessionEvents = this.store.getEvents(id);
      for (const event of sessionEvents) {
        if (range?.startTime && event.timestamp < range.startTime) continue;
        if (range?.endTime && event.timestamp > range.endTime) continue;
        events.push(event);
      }
    }

    return events;
  }
}
