## Context

The `EventQueryEngine` (from `event-query-engine` change) provides analytics queries on the event store. The `AgentRuntime` currently has no access to the query engine — it only has `IEventStream` for appending events. The self-observation layer bridges this gap by injecting query engine access into the runtime.

## Goals / Non-Goals

**Goals:**
- Agent can query its own history before/after each turn
- Observation hooks are optional — runtime works without them
- Observations are recorded as events for auditability
- Minimal coupling — observation is a thin wrapper over `EventQueryEngine`

**Non-Goals:**
- Modifying the agent's model prompts based on observations (that's the pattern-analyze layer)
- Real-time streaming observations (batch only)
- Persisting observation results beyond event storage

## Decisions

### 1. Separate `SelfObservation` class wrapping `EventQueryEngine`

**Decision:** Create `ISelfObservation` interface and `SelfObservation` class that takes an `EventQueryEngine` instance.

**Rationale:** Keeps the query engine focused on analytics. Self-observation adds runtime integration (when to observe, what to surface) on top of the same data.

### 2. Hook-based integration with AgentRuntime

**Decision:** `AgentRuntime` accepts an optional `ISelfObservation` instance. When present, it calls `preTurn()` before each model call and `postTurn()` after each model call.

**Rationale:** Follows the existing callback pattern (`AgentEvents`). Optional — no breaking change to runtime construction.

### 3. Observations recorded as events

**Decision:** `postTurn()` emits `agent.self_observed` events to the event stream.

**Rationale:** Self-observations should be part of the event history for auditability and replay. The agent can later query its own observations.

### 4. Lightweight observation context

**Decision:** Pre-turn observation returns a `ObservationContext` object with tool performance, error patterns, and session summary — not raw events.

**Rationale:** The agent (or downstream pattern analyzer) needs structured data, not event arrays. Keep the observation surface small and focused.

## Risks / Trade-offs

### Performance overhead
Querying the event store on every turn adds latency. Mitigation: queries are in-memory scans of small event sets; for large stores, snapshot-based summaries can be added later.

### Observation fatigue
Too many observations can distract the agent. Mitigation: observation context is opt-in and can be filtered by the downstream consumer.

### Coupling to EventQueryEngine
The observation layer depends on the query engine. Mitigation: interface-based dependency injection — the query engine can be mocked or replaced.
