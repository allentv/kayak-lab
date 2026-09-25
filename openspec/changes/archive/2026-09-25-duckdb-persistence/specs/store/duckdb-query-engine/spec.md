## Purpose

SQL-based analytical query layer replacing hand-rolled JavaScript aggregation, supporting dashboard queries, time-series analysis, and cross-session joins via DuckDB's columnar engine.

## ADDED Requirements

### Requirement: Tool performance metrics

The query engine MUST provide tool performance metrics across all sessions.

#### Scenario: Aggregate tool usage
- **WHEN** tool performance metrics are requested
- **THEN** the query returns tool_name, total_invocations, success_count, failure_count, success_rate, and average_duration_ms for each tool

#### Scenario: Filter by time range
- **WHEN** tool performance metrics are requested with a time range
- **THEN** only events within the time range are included in the aggregation

### Requirement: Session summaries

The query engine MUST provide session summary statistics.

#### Scenario: Session event counts
- **WHEN** session summaries are requested
- **THEN** the query returns session_id, total_events, started_at, last_event_at, duration_ms, tool_call_count, and model_invocation_count for each session

#### Scenario: Limit results
- **WHEN** session summaries are requested with a limit
- **THEN** only the specified number of sessions are returned

### Requirement: Event type distribution

The query engine MUST provide event type distribution across all sessions.

#### Scenario: Count by event type
- **WHEN** event type distribution is requested
- **THEN** the query returns event_type, count, and percentage for each event type

#### Scenario: Filter by session
- **WHEN** event type distribution is requested for a specific session
- **THEN** only events from that session are included

### Requirement: Error pattern analysis

The query engine MUST identify error patterns across sessions.

#### Scenario: Group errors by type and tool
- **WHEN** error patterns are requested
- **THEN** the query returns error_type, tool_name, count, and last_occurrence for each error pattern

#### Scenario: Sort by frequency
- **WHEN** error patterns are requested
- **THEN** results are sorted by count in descending order

### Requirement: Time-series aggregation

The query engine MUST support time-series aggregation for dashboards.

#### Scenario: Hourly event volume
- **WHEN** hourly event volume is requested
- **THEN** the query returns hour, event_count, and error_count for each hour

#### Scenario: Daily aggregation
- **WHEN** daily event volume is requested
- **THEN** the query returns date, event_count, and error_count for each day

#### Scenario: Custom time granularity
- **WHEN** event volume is requested with a custom granularity (minute, hour, day, week)
- **THEN** events are aggregated at the specified granularity

### Requirement: Cross-table joins

The query engine MUST support joins across events and memories.

#### Scenario: Sessions with related memories
- **WHEN** sessions with memories are requested
- **THEN** the query returns session_id, event_count, memory_count, and memory_types for sessions that have associated memories

#### Scenario: Events enriched with memories
- **WHEN** events are requested with memory context
- **THEN** each event includes related memory information via SQL JOIN

### Requirement: Pivot table support

The query engine MUST support pivot table queries for multi-dimensional analysis.

#### Scenario: Tool usage by session pivot
- **WHEN** tool usage by session is requested
- **THEN** the query returns a pivot table with session_id as rows and tool names as columns, with call counts as values

#### Scenario: Custom pivot dimensions
- **WHEN** a custom pivot is requested
- **THEN** the query supports arbitrary row and column dimensions

### Requirement: Window function analytics

The query engine MUST support window function analytics for rolling statistics.

#### Scenario: Rolling error rate
- **WHEN** rolling error rate is requested for a session
- **THEN** the query returns event_num, is_error, and rolling_error_rate_10 (10-event moving average)

#### Scenario: Custom window size
- **WHEN** rolling statistics are requested with a custom window size
- **THEN** the moving average uses the specified window size

### Requirement: API endpoint integration

The query engine MUST expose queries via HTTP API endpoints for dashboard consumption.

#### Scenario: Query via POST
- **WHEN** a SQL query is sent to `/api/query` via POST
- **THEN** the query is executed against DuckDB and results returned as JSON

#### Scenario: Query via GET
- **WHEN** a SQL query is sent to `/api/query?sql=...` via GET
- **THEN** the query is executed against DuckDB and results returned as JSON

#### Scenario: Error handling
- **WHEN** a query fails
- **THEN** the API returns a 500 status with an error message

### Requirement: Performance benchmarks

The query engine MUST meet performance targets for analytical queries.

#### Scenario: Bulk insert rate
- **WHEN** 10,000 events are inserted in batches
- **THEN** the insert completes in under 1 second (target: 20k+ events/sec)

#### Scenario: Aggregation query latency
- **WHEN** a tool performance aggregation is run over 10,000 events
- **THEN** the query completes in under 100ms

#### Scenario: Join query latency
- **WHEN** a cross-table join between events and memories is run
- **THEN** the query completes in under 200ms
