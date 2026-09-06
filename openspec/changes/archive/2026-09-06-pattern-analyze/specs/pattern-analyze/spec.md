## Purpose

Statistical analysis of event history for self-evolving agent behavior, providing trend detection, session efficiency analysis, and model usage patterns.

## ADDED Requirements

### Requirement: Tool Performance Trends

The pattern analyzer SHALL detect trends in tool performance over time.

#### Scenario: Detect improving tool performance
- **WHEN** the analyzer processes tool events with increasing success rates
- **THEN** the analysis report includes an "improving" trend for that tool

#### Scenario: Detect degrading tool performance
- **WHEN** the analyzer processes tool events with decreasing success rates
- **THEN** the analysis report includes a "degrading" trend for that tool

#### Scenario: Detect stable tool performance
- **WHEN** the analyzer processes tool events with consistent success rates
- **THEN** the analysis report includes a "stable" trend for that tool

### Requirement: Session Efficiency Analysis

The analyzer SHALL measure session efficiency based on tool calls and model invocations.

#### Scenario: Calculate session efficiency score
- **WHEN** the analyzer processes a session's events
- **THEN** the efficiency score reflects the ratio of productive work (tool completions) to total effort (tool starts + model calls)

#### Scenario: Compare session efficiency across sessions
- **WHEN** the analyzer processes multiple sessions
- **THEN** the report includes efficiency comparison and trend

### Requirement: Model Usage Patterns

The analyzer SHALL track model token usage patterns.

#### Scenario: Track token usage per session
- **WHEN** the analyzer processes model response events
- **THEN** the report includes total tokens, average per response, and usage trend

#### Scenario: Detect high token usage sessions
- **WHEN** a session's token usage exceeds the average by 2x
- **THEN** the report flags it as high-usage

### Requirement: Error Clustering

The analyzer SHALL group related errors into clusters.

#### Scenario: Cluster errors by tool and type
- **WHEN** the analyzer processes multiple error events
- **THEN** errors are grouped by tool name and error message pattern

#### Scenario: Rank error clusters by frequency
- **WHEN** the analyzer returns error clusters
- **THEN** clusters are ordered by frequency, most common first

### Requirement: Analysis Report

The analyzer SHALL produce a structured analysis report.

#### Scenario: Generate complete analysis report
- **WHEN** the analyzer processes event history
- **THEN** the report includes tool trends, session efficiency, model usage, and error clusters

#### Scenario: Generate partial report with limited data
- **WHEN** the analyzer has insufficient data for a section
- **THEN** that section is omitted from the report (not null or empty)
