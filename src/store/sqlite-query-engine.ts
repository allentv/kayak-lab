/**
 * SQLite-based query engine for analytics and self-observation.
 *
 * SQL-based queries on the SQLite event store. Provides tool performance metrics,
 * session summaries, event type distributions, error patterns, time-series
 * aggregation, cross-table joins, pivot tables, and window function analytics.
 */

import { Database } from "@db/sqlite";
import { EventTypes } from "../types/events.ts";
import {
  IEventQueryEngine,
  TimeRange,
  ToolPerformanceMetrics,
  ErrorPattern,
  SessionSummary,
  EventTypeDistribution,
  AggregateToolUsage,
  SessionDurationTrends,
} from "./query-engine.ts";

// ============================================================================
// SQLite Query Engine
// ============================================================================

/**
 * SQLite query engine implementing IEventQueryEngine.
 * All queries are executed as SQL against the SQLite database.
 */
export class SQLiteQueryEngine implements IEventQueryEngine {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // --------------------------------------------------------------------------
  // Helper: Build time range WHERE clause
  // --------------------------------------------------------------------------

  private buildTimeRange(
    range?: TimeRange,
    tableAlias = "",
  ): { clause: string; params: (string | number)[] } {
    const prefix = tableAlias ? `${tableAlias}.` : "";
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (range?.startTime) {
      conditions.push(`${prefix}timestamp >= ?`);
      params.push(range.startTime);
    }
    if (range?.endTime) {
      conditions.push(`${prefix}timestamp <= ?`);
      params.push(range.endTime);
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      params,
    };
  }

  // --------------------------------------------------------------------------
  // Tool Performance Metrics
  // --------------------------------------------------------------------------

  getToolPerformance(
    toolName?: string,
    range?: TimeRange,
  ): ToolPerformanceMetrics[] {
    const conditions = [`event_type IN (?, ?, ?)`];
    const params: (string | number)[] = [
      EventTypes.TOOL_EXECUTION_STARTED,
      EventTypes.TOOL_EXECUTION_COMPLETED,
      EventTypes.TOOL_EXECUTION_FAILED,
    ];

    if (toolName) {
      conditions.push(`json_extract(payload, '$.tool_name') = ?`);
      params.push(toolName);
    }

    const { clause: timeClause, params: timeParams } = this.buildTimeRange(range);
    if (timeClause) {
      conditions.push(timeClause.replace("WHERE ", ""));
    }
    params.push(...timeParams);

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const sql = `
      SELECT
        json_extract(payload, '$.tool_name') as tool_name,
        COUNT(*) as total_invocations,
        SUM(CASE WHEN event_type = ? THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN event_type = ? THEN 1 ELSE 0 END) as failure_count,
        AVG(CASE WHEN event_type = ? THEN CAST(json_extract(payload, '$.duration_ms') AS REAL) ELSE NULL END) as avg_duration_ms
      FROM events
      ${whereClause}
      GROUP BY json_extract(payload, '$.tool_name')
    `;

    const rows = this.db.prepare(sql).all(
      EventTypes.TOOL_EXECUTION_COMPLETED,
      EventTypes.TOOL_EXECUTION_FAILED,
      EventTypes.TOOL_EXECUTION_COMPLETED,
      ...params,
    );

    return rows.map((row) => ({
      toolName: row.tool_name as string,
      totalInvocations: row.total_invocations as number,
      successCount: row.success_count as number,
      failureCount: row.failure_count as number,
      successRate: (row.success_count as number) / (row.total_invocations as number),
      averageDurationMs: (row.avg_duration_ms as number) || 0,
    }));
  }

  // --------------------------------------------------------------------------
  // Error Pattern Analysis
  // --------------------------------------------------------------------------

