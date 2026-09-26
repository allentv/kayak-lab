# src/analysis.ts · [[event-analysis-optimization]] [[event-sourcing-core]]

- SessionSummary · interface · L14-L21 — Summarizes a user session with timing, event count, and state information for analysis.
- CommandStats · interface · L23-L30 — Tracks usage statistics for individual commands including execution frequency, duration, and error rates.
- AnalysisResult · interface · L32-L39 — Aggregates analysis results including session summaries, command statistics, errors, and improvement suggestions.
- analyzeSessions · function · L48-L173 — Analyzes multiple user sessions to compute statistics, identify patterns, and generate improvement suggestions.
- generateSuggestions · function · L178-L233 — Generates actionable improvement suggestions by detecting patterns like repeated commands, slow executions, and error-prone operations.
- formatAnalysisReport · function · L238-L307 — Formats analysis results into a human-readable terminal report with colored sections and structured data presentation.
- formatDuration · function · L313-L317 — Formats millisecond durations into human-readable units (ms, seconds, minutes) for display in reports.
