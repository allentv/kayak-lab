## Purpose

L2 Scenario memory provides path-addressable structured knowledge documents per agent. Agents accumulate learned patterns, how-to guides, and domain knowledge as markdown files that persist across sessions and are queryable by path prefix.

## ADDED Requirements

### Requirement: Scenario CRUD

The system MUST support creating, reading, updating, and deleting scenario memory documents scoped to an agent.

#### Scenario: Write a new scenario
- **WHEN** an agent writes a scenario at path `git.workflow` with markdown content
- **THEN** a scenario memory is created with the given path, content, and agent ID
- **AND** the `created_at` and `updated_at` timestamps are set to the current time

#### Scenario: Overwrite an existing scenario
- **WHEN** an agent writes a scenario at path `git.workflow` and a scenario already exists at that path for the same agent
- **THEN** the existing scenario's content is replaced
- **AND** the `updated_at` timestamp is set to the current time
- **AND** the `created_at` timestamp is preserved from the original

#### Scenario: Read a scenario
- **WHEN** an agent reads a scenario at path `git.workflow`
- **THEN** the system returns the scenario with its content, or null if no scenario exists at that path

#### Scenario: Delete a scenario
- **WHEN** an agent deletes a scenario at path `git.workflow`
- **THEN** the scenario is removed from storage
- **AND** subsequent reads at that path return null

### Requirement: Scenario Listing

The system MUST support listing scenarios by agent ID with optional prefix filtering.

#### Scenario: List all scenarios for an agent
- **WHEN** an agent lists scenarios without a prefix filter
- **THEN** all scenarios for that agent are returned

#### Scenario: List scenarios by prefix
- **WHEN** an agent lists scenarios with prefix `git.`
- **THEN** only scenarios whose path starts with `git.` are returned

#### Scenario: Count scenarios
- **WHEN** an agent counts its scenarios
- **THEN** the total number of scenarios for that agent is returned

### Requirement: Path Uniqueness

Scenarios MUST be uniquely identified by the combination of agent ID and path.

#### Scenario: Duplicate path rejected
- **WHEN** two different agents write scenarios at the same path `git.workflow`
- **THEN** both scenarios are stored independently (no conflict)
- **AND** each agent only sees its own scenario when reading

### Requirement: Storage Independence

Scenario storage MUST NOT interfere with existing memory types.

#### Scenario: Isolated from other memory tables
- **WHEN** scenarios are stored in the `agent_memory` table
- **THEN** the existing `memories` table is unaffected
- **AND** existing memory operations continue to work without modification