  getErrorPatterns(toolName?: string, range?: TimeRange): ErrorPattern[] {
    const conditions = [`event_type IN (?, ?)`];
    const params: (string | number)[] = [
      EventTypes.TOOL_EXECUTION_FAILED,
      EventTypes.MCP_ERROR,
    ];

    if (toolName) {
      conditions.push(`json_extract(payload, '$.tool_name') = ?`);
      params.push(toolName);
    }

    const { clause: timeClause, params: timeParams } = this.buildTimeRange(range);
    if (timeClause) {
      conditions.push(timeClause.replace("WHERE ", ""));
    }
    params.push(...timeParams);

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const sql = `
      SELECT
        json_extract(payload, '$.error_type') as error_type,
        json_extract(payload, '$.tool_name') as tool_name,
        COUNT(*) as count,
        MAX(timestamp) as last_occurrence
      FROM events
      ${whereClause}
      GROUP BY json_extract(payload, '$.error_type'), json_extract(payload, '$.tool_name')
      ORDER BY count DESC
    `;

    const rows = this.db.prepare(sql).all(...params);

    return rows.map((row) => ({
      errorType: row.error_type as string,
      toolName: row.tool_name as string,
      count: row.count as number,
      lastOccurrence: row.last_occurrence as string,
    }));
  }

  // --------------------------------------------------------------------------
  // Session Summary
  // --------------------------------------------------------------------------

  getSessionSummary(sessionId: string): SessionSummary | undefined {
    const sql = `
      SELECT
        session_id,
        COUNT(*) as total_events,
        MIN(timestamp) as started_at,
        MAX(timestamp) as last_event_at,
        CAST(SUM(CASE WHEN event_type IN (?, ?) THEN 1 ELSE 0 END) AS REAL) * COUNT(*) / COUNT(*) as tool_call_count,
        CAST(SUM(CASE WHEN event_type = ? THEN 1 ELSE 0 END) AS REAL) * COUNT(*) / COUNT(*) as model_invocation_count,
        SUM(CASE WHEN event_type = ? THEN 1 ELSE 0 END) as completion_count
      FROM events
      WHERE session_id = ?
      GROUP BY session_id
    `;

    const row = this.db.prepare(sql).get(
      EventTypes.TOOL_EXECUTION_STARTED,
      EventTypes.TOOL_EXECUTION_COMPLETED,
      EventTypes.MODEL_REQUEST,
      EventTypes.SESSION_COMPLETED,
      sessionId,
    ) as Record<string, unknown> | undefined;

    if (!row) return undefined;

    const startedAt = row.started_at as string;
    const lastEventAt = row.last_event_at as string;
    const durationMs = new Date(lastEventAt).getTime() - new Date(startedAt).getTime();

    return {
      sessionId: row.session_id as string,
      totalEvents: row.total_events as number,
      durationMs,
      toolCallCount: Math.round(row.tool_call_count as number),
      modelInvocationCount: Math.round(row.model_invocation_count as number),
      completionStatus: (row.completion_count as number) > 0 ? "completed" : "active",
      startedAt,
      lastEventAt,
    };
  }

  // --------------------------------------------------------------------------
  // Recent Sessions
  // --------------------------------------------------------------------------

  getRecentSessions(limit: number): SessionSummary[] {
    const sql = `
      SELECT
        session_id,
        COUNT(*) as total_events,
        MIN(timestamp) as started_at,
        MAX(timestamp) as last_event_at,
        CAST(SUM(CASE WHEN event_type IN (?, ?) THEN 1 ELSE 0 END) AS REAL) * COUNT(*) / COUNT(*) as tool_call_count,
        CAST(SUM(CASE WHEN event_type = ? THEN 1 ELSE 0 END) AS REAL) * COUNT(*) / COUNT(*) as model_invocation_count,
        SUM(CASE WHEN event_type = ? THEN 1 ELSE 0 END) as completion_count
      FROM events
      GROUP BY session_id
      ORDER BY last_event_at DESC
      LIMIT ?
    `;

    const rows = this.db.prepare(sql).all(
      EventTypes.TOOL_EXECUTION_STARTED,
      EventTypes.TOOL_EXECUTION_COMPLETED,
      EventTypes.MODEL_REQUEST,
      EventTypes.SESSION_COMPLETED,
      limit,
    );

    return rows.map((row) => {
      const startedAt = row.started_at as string;
      const lastEventAt = row.last_event_at as string;
      const durationMs = new Date(lastEventAt).getTime() - new Date(startedAt).getTime();

      return {
        sessionId: row.session_id as string,
        totalEvents: row.total_events as number,
        durationMs,
        toolCallCount: Math.round(row.tool_call_count as number),
        modelInvocationCount: Math.round(row.model_invocation_count as number),
        completionStatus: (row.completion_count as number) > 0 ? "completed" : "active",
        startedAt,
        lastEventAt,
      };
    });
  }

