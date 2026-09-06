## 1. Event Types

- [x] 1.1 Add `agent.self_observed` and `agent.pattern_detected` event types to `EventTypes` in `src/types/events.ts`
- [x] 1.2 Add type guards for the new event types (`isSelfObservationEvent`, `isPatternEvent`)
- [x] 1.3 Add payload interfaces for `SelfObservedPayload` and `PatternDetectedPayload`

## 2. Query Engine Interface

- [x] 2.1 Create `IEventQueryEngine` interface in `src/store/query-engine.ts` with method signatures
- [x] 2.2 Define result types: `ToolPerformanceMetrics`, `ErrorPattern`, `SessionSummary`, `EventTypeDistribution`, `AggregateToolUsage`, `SessionDurationTrends`

## 3. Query Engine Implementation

- [x] 3.1 Implement `EventQueryEngine` class with `getToolPerformance(toolName?, startTime?, endTime?)` method
- [x] 3.2 Implement `getErrorPatterns(toolName?, startTime?, endTime?)` method
- [x] 3.3 Implement `getSessionSummary(sessionId)` method
- [x] 3.4 Implement `getRecentSessions(limit)` method
- [x] 3.5 Implement `getEventTypeDistribution(startTime?, endTime?)` method
- [x] 3.6 Implement `getAggregateToolUsage(startTime?, endTime?)` method
- [x] 3.7 Implement `getSessionDurationTrends(startTime?, endTime?)` method

## 4. Integration

- [x] 4.1 Create `EventQueryEngineBridge` that wires `EventQueryEngine` to `EventStore`
- [x] 4.2 Export new types and classes from `src/store/mod.ts`

## 5. Tests

- [x] 5.1 Write tests for `EventQueryEngine` tool performance queries
- [x] 5.2 Write tests for `EventQueryEngine` error pattern queries
- [x] 5.3 Write tests for `EventQueryEngine` session summary queries
- [x] 5.4 Write tests for `EventQueryEngine` aggregate analytics queries
- [x] 5.5 Write tests for edge cases: empty store, missing sessions, zero events
