## Context

The self-observation layer provides pre/post turn hooks. The pattern analyzer provides statistical analysis. The dynamic tool registry closes the feedback loop by acting on those analyses — enabling, disabling, or modifying tools based on observed patterns.

## Goals / Non-Goals

**Goals:**
- Disable tools with repeated failures
- Re-enable tools after recovery
- Support tool lifecycle hooks (onEnable, onDisable, onUpdate)
- Map patterns to tool actions
- Persist registry state via events

**Non-Goals:**
- Automatic tool creation (tools must be pre-defined)
- Cross-session tool learning (each session starts fresh)
- Complex policy engines (simple pattern-to-action mapping)
- Modifying tool implementations (only enable/disable/update)

## Decisions

### 1. Separate `DynamicToolRegistry` wrapping `ToolRegistry`

**Decision:** Create `IDynamicToolRegistry` interface and `DynamicToolRegistry` class that wraps the existing `ToolRegistry`.

**Rationale:** Keeps the existing tool registry unchanged. The dynamic layer adds pattern-driven management on top.

### 2. Pattern-to-action mapping via simple rules

**Decision:** Use a rules engine with pattern type → action mapping.

**Rationale:** Simple, interpretable, and sufficient for the current use case. More complex policy engines can be added later.

### 3. State persistence via events

**Decision:** Record tool enable/disable state changes as events in the event stream.

**Rationale:** Leverages the existing event-sourced architecture. State can be reconstructed from event history.

### 4. Critical tool protection

**Decision:** Tools marked as `critical: true` cannot be disabled by patterns.

**Rationale:** Some tools (e.g., shell, read) are essential for agent operation. Disabling them would break the agent.

## Risks / Trade-offs

### False positives
Pattern detection may incorrectly disable working tools. Mitigation: require 3+ failures before disabling; critical tools are protected.

### State drift
Registry state may diverge from actual tool availability. Mitigation: state is reconstructed from events on startup; events are the source of truth.

### Performance overhead
Pattern analysis on every turn adds latency. Mitigation: analysis is optional and can be configured to run at intervals, not every turn.
