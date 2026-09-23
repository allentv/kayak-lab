# Agent Profiles Specification

## Purpose

Fully configurable sub-agent profiles with progressive builder-pattern configuration, dynamic model routing, and orchestrator-driven profile selection. Enables spawning sub-agents with customizable defaults for model, thinking level, tools, context strategy, and behavioral guidelines — without editing static definition files.

## Requirements

### Requirement: Agent Profile Definition

The system MUST support named agent profiles that bundle configuration defaults.

#### Scenario: Define a profile
- **WHEN** a profile is registered with a name and configuration
- **THEN** the profile is available for selection by orchestrator agents

#### Scenario: Profile fields
- **WHEN** a profile is defined
- **THEN** it MAY include any combination of: `model`, `thinkingLevel`, `tools`, `context`, `systemPrompt`, `maxTokens`, `temperature`

#### Scenario: Profile inheritance
- **WHEN** a profile specifies only some fields
- **THEN** unspecified fields fall back to session defaults

### Requirement: Profile Registry

The system MUST provide a registry for managing profiles at runtime.

#### Scenario: Register a profile
- **WHEN** `registerProfile(profile)` is called
- **THEN** the profile is stored and available for lookup by name

#### Scenario: Unregister a profile
- **WHEN** `unregisterProfile(name)` is called
- **THEN** the profile is removed from the registry

#### Scenario: List profiles
- **WHEN** `listProfiles()` is called
- **THEN** all registered profiles are returned

#### Scenario: Get profile by name
- **WHEN** `getProfile(name)` is called
- **THEN** the matching profile is returned, or `undefined` if not found

### Requirement: Builder Pattern for Spawn Configuration

The system MUST support progressive configuration of sub-agent spawn parameters via a builder.

#### Scenario: Build spawn config from profile
- **WHEN** `createSpawnConfig().fromProfile("reviewer").build()` is called
- **THEN** a `SpawnConfig` is produced with the profile's defaults applied

#### Scenario: Override profile fields
- **WHEN** builder methods are chained after `fromProfile()`
- **THEN** explicit overrides take precedence over profile defaults

#### Scenario: Build without profile
- **WHEN** `createSpawnConfig().withModel("gpt-4").build()` is called
- **THEN** a `SpawnConfig` is produced with only the explicitly set fields

### Requirement: Orchestrator-Driven Profile Selection

The orchestrator agent MUST be able to select and configure sub-agent profiles at runtime.

#### Scenario: Orchestrator selects profile by name
- **WHEN** the orchestrator calls `spawn({ profile: "reviewer", task: "..." })`
- **THEN** the sub-agent starts with the "reviewer" profile's configuration

#### Scenario: Orchestrator overrides profile fields
- **WHEN** the orchestrator calls `spawn({ profile: "reviewer", model: "gpt-4", task: "..." })`
- **THEN** the sub-agent uses "reviewer" defaults with the model overridden to "gpt-4"

#### Scenario: Orchestrator passes context to sub-agent
- **WHEN** the orchestrator calls `spawn({ profile: "reviewer", context: "Focus on auth module", task: "..." })`
- **THEN** the sub-agent receives the context in its system prompt

### Requirement: Dynamic Model Routing via Hooks

The `before_model_call` hook MUST be able to set the model for the current invocation, and the change MUST propagate to the model request.

#### Scenario: Hook sets model
- **WHEN** a `before_model_call` hook sets `context.model = "anthropic/claude-sonnet"`
- **THEN** the model request is invoked with that model

#### Scenario: Hook sets model from profile
- **WHEN** a `before_model_call` hook reads a profile name from context and sets the model accordingly
- **THEN** the model request uses the profile's model

#### Scenario: No model set
- **WHEN** no hook sets the model and no profile specifies one
- **THEN** the session's default model is used (current behavior)

### Requirement: Profile-Aware Tool Sets

Profiles MAY restrict or expand the available tool set for a sub-agent.

#### Scenario: Profile restricts tools
- **WHEN** a profile specifies `tools: ["read", "grep", "glob"]`
- **THEN** the sub-agent only has access to those tools

