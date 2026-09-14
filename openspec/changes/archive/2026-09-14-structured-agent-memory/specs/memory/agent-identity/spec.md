## Purpose

L3 Core memory provides a singleton structured identity document per agent. It stores stable agent attributes (name, goals, constraints, personality) that are loaded into the system prompt at session start, giving agents persistent identity across sessions.

## ADDED Requirements

### Requirement: Core Memory Singleton

Each agent MUST have exactly one core memory document. Writing to core memory uses upsert semantics.

#### Scenario: Create core memory
- **WHEN** an agent writes core memory with sections `{ name: "Kayak", goals: "Assist users", constraints: "Never fabricate" }`
- **THEN** a core memory document is created for that agent
- **AND** the `created_at` and `updated_at` timestamps are set to the current time

#### Scenario: Update core memory
- **WHEN** an agent writes core memory and a core memory already exists for that agent
- **THEN** the existing sections are replaced with the new content
- **AND** the `updated_at` timestamp is set to the current time
- **AND** the `created_at` timestamp is preserved

#### Scenario: Read core memory
- **WHEN** an agent reads its core memory
- **THEN** the system returns the core memory with its sections, or null if none exists

### Requirement: Section Structure

Core memory sections are key-value pairs where keys are section names and values are markdown content.

#### Scenario: Arbitrary section keys
- **WHEN** an agent writes core memory with sections `{ name: "...", goals: "...", custom_section: "..." }`
- **THEN** all section keys are preserved as-is
- **AND** section values support markdown formatting

### Requirement: Agent Isolation

Core memory MUST be scoped to a single agent. Different agents have independent core memories.

#### Scenario: Independent core memories
- **WHEN** two agents each write their own core memory
- **THEN** each agent's read returns only its own sections
- **AND** one agent's writes do not affect the other's core memory

### Requirement: Storage Independence

Core memory storage MUST NOT interfere with existing memory types.

#### Scenario: Isolated from other memory tables
- **WHEN** core memory is stored in the `agent_memory` table
- **THEN** the existing `memories` table is unaffected
- **AND** existing memory operations continue to work without modification
