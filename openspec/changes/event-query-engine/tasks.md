## 1. Event Types

- [ ] 1.1 Add `agent.self_observed` and `agent.pattern_detected` event types to `EventTypes` in `src/types/events.ts`
- [ ] 1.2 Add type guards for the new event types (`isSelfObservationEvent`, `isPatternEvent`)
- [ ] 1.3 Add payload interfaces for `SelfObservedPayload` and `PatternDetectedPayload`

## 2. Query Engine Interface

- [ ] 2.1 Create `IEventQueryEngine` interface in `src/store/query-engine.ts` with method signatures
- [ ] 2.2 Define result types: `ToolPerformanceMetrics`, `ErrorPattern`, `SessionSummary`, `EventTypeDistribution`, `AggregateToolUsage`, `SessionDurationTrends`

## 3. Query Engine Implementation

- [ ] 3.1 Implement `EventQueryEngine` class with `getToolPerformance(toolName?, startTime?, endTime?)` method
- [ ] 3.2 Implement `getErrorPatterns(toolName?, startTime?, endTime?)` method
- [ ] 3.3 Implement `getSessionSummary(sessionId)` method
- [ ] 3.4 Implement `getRecentSessions(limit)` method
- [ ] 3.5 Implement `getEventTypeDistribution(startTime?, endTime?)` method
- [ ] 3.6 Implement `getAggregateToolUsage(startTime?, endTime?)` method
- [ ] 3.7 Implement `getSessionDurationTrends(startTime?, endTime?)` method

## 4. Integration

- [ ] 4.1 Create `EventQueryEngineBridge` that wires `EventQueryEngine` to `EventStore`
- [ ] 4.2 Export new types and classes from `src/store/mod.ts`

## 5. Tests

- [ ] 5.1 Write tests for `EventQueryEngine` tool performance queries
- [ ] 5.2 Write tests for `EventQueryEngine` error pattern queries
- [ ] 5.3 Write tests for `EventQueryEngine` session summary queries
- [ ] 5.4 Write tests for `EventQueryEngine` aggregate analytics queries
- [ ] 5.5 Write tests for edge cases: empty store, missing sessions, zero events