  // --------------------------------------------------------------------------
  // Event Type Distribution
  // --------------------------------------------------------------------------

  getEventTypeDistribution(range?: TimeRange): EventTypeDistribution[] {
    const { clause: timeClause, params } = this.buildTimeRange(range);
    const whereClause = timeClause || "";

    const sql = `
      SELECT
        event_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM events ${whereClause}), 2) as percentage
      FROM events
      ${whereClause}
      GROUP BY event_type
      ORDER BY count DESC
    `;

    const rows = this.db.prepare(sql).all(...params);

    return rows.map((row) => ({
      eventType: row.event_type as string,
      count: row.count as number,
      percentage: row.percentage as number,
    }));
  }

  // --------------------------------------------------------------------------
  // Aggregate Tool Usage
  // --------------------------------------------------------------------------

  getAggregateToolUsage(range?: TimeRange): AggregateToolUsage {
    const conditions = [`event_type IN (?, ?)`];
    const params: (string | number)[] = [
      EventTypes.TOOL_EXECUTION_STARTED,
      EventTypes.TOOL_EXECUTION_COMPLETED,
    ];

    const { clause: timeClause, params: timeParams } = this.buildTimeRange(range);
    if (timeClause) {
      conditions.push(timeClause.replace("WHERE ", ""));
    }
    params.push(...timeParams);

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const sql = `
      SELECT
        json_extract(payload, '$.tool_name') as tool_name,
        COUNT(*) as count
      FROM events
      ${whereClause}
      GROUP BY json_extract(payload, '$.tool_name')
    `;

    const rows = this.db.prepare(sql).all(...params);

    const toolBreakdown: Record<string, number> = {};
    let totalInvocations = 0;

    for (const row of rows) {
      const toolName = row.tool_name as string;
      const count = row.count as number;
      toolBreakdown[toolName] = count;
      totalInvocations += count;
    }

    return {
      totalInvocations,
      uniqueTools: Object.keys(toolBreakdown).length,
      toolBreakdown,
    };
  }

  // --------------------------------------------------------------------------
  // Session Duration Trends
  // --------------------------------------------------------------------------

  getSessionDurationTrends(range?: TimeRange): SessionDurationTrends {
    const { clause: timeClause, params } = this.buildTimeRange(range);
    // Remap "timestamp" references to "started_at" for the subquery
    const whereClause = timeClause
      ? timeClause.replace(/timestamp/g, "started_at")
      : "";

    const sql = `
      SELECT
        AVG(duration_ms) as avg_ms,
        MIN(duration_ms) as min_ms,
        MAX(duration_ms) as max_ms,
        COUNT(*) as session_count
      FROM (
        SELECT
          session_id,
          (julianday(MAX(timestamp)) - julianday(MIN(timestamp))) * 86400000 as duration_ms,
          MIN(timestamp) as started_at
        FROM events
        GROUP BY session_id
      ) session_durations
      ${whereClause}
    `;

    const rows = this.db.prepare(sql).all(...params);

    if (rows.length === 0) {
      return { averageMs: 0, minMs: 0, maxMs: 0, sessionCount: 0 };
    }

    const row = rows[0];
    return {
      averageMs: (row.avg_ms as number) || 0,
      minMs: (row.min_ms as number) || 0,
      maxMs: (row.max_ms as number) || 0,
      sessionCount: row.session_count as number,
    };
  }

  // --------------------------------------------------------------------------
  // Time-Series Aggregation
  // --------------------------------------------------------------------------

  getTimeSeriesAggregation(
    granularity: "minute" | "hour" | "day" | "week",
    range?: TimeRange,
  ): { timestamp: string; event_count: number; error_count: number }[] {
    const formatMap: Record<string, string> = {
      minute: "%Y-%m-%dT%H:%M:00",
      hour: "%Y-%m-%dT%H:00:00",
      day: "%Y-%m-%dT00:00:00",
      week: "%Y-%W01T00:00:00",
    };
    const strftimeFmt = formatMap[granularity] || formatMap.hour;

    const { clause: timeClause, params } = this.buildTimeRange(range);
    const whereClause = timeClause || "";

    const sql = `
      SELECT
        strftime('${strftimeFmt}', timestamp) as time_bucket,
        COUNT(*) as event_count,
        SUM(CASE WHEN event_type IN (?, ?) THEN 1 ELSE 0 END) as error_count
      FROM events
      ${whereClause}
      GROUP BY time_bucket
      ORDER BY time_bucket
    `;

    const rows = this.db.prepare(sql).all(
      EventTypes.MCP_ERROR,
      EventTypes.TOOL_EXECUTION_FAILED,
      ...params,
    );

    return rows.map((row) => ({
      timestamp: (row.time_bucket as string) || "",
      event_count: row.event_count as number,
      error_count: row.error_count as number,
    }));
  }

