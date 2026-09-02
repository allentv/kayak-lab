## Context

The `EventStore` currently supports session-level queries: `getEvents`, `getEventsInRange`, `getLastEvent`, `createSnapshot`, `getLatestSnapshot`. These are operational queries for event retrieval, not analytics. The `EventStoreBridge` is one-way (EventStream → EventStore), and the `AgentRuntime` has no access to the `EventStore`.

The `IEventStore` interface has 10 methods. Analytics queries would add ~8 new methods, which bloats the interface. A separate query engine layer keeps the store focused on operational concerns.

## Goals / Non-Goals

**Goals:**
- Provide analytics queries without modifying `IEventStore` interface
- Keep the query engine composable — it wraps `IEventStore`, doesn't extend it
- Support time-range filtering on all queries
- Return typed result objects, not raw event arrays

**Non-Goals:**
- Real-time streaming analytics (batch queries only)
- Cross-session correlation (future capability)
- Persistence of query results (in-memory computation)
- Modifying existing `EventStore` implementation

## Decisions

### 1. Separate `EventQueryEngine` class wrapping `IEventStore`

**Decision:** Create `IEventQueryEngine` interface and `EventQueryEngine` class that takes an `IEventStore` instance.

**Rationale:** Keeps `IEventStore` focused on operational concerns (append, retrieve, snapshot). Analytics is a read-only layer over the same data. The engine can be swapped or mocked independently.

**Alternatives considered:**
- Extending `IEventStore` with analytics methods — rejected: bloats the interface, violates SRP
- Static utility functions — rejected: no dependency injection, harder to test

### 2. Typed result objects for all queries

**Decision:** Define result types (`ToolPerformanceMetrics`, `ErrorPattern`, `SessionSummary`, etc.) instead of returning raw events.

**Rationale:** Downstream consumers (pattern analyzer, dynamic tools) need structured data, not event arrays. Typed results are self-documenting and enforce query contracts.

### 3. Time-range filtering via optional parameters

**Decision:** All query methods accept optional `startTime` and `endTime` parameters.

**Rationale:** Enables historical analysis over arbitrary windows. Default behavior (no params) returns all data — no breaking change.

### 4. Add self-observation event types

**Decision:** Add `agent.self_observed` and `agent.pattern_detected` to `EventTypes`.

**Rationale:** The agent's own observations should be recorded in the event stream for auditability and replay. These events are emitted by the self-observation layer (next spec), not the query engine itself.

## Risks / Trade-offs

### Performance on large event stores
Query engine scans events in-memory. For stores with millions of events, this could be slow. Mitigation: snapshot-based summaries (pre-computed aggregates stored as snapshots) can be added later without API changes.

### Memory overhead
Query results are new objects allocated per query. For high-frequency queries, this adds GC pressure. Mitigation: results are small, immutable objects; no caching needed at this scale.

### Interface stability
`IEventQueryEngine` is a new interface. Future changes to query semantics require updating the interface. Mitigation: start with 6 focused methods, not a generic query builder — easier to extend than to constrain.
