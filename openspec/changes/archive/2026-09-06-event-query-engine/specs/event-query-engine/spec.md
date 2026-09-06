## Purpose

Analytics query layer on top of the event store, providing tool performance metrics, error pattern analysis, and session summaries for self-evolving agent behavior.

## ADDED Requirements

### Requirement: Tool Performance Metrics

The query engine SHALL provide tool success/failure rates over configurable time windows.

#### Scenario: Query tool success rate
- **WHEN** the agent queries tool performance for a specific tool name
- **THEN** the engine returns total invocations, success count, failure count, and success rate percentage

#### Scenario: Query tool performance over time range
- **WHEN** the agent queries tool performance with a start and end timestamp
- **THEN** the engine returns metrics only for events within that time range

#### Scenario: Query tool performance with no data
- **WHEN** the agent queries tool performance for a tool that has no events
- **THEN** the engine returns zero counts and 0% success rate

### Requirement: Error Pattern Analysis

The query engine SHALL identify and count error patterns across sessions.

#### Scenario: Query error patterns by type
- **WHEN** the agent queries error patterns
- **THEN** the engine returns a list of error types with their occurrence counts, ordered by frequency

#### Scenario: Query error patterns for specific tool
- **WHEN** the agent queries error patterns filtered by tool name
- **THEN** the engine returns only errors related to that tool

### Requirement: Session Summaries

The query engine SHALL provide summaries of past sessions.

#### Scenario: Query session summary
- **WHEN** the agent queries a session summary by session ID
- **THEN** the engine returns total events, duration, tool calls count, model invocations count, and completion status

#### Scenario: Query recent sessions
- **WHEN** the agent queries recent sessions with a limit
- **THEN** the engine returns the most recent N sessions with their summaries

### Requirement: Event Type Distribution

The query engine SHALL provide distribution of event types across sessions.

#### Scenario: Query event type distribution
- **WHEN** the agent queries event type distribution
- **THEN** the engine returns each event type with its count, ordered by frequency

### Requirement: Cross-Session Analytics

The query engine SHALL support analytics across multiple sessions.

#### Scenario: Query aggregate tool usage
- **WHEN** the agent queries aggregate tool usage across all sessions
- **THEN** the engine returns total tool invocations, unique tools used, and per-tool breakdown

#### Scenario: Query session duration trends
- **WHEN** the agent queries session duration trends
- **THEN** the engine returns average, min, and max session durations