  // --------------------------------------------------------------------------
  // Cross-Table Join (Events × Memories)
  // --------------------------------------------------------------------------

  getSessionWithMemories(): {
    sessionId: string;
    eventCount: number;
    memoryCount: number;
    memoryTypes: string[];
  }[] {
    const sql = `
      SELECT
        e.session_id,
        COUNT(DISTINCT e.id) as event_count,
        COUNT(DISTINCT m.id) as memory_count,
        GROUP_CONCAT(DISTINCT m.type) as memory_types
      FROM events e
      LEFT JOIN memories m ON e.session_id = m.session_id
      GROUP BY e.session_id
      HAVING COUNT(DISTINCT m.id) > 0
      ORDER BY memory_count DESC
    `;

    const rows = this.db.prepare(sql).all();

    return rows.map((row) => ({
      sessionId: row.session_id as string,
      eventCount: row.event_count as number,
      memoryCount: row.memory_count as number,
      memoryTypes: (row.memory_types as string)?.split(",") || [],
    }));
  }

  // --------------------------------------------------------------------------
  // Pivot Table (Tool Usage by Session)
  // --------------------------------------------------------------------------

  getToolUsageBySession(): {
    sessionId: string;
    toolCounts: Record<string, number>;
  }[] {
    const sql = `
      SELECT
        session_id,
        json_extract(payload, '$.tool_name') as tool_name,
        COUNT(*) as count
      FROM events
      WHERE event_type IN (?, ?)
      GROUP BY session_id, json_extract(payload, '$.tool_name')
      ORDER BY session_id, count DESC
    `;

    const rows = this.db.prepare(sql).all(
      EventTypes.TOOL_EXECUTION_STARTED,
      EventTypes.TOOL_EXECUTION_COMPLETED,
    );

    const pivotMap = new Map<string, Record<string, number>>();

    for (const row of rows) {
      const sessionId = row.session_id as string;
      const toolName = row.tool_name as string;
      const count = row.count as number;

      if (!pivotMap.has(sessionId)) {
        pivotMap.set(sessionId, {});
      }
      pivotMap.get(sessionId)![toolName] = count;
    }

    return Array.from(pivotMap.entries()).map(([sessionId, toolCounts]) => ({
      sessionId,
      toolCounts,
    }));
  }

  // --------------------------------------------------------------------------
  // Window Function Analytics (Rolling Error Rate)
  // --------------------------------------------------------------------------

  getRollingErrorRate(
    sessionId: string,
    windowSize: number = 10,
  ): {
    eventNum: number;
    isError: boolean;
    rollingErrorRate: number;
  }[] {
    const sql = `
      SELECT
        ROW_NUMBER() OVER (ORDER BY sequence) as event_num,
        CASE WHEN event_type IN (?, ?) THEN 1 ELSE 0 END as is_error,
        AVG(CASE WHEN event_type IN (?, ?) THEN 1.0 ELSE 0.0 END) OVER (
          ORDER BY sequence
          ROWS BETWEEN ? PRECEDING AND CURRENT ROW
        ) as rolling_error_rate
      FROM events
      WHERE session_id = ?
      ORDER BY sequence
    `;

    const rows = this.db.prepare(sql).all(
      EventTypes.MCP_ERROR,
      EventTypes.TOOL_EXECUTION_FAILED,
      EventTypes.MCP_ERROR,
      EventTypes.TOOL_EXECUTION_FAILED,
      windowSize,
      sessionId,
    );

    return rows.map((row) => ({
      eventNum: row.event_num as number,
      isError: (row.is_error as number) === 1,
      rollingErrorRate: row.rolling_error_rate as number,
    }));
  }
}
