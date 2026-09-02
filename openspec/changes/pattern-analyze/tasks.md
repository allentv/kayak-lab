## 1. Pattern Analyzer Interface

- [ ] 1.1 Create `IPatternAnalyzer` interface in `src/runtime/pattern-analyzer.ts` with analysis methods
- [ ] 1.2 Define `AnalysisReport`, `ToolTrend`, `SessionEfficiency`, `ModelUsage`, `ErrorCluster` types

## 2. Pattern Analyzer Implementation

- [ ] 2.1 Implement `PatternAnalyzer` class with `analyzeToolTrends(timeWindow?)` method
- [ ] 2.2 Implement `analyzeSessionEfficiency(sessionId?)` method
- [ ] 2.3 Implement `analyzeModelUsage(timeWindow?)` method
- [ ] 2.4 Implement `clusterErrors(timeWindow?)` method
- [ ] 2.5 Implement `generateReport(timeWindow?)` method that combines all analyses

## 3. Tests

- [ ] 3.1 Write tests for tool trend detection (improving, degrading, stable)
- [ ] 3.2 Write tests for session efficiency calculation
- [ ] 3.3 Write tests for model usage tracking
- [ ] 3.4 Write tests for error clustering
- [ ] 3.5 Write tests for analysis report generation
