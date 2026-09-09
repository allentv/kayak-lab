## Purpose

Extends BaseEvent with a `causal_parents` field linking each event to the events that caused it, enabling graph queries over event dependencies and downstream provenance tracking.

## ADDED Requirements

### Requirement: Causal Parent Field

BaseEvent MUST include an optional `causal_parents` field.

#### Scenario: New events default to empty causal_parents
- **WHEN** an event is appended without specifying causal_parents
- **THEN** the event is stored with `causal_parents: []`

#### Scenario: Event specifies causal parents
- **WHEN** an event is appended with `causal_parents: ["event-id-1", "event-id-2"]`
- **THEN** the event is stored with those parent references

#### Scenario: Backward compatibility with existing events
- **WHEN** the system loads events from disk that lack the causal_parents field
- **THEN** those events are treated as having `causal_parents: []`

### Requirement: Causal Graph Construction

EventStore MUST construct a directed dependency graph from flat event sequences.

#### Scenario: Build graph from session events
- **WHEN** `buildCausalGraph(sessionId)` is called
- **THEN** the system returns an adjacency list where nodes are events and edges are causal parent → child relationships

#### Scenario: Root events identified
- **WHEN** the causal graph is constructed
- **THEN** events with empty causal_parents are identified as root events

#### Scenario: Leaf events identified
- **WHEN** the causal graph is constructed
- **THEN** events not referenced as parents by any other event are identified as leaf events

### Requirement: Dependency-Aware Queries

EventStore MUST support queries using causal relationships.

#### Scenario: Find downstream events
- **WHEN** `findDownstream(eventId)` is called
- **THEN** the system returns all events reachable by following causal edges forward from the given event

#### Scenario: Find independent chains
- **WHEN** `findIndependentChains(sessionId)` is called
- **THEN** the system returns event chains that share no common ancestor (parallel tool calls from the same model response)

#### Scenario: Detect concurrent file modifications
- **WHEN** two tool execution events modify the same file and are causally independent
- **THEN** the system flags them as potentially conflicting

### Requirement: Event Appender Integration

EventStream MUST support causal parent specification.

#### Scenario: Append event with causal parents
- **WHEN** `stream.append(event, { causalParents: ["id-1"] })` is called
- **THEN** the event is stored with the specified causal parents

#### Scenario: Auto-infer causal parents
- **WHEN** an event is appended during an active tool call (tool result event)
- **THEN** the system can optionally auto-set causal_parents to the tool invocation event ID
