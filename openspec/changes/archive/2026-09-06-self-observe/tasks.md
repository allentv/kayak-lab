## 1. Self-Observation Interface

- [x] 1.1 Create `ISelfObservation` interface in `src/runtime/self-observation.ts` with `preTurn` and `postTurn` methods
- [x] 1.2 Define `ObservationContext` type with tool performance, error patterns, and session summary fields

## 2. Self-Observation Implementation

- [x] 2.1 Implement `SelfObservation` class with `preTurn(sessionId)` method that queries EventQueryEngine
- [x] 2.2 Implement `postTurn(sessionId, events)` method that records observation event
- [x] 2.3 Implement `detectPatterns(sessionId)` method for basic pattern detection

## 3. Runtime Integration

- [x] 3.1 Add optional `selfObservation` parameter to `AgentRuntime` constructor
- [x] 3.2 Wire `preTurn()` call before model invocation in `runLoop()`
- [x] 3.3 Wire `postTurn()` call after model invocation in `runLoop()`
- [x] 3.4 Wire same hooks in `runLoopStreaming()`

## 4. Tests

- [x] 4.1 Write tests for `SelfObservation.preTurn` with tool performance data
- [x] 4.2 Write tests for `SelfObservation.postTurn` recording events
- [x] 4.3 Write tests for `SelfObservation.detectPatterns` identifying repeated failures
- [x] 4.4 Write tests for runtime integration with observation hooks
- [x] 4.5 Write tests for runtime integration without observation hooks (no-op)
