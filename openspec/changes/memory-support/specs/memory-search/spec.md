## Purpose

Memory search with both semantic and keyword capabilities, allowing agents to find relevant memories efficiently.

## ADDED Requirements

### Requirement: Semantic Search

Memory search MUST support semantic search (vector similarity).

#### Scenario: Semantic search by query

- **WHEN** a semantic search is performed with a query
- **THEN** the search returns memories that are semantically similar to the query
- **AND** the results are ranked by relevance

#### Scenario: Semantic search with filter

- **WHEN** a semantic search is performed with a filter
- **THEN** the search returns memories that match the filter and are semantically similar to the query
- **AND** the results are ranked by relevance

### Requirement: Keyword Search

Memory search MUST support keyword search.

#### Scenario: Keyword search by query

- **WHEN** a keyword search is performed with a query
- **THEN** the search returns memories that contain the query keywords
- **AND** the results are ranked by relevance

#### Scenario: Keyword search with filter

- **WHEN** a keyword search is performed with a filter
- **THEN** the search returns memories that match the filter and contain the query keywords
- **AND** the results are ranked by relevance

### Requirement: Combined Search

Memory search MUST support combined semantic and keyword search.

#### Scenario: Combined search

- **WHEN** a combined search is performed with a query
- **THEN** the search returns memories that are semantically similar to the query and contain the query keywords
- **AND** the results are ranked by relevance

#### Scenario: Combined search with filter

- **WHEN** a combined search is performed with a filter
- **THEN** the search returns memories that match the filter and are semantically similar to the query and contain the query keywords
- **AND** the results are ranked by relevance

### Requirement: Search Configuration

Memory search MUST support configurable search parameters.

#### Scenario: Configure search parameters

- **WHEN** memory search is configured
- **THEN** the search parameters are set (e.g., max results, relevance threshold)
- **AND** the parameters are used for search

#### Scenario: Configure search scope

- **WHEN** memory search is configured
- **THEN** the search scope is set (e.g., session, all sessions)
- **AND** the scope is used for search

### Requirement: Search Events

Memory search operations MUST generate events in the event stream for observability.

#### Scenario: Search event

- **WHEN** a memory search is performed
- **THEN** a memory_search event is emitted with search criteria and timestamp
- **AND** the event is appended to the event stream

#### Scenario: Search result event

- **WHEN** a memory search returns results
- **THEN** a memory_search_result event is emitted with result count and timestamp
- **AND** the event is appended to the event stream