# src/store/sqlite-query-engine.ts · [[analytics-query-engines]] [[sqlite-query-engine]]

- SQLiteQueryEngine · class · L30-L535 — class SQLiteQueryEngine implements IEventQueryEngine
- constructor · method · L33-L35 — constructor(db: Database)
- buildTimeRange · method · L41-L62 — private buildTimeRange( range?: TimeRange, tableAlias = "", ): { clause: string; params: (string | number)[] }
- getToolPerformance · method · L68-L119 — getToolPerformance( toolName?: string, range?: TimeRange, ): ToolPerformanceMetrics[]
- getErrorPatterns · method · L125-L165 — getErrorPatterns(toolName?: string, range?: TimeRange): ErrorPattern[]
- getSessionSummary · method · L171-L210 — getSessionSummary(sessionId: string): SessionSummary | undefined
- getRecentSessions · method · L216-L256 — getRecentSessions(limit: number): SessionSummary[]
- getEventTypeDistribution · method · L262-L284 — getEventTypeDistribution(range?: TimeRange): EventTypeDistribution[]
- getAggregateToolUsage · method · L290-L331 — getAggregateToolUsage(range?: TimeRange): AggregateToolUsage
- getSessionDurationTrends · method · L337-L374 — getSessionDurationTrends(range?: TimeRange): SessionDurationTrends
- getTimeSeriesAggregation · method · L380-L417 — getTimeSeriesAggregation( granularity: "minute" | "hour" | "day" | "week", range?: TimeRange, ): { timestamp: string; event_count: number; error_count: number }[]
- getSessionWithMemories · method · L423-L450 — getSessionWithMemories(): { sessionId: string; eventCount: number; memoryCount: number; memoryTypes: string[]; }[]
- getToolUsageBySession · method · L456-L493 — getToolUsageBySession(): { sessionId: string; toolCounts: Record<string, number>; }[]
- getRollingErrorRate · method · L499-L534 — getRollingErrorRate( sessionId: string, windowSize: number = 10, ): { eventNum: number; isError: boolean; rollingErrorRate: number; }[]
