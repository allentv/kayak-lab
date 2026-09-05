## Purpose

On-demand memory retrieval that does not inject memories into the context window, preserving context space for agents.

## ADDED Requirements

### Requirement: On-demand Memory Retrieval

Memory retrieval MUST be on-demand, not automatic context injection.

#### Scenario: Retrieve memory on-demand

- **WHEN** an agent requests memory retrieval
- **THEN** the memory is returned to the agent
- **AND** the memory is not automatically injected into the context window

#### Scenario: Retrieve memory with query

- **WHEN** an agent requests memory retrieval with a query
- **THEN** the memory is returned based on the query
- **AND** the memory is not automatically injected into the context window

### Requirement: Memory Retrieval Configuration

Memory retrieval MUST support configurable retrieval parameters.

#### Scenario: Configure retrieval parameters

- **WHEN** memory retrieval is configured
- **THEN** the retrieval parameters are set (e.g., max results, relevance threshold)
- **AND** the parameters are used for retrieval

#### Scenario: Configure retrieval scope

- **WHEN** memory retrieval is configured
- **THEN** the retrieval scope is set (e.g., session, all sessions)
- **AND** the scope is used for retrieval

### Requirement: Memory Retrieval Events

Memory retrieval operations MUST generate events in the event stream for observability.

#### Scenario: Memory retrieval event

- **WHEN** memory is retrieved
- **THEN** a memory_retrieved event is emitted with retrieval parameters and timestamp
- **AND** the event is appended to the event stream