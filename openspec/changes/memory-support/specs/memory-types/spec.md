## Purpose

Different types of memory for different purposes: short-term (session), long-term (persistent), episodic (interactions), semantic (facts).

## ADDED Requirements

### Requirement: Short-term Memory

Short-term memory MUST be available within a session and lost on restart.

#### Scenario: Store short-term memory

- **WHEN** a short-term memory is stored
- **THEN** it is available within the current session
- **AND** it is lost when the session ends

#### Scenario: Retrieve short-term memory

- **WHEN** a short-term memory is retrieved
- **THEN** the memory is returned if it exists within the current session
- **AND** the memory is not returned if it does not exist

### Requirement: Long-term Memory

Long-term memory MUST be persistent across sessions.

#### Scenario: Store long-term memory

- **WHEN** a long-term memory is stored
- **THEN** it is available across sessions
- **AND** it persists after the session ends

#### Scenario: Retrieve long-term memory

- **WHEN** a long-term memory is retrieved
- **THEN** the memory is returned if it exists
- **AND** the memory is not returned if it does not exist

### Requirement: Episodic Memory

Episodic memory MUST remember specific interactions.

#### Scenario: Store episodic memory

- **WHEN** an episodic memory is stored
- **THEN** it records a specific interaction (who, what, when, where)
- **AND** it is available for retrieval

#### Scenario: Retrieve episodic memory

- **WHEN** an episodic memory is retrieved
- **THEN** the memory is returned if it exists
- **AND** the memory includes the interaction details

### Requirement: Semantic Memory

Semantic memory MUST store facts and knowledge.

#### Scenario: Store semantic memory

- **WHEN** a semantic memory is stored
- **THEN** it records a fact or knowledge
- **AND** it is available for retrieval

#### Scenario: Retrieve semantic memory

- **WHEN** a semantic memory is retrieved
- **THEN** the memory is returned if it exists
- **AND** the memory includes the fact or knowledge

### Requirement: Memory Type Events

Memory type operations MUST generate events in the event stream for observability.

#### Scenario: Memory type event

- **WHEN** a memory is stored or retrieved
- **THEN** a memory_type event is emitted with memory type, operation, and timestamp
- **AND** the event is appended to the event stream