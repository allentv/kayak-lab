# src/store/query-engine.ts · [[analytics-query-engines]]

- TimeRange · interface · L16-L19 — interface TimeRange
- ToolPerformanceMetrics · interface · L22-L29 — interface ToolPerformanceMetrics
- ErrorPattern · interface · L32-L37 — interface ErrorPattern
- SessionSummary · interface · L40-L49 — interface SessionSummary
- EventTypeDistribution · interface · L52-L56 — interface EventTypeDistribution
- AggregateToolUsage · interface · L59-L63 — interface AggregateToolUsage
- SessionDurationTrends · interface · L66-L71 — interface SessionDurationTrends
- IEventQueryEngine · interface · L77-L85 — interface IEventQueryEngine
- EventQueryEngine · class · L91-L302 — class EventQueryEngine implements IEventQueryEngine
- constructor · method · L92-L92 — constructor(private readonly store: IEventStore)
- getToolPerformance · method · L94-L138 — getToolPerformance(toolName?: string, range?: TimeRange): ToolPerformanceMetrics[]
- getErrorPatterns · method · L140-L169 — getErrorPatterns(toolName?: string, range?: TimeRange): ErrorPattern[]
- getSessionSummary · method · L171-L198 — getSessionSummary(sessionId: string): SessionSummary | undefined
- getRecentSessions · method · L200-L212 — getRecentSessions(limit: number): SessionSummary[]
- getEventTypeDistribution · method · L214-L234 — getEventTypeDistribution(range?: TimeRange): EventTypeDistribution[]
- getAggregateToolUsage · method · L236-L260 — getAggregateToolUsage(range?: TimeRange): AggregateToolUsage
- getSessionDurationTrends · method · L262-L285 — getSessionDurationTrends(range?: TimeRange): SessionDurationTrends
- getAllFilteredEvents · method · L287-L301 — private getAllFilteredEvents(range?: TimeRange): BaseEvent[]
