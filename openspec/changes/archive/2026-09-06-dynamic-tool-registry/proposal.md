## Why

The self-observation and pattern-analyze layers provide insights into agent behavior, but the agent can't act on them. The dynamic tool registry closes the feedback loop: tools appear, disappear, or get modified based on observed patterns. This is the capstone that makes the agent truly self-evolving — it changes its own capabilities based on what it learns from its event history.

## What Changes

- Add `IDynamicToolRegistry` interface for pattern-driven tool management
- Implement `DynamicToolRegistry` class that enables/disables tools based on analysis reports
- Add tool lifecycle hooks: `onEnable`, `onDisable`, `onUpdate`
- Add pattern-to-tool mapping: repeated failures → disable tool, low success rate → add diagnostic tool

## Capabilities

### New Capabilities
- `dynamic-tool-registry`: Pattern-driven tool management for self-evolving agent behavior

### Modified Capabilities
- None — this change adds a new module that integrates with the existing tool registry

### Unchanged Capabilities
- Event query engine, self-observation, pattern-analyze, store, projections all remain unchanged
