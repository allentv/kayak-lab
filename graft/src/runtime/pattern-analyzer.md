# src/runtime/pattern-analyzer.ts · [[runtime-orchestration]] [[self-observation-and-pattern-detection]]

- TrendDirection · type · L16-L16 — type TrendDirection = "improving" | "degrading" | "stable" | "insufficient_data";
- ToolTrend · interface · L19-L25 — interface ToolTrend
- SessionEfficiency · interface · L28-L34 — interface SessionEfficiency
- ModelUsage · interface · L37-L42 — interface ModelUsage
- ErrorCluster · interface · L45-L50 — interface ErrorCluster
- AnalysisReport · interface · L53-L59 — interface AnalysisReport
- IPatternAnalyzer · interface · L65-L71 — interface IPatternAnalyzer
- PatternAnalyzerOptions · interface · L77-L82 — interface PatternAnalyzerOptions
- PatternAnalyzer · class · L84-L259 — class PatternAnalyzer implements IPatternAnalyzer
- constructor · method · L88-L94 — constructor( private readonly queryEngine: IEventQueryEngine, options?: PatternAnalyzerOptions, )
- analyzeToolTrends · method · L96-L124 — analyzeToolTrends(range?: TimeRange): ToolTrend[]
- analyzeSessionEfficiency · method · L126-L148 — analyzeSessionEfficiency(sessionIds?: string[]): SessionEfficiency[]
- analyzeModelUsage · method · L150-L173 — analyzeModelUsage(_range?: TimeRange): ModelUsage
- clusterErrors · method · L175-L185 — clusterErrors(range?: TimeRange): ErrorCluster[]
- generateReport · method · L187-L202 — generateReport(range?: TimeRange): AnalysisReport
- writePatternScenarios · method · L207-L258 — private writePatternScenarios(report: AnalysisReport): void
