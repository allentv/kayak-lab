## Why

The agent runtime emits events but has no mechanism to read its own history. The `EventQueryEngine` (from the previous change) provides analytics queries, but the agent runtime doesn't use them. The agent needs hooks that let it observe its own past behavior before and after each turn — the foundation for self-awareness and self-evolution.

## What Changes

- Add `ISelfObservation` interface with hooks for pre-turn and post-turn observation
- Implement `SelfObservation` class that queries the `EventQueryEngine` and surfaces insights to the agent
- Add `selfObservation` hook to `AgentRuntime` that runs before/after each model call
- Add observation types: tool performance summary, error patterns, session context

## Capabilities

### New Capabilities
- `self-observe`: Agent runtime hooks that read own event history before/after turns, providing self-awareness

### Modified Capabilities
- None — this change adds a new module that plugs into the existing runtime

### Unchanged Capabilities
- Event query engine, store, projections, capabilities all remain unchanged