#### Scenario: Profile uses default tools
- **WHEN** a profile does not specify `tools`
- **THEN** the sub-agent uses the session's default tool set

#### Scenario: Spawn overrides profile tools
- **WHEN** spawn config specifies `tools: ["read", "edit"]` and the profile specifies `tools: ["read", "grep"]`
- **THEN** the spawn override wins: only `["read", "edit"]` are available

### Requirement: Profile Context Injection

Profiles MAY include context that is injected into the sub-agent's system prompt.

#### Scenario: Profile context is prepended
- **WHEN** a profile specifies `context: "This is a security review agent"`
- **THEN** the context is prepended to the sub-agent's system prompt

#### Scenario: Spawn context extends profile context
- **WHEN** both profile and spawn specify context
- **THEN** the spawn context is appended after the profile context

#### Scenario: Context ordering
- **WHEN** context is provided from profile, spawn, and orchestrator
- **THEN** the order is: profile context → spawn context → orchestrator context

### Requirement: Profile Resolution Chain

The system MUST resolve configuration through a clear precedence chain.

#### Scenario: Precedence order
- **WHEN** a sub-agent is spawned with a profile and overrides
- **THEN** the effective configuration is resolved as:
  1. Session defaults (lowest priority)
  2. Profile defaults
  3. Spawn overrides (highest priority)

#### Scenario: Undefined fields fall through
- **WHEN** a profile defines `model` but not `temperature`
- **THEN** the session's default temperature is used

### Requirement: Loop Control Configuration

Profiles MUST be able to configure the maximum number of tool-call iterations per sub-agent.

#### Scenario: Profile limits iterations
- **WHEN** a profile specifies `maxIterations: 3`
- **THEN** the sub-agent stops after 3 tool-call iterations even if the model requests more

#### Scenario: Default iterations
- **WHEN** a profile does not specify `maxIterations`
- **THEN** the default of 10 iterations is used

#### Scenario: Spawn override
- **WHEN** spawn config specifies `maxIterations: 5` and the profile specifies `maxIterations: 3`
- **THEN** the spawn override wins: max 5 iterations

### Requirement: Tool Timeout Configuration

Profiles MUST be able to configure per-tool execution timeout.

#### Scenario: Profile sets tool timeout
- **WHEN** a profile specifies `toolTimeoutMs: 30000`
- **THEN** each tool invocation is cancelled after 30 seconds

#### Scenario: Default timeout
- **WHEN** a profile does not specify `toolTimeoutMs`
- **THEN** tools run without timeout (current behavior)

#### Scenario: Timeout triggers error
- **WHEN** a tool exceeds the configured timeout
- **THEN** the tool call fails with a timeout error and the agent continues

### Requirement: Context Window Configuration

Profiles MUST be able to configure the maximum number of messages in the context window.

#### Scenario: Profile limits context
- **WHEN** a profile specifies `maxContextMessages: 50`
- **THEN** the sub-agent's context window is capped at 50 messages

#### Scenario: Default context size
- **WHEN** a profile does not specify `maxContextMessages`
- **THEN** the session default (100 messages) is used

#### Scenario: Context trimming
- **WHEN** the context exceeds `maxContextMessages`
- **THEN** older messages are trimmed while preserving the system message

### Requirement: Streaming Configuration

Profiles MUST be able to configure whether the sub-agent uses streaming responses.

#### Scenario: Profile enables streaming
- **WHEN** a profile specifies `streaming: true`
- **THEN** the sub-agent uses `processInputStreaming()` for token-by-token delivery

#### Scenario: Profile disables streaming
- **WHEN** a profile specifies `streaming: false`
- **THEN** the sub-agent uses `processInput()` for batch response

#### Scenario: Default streaming
- **WHEN** a profile does not specify `streaming`
- **THEN** the spawn caller's default is used

### Requirement: Built-in Profiles

The system MUST ship with default profiles for common use cases.

#### Scenario: Default profiles
- **WHEN** the system starts
- **THEN** the following profiles are available:
  - `reviewer`: Code review with structured output
  - `scout`: Read-only exploration (no edit/write tools)
  - `coder`: Full tool access for implementation tasks
  - `quick`: Fast model, minimal context for simple tasks
