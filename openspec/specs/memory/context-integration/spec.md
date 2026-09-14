## Purpose

Integrates L2 (Scenario) and L3 (Core) structured memory into the runtime context pipeline. L3 Core is loaded into the system prompt at session start, L2 Scenarios are written by self-evolution, and both are included in memory retrieval results.

## ADDED Requirements

### Requirement: L3 Core Memory in System Prompt

AgentRuntime MUST load CoreMemory for the agent at session start and inject its sections into the system prompt.

#### Scenario: Core memory loaded at session start
- **WHEN** `AgentRuntime.start()` is called with an agent ID
- **THEN** the runtime calls `readCore(agentId)` on the memory storage
- **AND** if core memory exists, its sections are appended to the system prompt as structured text
- **AND** if no core memory exists, the system prompt is unchanged

#### Scenario: Core memory sections format
- **WHEN** core memory has sections `{ name: "Kayak", goals: "Assist users", constraints: "Never fabricate" }`
- **THEN** the system prompt includes a section formatted as `## Agent Identity\n- name: Kayak\n- goals: Assist users\n- constraints: Never fabricate`
- **AND** this section is appended after the base system prompt, before user messages

#### Scenario: Core memory not injected into context budget
- **WHEN** the ProvenanceContextManager enforces token budget
- **THEN** the L3 core memory section is part of the system prompt budget (not counted in memoriesPercent)

### Requirement: PatternAnalyzer Writes L2 Scenarios

PatternAnalyzer MUST write scenario files when it detects meaningful patterns.

#### Scenario: Tool failure pattern detected
- **WHEN** `PatternAnalyzer.generateReport()` detects a tool with `direction: "degrading"`
- **THEN** a scenario is written at `patterns.tool-failure.<toolName>` with the trend details
- **AND** the scenario content includes tool name, success rate, and degradation magnitude

#### Scenario: Session efficiency pattern detected
- **WHEN** `PatternAnalyzer.generateReport()` detects sessions with `score < 0.3`
- **THEN** a scenario is written at `patterns.efficiency.low-score` with the session IDs and scores
- **AND** the scenario content includes the efficiency score and contributing factors

#### Scenario: No pattern detected
- **WHEN** `PatternAnalyzer.generateReport()` detects no meaningful patterns
- **THEN** no scenarios are written

### Requirement: MemoryRetrieval Includes L2/L3

MemoryRetrieval MUST return L2 Scenarios and L3 Core alongside standard memories.

#### Scenario: Retrieve with L2/L3 types
- **WHEN** `MemoryRetrieval.retrieve()` is called with no type filter
- **THEN** results include `ScenarioMemory` and `CoreMemory` entries alongside `SemanticMemory`, `EpisodicMemory`, etc.
- **AND** L2/L3 entries are scored by relevance (content match) and provenance

#### Scenario: Retrieve with L2 type filter
- **WHEN** `MemoryRetrieval.retrieve()` is called with `type: "scenario"`
- **THEN** only `ScenarioMemory` entries are returned

#### Scenario: Retrieve with L3 type filter
- **WHEN** `MemoryRetrieval.retrieve()` is called with `type: "core"`
- **THEN** only `CoreMemory` entries are returned

### Requirement: Context Budget Management

L2/L3 content MUST be included in the context window with proper token budget enforcement.

#### Scenario: L2 scenarios within budget
- **WHEN** the ProvenanceContextManager assembles context
- **THEN** L2 scenario content is included in the `memoriesPercent` bucket
- **AND** the total context does not exceed `maxTokens` (9000)

#### Scenario: L3 core in system prompt budget
- **WHEN** L3 core memory is injected into the system prompt
- **THEN** it is counted in the system prompt token budget (not in memoriesPercent)
- **AND** the total system prompt tokens do not exceed the system budget