## Why

The agent runtime emits events but can never read them back. The `EventStoreBridge` is one-way — events flow into the store, but the `AgentRuntime` only has `IEventStream` for appending. This means the agent has no visibility into its own history: it can't query past tool successes/failures, analyze session patterns, or learn from previous interactions. For a self-evolving agent architecture, this is the foundational gap.

## What Changes

- Add `IEventQueryEngine` interface with analytics methods on top of `IEventStore`
- Implement `EventQueryEngine` class providing: tool success/failure rates, error pattern counts, session summaries, event type distribution, and time-range queries
- Wire `EventQueryEngine` into `AgentRuntime` so the agent can query its own history
- Add new event types for self-observation: `agent.self_observed`, `agent.pattern_detected`

## Capabilities

### New Capabilities
- `event-query-engine`: Analytics query layer on top of the event store, providing tool performance metrics, error pattern analysis, and session summaries

### Modified Capabilities
- `store/persistence`: Extend `IEventStore` interface with analytics query methods (non-breaking addition)
- `core/event-stream`: Add event types for self-observation

### Unchanged Capabilities
- All projection, capability, and runtime modules remain unchanged
