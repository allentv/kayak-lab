## Purpose

Tracks the causal chain of agent reasoning per session — Goal → Exploration → Commitment → Verification → PatchProposal — enabling "why did the agent do X?" queries and decision audit trails.

## ADDED Requirements

### Requirement: Provenance Node Types

The system MUST support five node types: Goal, Exploration, Commitment, Verification, and PatchProposal.

#### Scenario: Goal node creation on user input
- **WHEN** the agent receives user input
- **THEN** a Goal node is created with the user's request text, session ID, and timestamp

#### Scenario: Exploration node creation on read-only tool calls
- **WHEN** a tool call is classified as exploration (read, grep, glob, list_directory)
- **THEN** an Exploration node is created with the tool name, parameters, and a causal edge from the current Goal or most recent Commitment

#### Scenario: Commitment node creation on file-modifying tool calls
- **WHEN** a tool call is classified as commitment (edit, write, create_file)
- **THEN** a Commitment node is created with the file paths modified and a causal edge from preceding Exploration nodes in the same reasoning chain

#### Scenario: Verification node creation on validation tool calls
- **WHEN** a tool call is classified as verification (bash with test/check/lint keywords)
- **THEN** a Verification node is created with the command and a causal edge from the most recent Commitment

#### Scenario: PatchProposal node creation at turn end
- **WHEN** the agent turn ends with a model response
- **THEN** a PatchProposal node is created summarizing changes made, linked to all Commitments and Verifications in the turn

### Requirement: Tool Call Classification

A rule-based classifier MUST map tool names to provenance categories.

#### Scenario: Read-only tools classified as Exploration
- **WHEN** a tool call uses read, grep, glob, or list_directory
- **THEN** the classifier returns "exploration"

#### Scenario: File-modifying tools classified as Commitment
- **WHEN** a tool call uses edit, write, or create_file
- **THEN** the classifier returns "commitment"

#### Scenario: Test/validation tools classified as Verification
- **WHEN** a bash tool call contains test, check, or lint in the command
- **THEN** the classifier returns "verification"

#### Scenario: Build/install tools classified as Execution
- **WHEN** a bash tool call contains install or build in the command
- **THEN** the classifier returns "execution"

#### Scenario: Unclassified tools default to Exploration
- **WHEN** a tool call doesn't match any classification rule
- **THEN** the classifier returns "exploration" as the default

### Requirement: Provenance Edge Construction

Edges MUST encode causal dependencies between nodes forming a DAG within each session.

#### Scenario: Exploration links to active Goal
- **WHEN** an Exploration node is created while a Goal is active
- **THEN** a directed edge exists from the Goal to the Exploration

#### Scenario: Commitment links to preceding Explorations
- **WHEN** a Commitment node is created
- **THEN** directed edges exist from all Explorations in the current reasoning chain to the Commitment

#### Scenario: Verification links to preceding Commitment
- **WHEN** a Verification node is created
- **THEN** a directed edge exists from the most recent Commitment to the Verification

#### Scenario: PatchProposal aggregates turn
- **WHEN** a PatchProposal is created at turn end
- **THEN** directed edges exist from all Commitments and Verifications in the turn to the PatchProposal

### Requirement: Provenance Node Metadata

Each node MUST carry structured metadata appropriate to its type.

#### Scenario: Common metadata fields
- **WHEN** any provenance node is created
- **THEN** it includes: node_id (unique), node_type, session_id, timestamp, and causal_parents (array of parent node IDs)

#### Scenario: Tool-related nodes include tool references
- **WHEN** an Exploration or Commitment node is created from a tool call
- **THEN** it includes tool_name, tool_parameters (redacted), and tool_call_id

#### Scenario: PatchProposal includes summary
- **WHEN** a PatchProposal is created
- **THEN** it includes files_changed (count), tool_calls_made (count), and turn_number

### Requirement: Provenance Graph Persistence

Provenance graphs MUST be persisted alongside session events.

#### Scenario: Graph written at turn end
- **WHEN** a turn ends and a PatchProposal node is created
- **THEN** the complete provenance graph is written to the session's data directory as JSON

#### Scenario: Graph loaded on session resume
- **WHEN** a session is resumed
- **THEN** the provenance graph is loaded from disk and available for queries

#### Scenario: Graph garbage collected on session completion
- **WHEN** a session transitions to "completed" or "cancelled"
- **THEN** the in-memory provenance graph is released (persisted copy remains)

### Requirement: Provenance Graph Queries

The system MUST support traversal queries over the provenance graph.

#### Scenario: Trace causal chain for a tool call
- **WHEN** a query asks for the causal chain leading to a specific tool call
- **THEN** the system returns the ordered path of nodes from the originating Goal through to the tool call

#### Scenario: Find all explorations leading to a commitment
- **WHEN** a query asks for all explorations that preceded a specific commitment
- **THEN** the system returns all Exploration nodes reachable by following edges backward from the Commitment

#### Scenario: Query by node type
- **WHEN** a query filters by node type (e.g., "all Goals in this session")
- **THEN** the system returns all nodes of that type with their metadata
