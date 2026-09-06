## Context

The `EventQueryEngine` provides raw analytics queries (tool performance, error patterns, session summaries). The `SelfObservation` layer adds basic pattern detection (repeated failures, low success rates). The pattern analyzer adds deeper statistical analysis on top of the same data.

## Goals / Non-Goals

**Goals:**
- Detect trends in tool performance (improving, degrading, stable)
- Measure session efficiency based on productive work ratio
- Track model token usage patterns
- Cluster related errors by tool and type
- Produce structured analysis reports

**Non-Goals:**
- Predictive modeling (future behavior prediction)
- Cross-session correlation (linking patterns across sessions)
- Real-time analysis (batch only)
- Modifying agent behavior based on analysis (that's the dynamic-tool-registry layer)

## Decisions

### 1. Separate `PatternAnalyzer` class wrapping `EventQueryEngine`

**Decision:** Create `IPatternAnalyzer` interface and `PatternAnalyzer` class that takes an `EventQueryEngine` instance.

**Rationale:** Keeps the query engine focused on raw analytics. The analyzer adds statistical interpretation on top of the same data.

### 2. Trend detection via linear regression

**Decision:** Use simple linear regression to detect trends in tool success rates over time windows.

**Rationale:** Linear regression is lightweight, interpretable, and sufficient for detecting improving/degrading/stable trends. More complex models (ARIMA, etc.) are overkill for this use case.

### 3. Session efficiency as productive work ratio

**Decision:** Efficiency = (tool completions) / (tool starts + model invocations).

**Rationale:** Measures how much of the session's effort resulted in completed work. Low efficiency indicates wasted effort (failed tools, excessive model calls).

### 4. Error clustering by tool + message pattern

**Decision:** Group errors by tool name and error message prefix (first 50 chars).

**Rationale:** Errors from the same tool with similar messages are likely related. Prefix matching is simple and effective for grouping.

### 5. Structured analysis report

**Decision:** Return `AnalysisReport` object with optional sections (tool trends, session efficiency, model usage, error clusters).

**Rationale:** Downstream consumers (dynamic-tool-registry) need structured data. Optional sections handle insufficient data gracefully.

## Risks / Trade-offs

### Statistical accuracy
Linear regression on small datasets can be misleading. Mitigation: require minimum data points (5+) before declaring a trend; otherwise report "insufficient data".

### Performance on large datasets
Trend detection scans all tool events. Mitigation: analysis is batch-only, not real-time; for large stores, snapshot-based summaries can be added later.

### Over-analysis
Too many patterns can overwhelm the agent. Mitigation: report only significant trends (p < 0.1 or equivalent threshold); keep the report focused.
