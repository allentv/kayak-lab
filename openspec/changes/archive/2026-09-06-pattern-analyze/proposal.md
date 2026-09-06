## Why

The self-observation layer (from the previous change) provides basic pattern detection for repeated failures and low success rates. However, it lacks deeper statistical analysis: trend detection, session duration analysis, model usage patterns, and cross-session correlation. The pattern analyzer adds this intelligence layer, enabling the agent to understand not just what happened, but why and how to improve.

## What Changes

- Add `IPatternAnalyzer` interface with statistical analysis methods
- Implement `PatternAnalyzer` class with trend detection, session analysis, and model usage patterns
- Add pattern types: tool performance trends, session efficiency, model token usage, error clustering
- Add `AnalysisReport` type for structured analysis results

## Capabilities

### New Capabilities
- `pattern-analyze`: Statistical analysis of event history for self-evolving agent behavior

### Modified Capabilities
- None — this change adds a new module that plugs into the existing query engine

### Unchanged Capabilities
- Event query engine, self-observation, store, projections all remain unchanged
