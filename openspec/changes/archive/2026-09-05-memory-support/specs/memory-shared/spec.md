## Purpose

Shared memory references for sub-agents, allowing multiple sub-agents to access accumulated memory without rebuilding it, saving context window space.

## ADDED Requirements

### Requirement: Shared Context

Sub-agents MUST be able to share the same memory context.

#### Scenario: Share context between sub-agents

- **WHEN** multiple sub-agents share the same memory context
- **THEN** each sub-agent can access the shared memory
- **AND** changes to the shared memory are visible to all sub-agents

#### Scenario: Share context with sub-agent

- **WHEN** a sub-agent is created with a shared context
- **THEN** the sub-agent can access the shared memory
- **AND** the sub-agent can add to the shared memory

### Requirement: Memory Pointers

Sub-agents MUST be able to reference memories by ID.

#### Scenario: Reference memory by ID

- **WHEN** a sub-agent references a memory by ID
- **THEN** the memory is returned if it exists
- **AND** the memory is not returned if it does not exist

#### Scenario: Reference memory with context

- **WHEN** a sub-agent references a memory by ID with context
- **THEN** the memory is returned with context
- **AND** the memory is not returned if it does not exist

### Requirement: Memory Snapshots

Sub-agents MUST be able to get a snapshot of the memory state.

#### Scenario: Get memory snapshot

- **WHEN** a sub-agent requests a memory snapshot
- **THEN** the snapshot is returned with the current memory state
- **AND** the snapshot includes all memories available to the sub-agent

#### Scenario: Get memory snapshot with filter

- **WHEN** a sub-agent requests a memory snapshot with a filter
- **THEN** the snapshot is returned with the filtered memory state
- **AND** the snapshot includes only the memories matching the filter

### Requirement: Shared Memory Events

Shared memory operations MUST generate events in the event stream for observability.

#### Scenario: Shared memory event

- **WHEN** a shared memory operation is performed
- **THEN** a shared_memory event is emitted with operation type and timestamp
- **AND** the event is appended to the event stream