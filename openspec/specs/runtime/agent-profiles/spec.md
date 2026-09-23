## Purpose

Fully configurable sub-agent profiles with progressive builder-pattern configuration, dynamic model routing, and orchestrator-driven profile selection. Enables spawning sub-agents with customizable defaults for model, thinking level, tools, context strategy, and behavioral guidelines — without editing static definition files.

## Context

kayak-lab's current agent system has static agent definitions (`agents/*.md`) and a single `before_model_call` hook that can modify context but not propagate model changes back to the request. Sub-agents cannot be dynamically configured at spawn time — their model, tool set, and behavioral profile are fixed at definition time.

This spec introduces a profile-based configuration system where:
- Profiles bundle configuration defaults (model, thinking, tools, context)
- A builder pattern allows progressive configuration at spawn time
- The orchestrator agent can select and parameterize profiles dynamically
- Hooks propagate model changes correctly (fixing the existing bug)

## ADDED Requirements

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

```typescript
interface AgentProfile {
  name: string;
  description?: string;

  // Model configuration
  model?: string;
  thinkingLevel?: "off" | "low" | "medium" | "high";

  // Tool configuration
  tools?: string[];

  // Context configuration
  context?: string;
  systemPrompt?: string;
  maxContextMessages?: number;  // max messages in context window

  // Generation parameters
  maxTokens?: number;
  temperature?: number;
  streaming?: boolean;  // use streaming response

  // Loop control
  maxIterations?: number;  // max tool-call iterations (default: 10)
  toolTimeoutMs?: number;  // per-tool timeout in ms

  // Inheritance
  extends?: string;  // other profiles this one extends
}
```

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

```typescript
class ProfileRegistry {
  register(profile: AgentProfile): void;
  unregister(name: string): boolean;
  get(name: string): AgentProfile | undefined;
  list(): AgentProfile[];
}
```

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

```typescript
interface SpawnConfig {
  profile?: string;

  // Model configuration
  model?: string;
  thinkingLevel?: string;

  // Tool configuration
  tools?: string[];

  // Context configuration
  context?: string;
  systemPrompt?: string;
  maxContextMessages?: number;

  // Generation parameters
  maxTokens?: number;
  temperature?: number;
  streaming?: boolean;

  // Loop control
  maxIterations?: number;
  toolTimeoutMs?: number;

  /** Overrides merged on top of profile/session defaults */
  overrides: Partial<AgentProfile>;
}

class SpawnConfigBuilder {
  fromProfile(name: string): this;
  withModel(model: string): this;
  withThinking(level: string): this;
  withTools(tools: string[]): this;
  withContext(context: string): this;
  withSystemPrompt(prompt: string): this;
  withMaxTokens(max: number): this;
  withTemperature(temp: number): this;
  withStreaming(streaming: boolean): this;
  withMaxIterations(n: number): this;
  withToolTimeout(ms: number): this;
  withMaxContextMessages(n: number): this;
  build(): SpawnConfig;
}
```

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

```typescript
// Orchestrator usage
const result = await spawn({
  profile: "reviewer",
  model: "anthropic/claude-opus",  // override profile default
  context: "Focus on security vulnerabilities",
  task: "Review src/auth/ for injection flaws",
});
```

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

```typescript
// hooks.ts - BeforeModelCallContext MUST include mutable model
interface BeforeModelCallContext {
  sessionId: string;
  messages: Array<{ role: string; content: string; tool_call_id?: string }>;
  model?: string;       // ← MUST be propagated back to request
  tools?: unknown[];
  profile?: string;     // ← NEW: profile name if set
}

// agent-runtime.ts - buildModelRequest MUST use hook-modified model
private buildModelRequest(): ModelRequest {
  // ... existing code ...
  return {
    messages,
    tools,
    model: this.hookModifiedModel,  // ← from before_model_call hook
    temperature,
    max_tokens,
  };
}
```

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

## Implementation Notes

### AgentConfig Extensions

The existing `AgentConfig` interface needs two additions:

```typescript
// src/runtime/agent-runtime.ts
interface AgentConfig {
  // Existing fields
  max_context_messages?: number;
  temperature?: number;
  max_tokens?: number;
  tool_timeout_ms?: number;  // exists but unused
  agentId?: string;

  // NEW fields
  maxIterations?: number;    // replaces hardcoded `10`
  streaming?: boolean;       // determines processInput vs processInputStreaming
}
```

### Bug Fix: Hook Model Propagation

The existing `before_model_call` hook modifies `context.model` but the change is never copied back to the `ModelRequest`. Fix:

```typescript
// In agent-runtime.ts runLoop()
const beforeModelContext: BeforeModelCallContext = {
  sessionId: this.state!.session_id,
  messages: [...request.messages],
  model: request.model,
  tools: request.tools,
};
await this.hookRegistry.dispatch(HookPoint.BeforeModelCall, beforeModelContext, ...);

// CURRENT (broken):
request.messages = beforeModelContext.messages as Message[];

// FIXED:
request.messages = beforeModelContext.messages as Message[];
request.model = beforeModelContext.model;  // ← ADD THIS
```

### Profile Registry Location

```typescript
// src/runtime/profile-registry.ts
export class ProfileRegistry {
  private profiles: Map<string, AgentProfile> = new Map();

  register(profile: AgentProfile): void {
    this.profiles.set(profile.name, profile);
  }

  unregister(name: string): boolean {
    return this.profiles.delete(name);
  }

  get(name: string): AgentProfile | undefined {
    return this.profiles.get(name);
  }

  list(): AgentProfile[] {
    return Array.from(this.profiles.values());
  }

  /** Resolve a profile with inheritance chain */
  resolve(name: string): AgentProfile | undefined {
    const profile = this.profiles.get(name);
    if (!profile) return undefined;
    if (profile.extends) {
      const base = this.resolve(profile.extends);
      if (base) {
        return { ...base, ...profile, name: profile.name };
      }
    }
    return profile;
  }
}
```

### Builder Implementation

```typescript
// src/runtime/spawn-config.ts
export class SpawnConfigBuilder {
  private config: Partial<SpawnConfig> = {};
  private registry: ProfileRegistry;

  constructor(registry: ProfileRegistry) {
    this.registry = registry;
  }

  fromProfile(name: string): this {
    const profile = this.registry.resolve(name);
    if (profile) {
      this.config = { ...profile };
      this.config.profile = name;
    }
    return this;
  }

  withModel(model: string): this {
    this.config.model = model;
    return this;
  }

  withThinking(level: string): this {
    this.config.thinkingLevel = level;
    return this;
  }

  withTools(tools: string[]): this {
    this.config.tools = tools;
    return this;
  }

  withContext(context: string): this {
    this.config.context = context;
    return this;
  }

  withStreaming(streaming: boolean): this {
    this.config.streaming = streaming;
    return this;
  }

  withMaxIterations(n: number): this {
    this.config.maxIterations = n;
    return this;
  }

  withToolTimeout(ms: number): this {
    this.config.toolTimeoutMs = ms;
    return this;
  }

  withMaxContextMessages(n: number): this {
    this.config.maxContextMessages = n;
    return this;
  }

  build(): SpawnConfig {
    return {
      ...this.config,
      overrides: { ...this.config },
    } as SpawnConfig;
  }
}
```

### Integration with AgentRuntime

```typescript
// In AgentRuntime or spawn function
async function spawnSubAgent(config: SpawnConfig, task: string): Promise<string> {
  const runtime = new AgentRuntime(
    eventStream,
    sessionManager,
    modelManager,
    toolRegistry,
    {
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      max_context_messages: config.maxContextMessages,
      maxIterations: config.maxIterations,        // NEW
      tool_timeout_ms: config.toolTimeoutMs,      // NEW (currently unused, needs impl)
      agentId: config.profile,                    // use profile name as agent ID
    },
  );

  // Register a before_model_call hook that sets the model
  runtime.getHookRegistry().register(
    HookPoint.BeforeModelCall,
    (ctx) => {
      const hookCtx = ctx as BeforeModelCallContext;
      hookCtx.model = config.model;  // Propagated to request
    },
  );

  // Inject profile context into system prompt
  if (config.context) {
    // Prepend to first system message or create one
  }

  await runtime.start();

  // Use streaming or batch based on profile config
  if (config.streaming) {
    const chunks: string[] = [];
    for await (const chunk of runtime.processInputStreaming(task)) {
      if (typeof chunk === "string") chunks.push(chunk);
    }
    return chunks.join("");
  } else {
    return await runtime.processInput(task);
  }
}
```

## Scope

### In Scope

- `AgentProfile` type definition with all configuration fields
- `ProfileRegistry` class (register, unregister, get, list, resolve with inheritance)
- `SpawnConfig` and `SpawnConfigBuilder` (progressive configuration)
- `spawn()` function that accepts profile + overrides
- `before_model_call` hook model propagation fix
- Profile context injection into sub-agent system prompt
- Built-in profiles: `reviewer`, `scout`, `coder`, `quick`
- Tool set restriction per profile
- `maxIterations` configuration (replaces hardcoded `10`)
- `toolTimeoutMs` configuration (currently defined but unused)
- `maxContextMessages` configuration (already in AgentConfig)
- `streaming` configuration (determines response mode)

### Out of Scope

- Dynamic tool registration from profiles (tools must be pre-registered)
- Cross-agent memory sharing via profiles (existing SharedMemory handles this)
- Profile persistence to disk (profiles are runtime-only for now)
- UI for profile management (future work)
- Profile versioning (future work)

## Success Criteria

- `ProfileRegistry` can register, unregister, resolve profiles with inheritance
- `SpawnConfigBuilder` produces correct `SpawnConfig` from profile + overrides
- `spawn()` creates sub-agent with profile's model, tools, context
- `before_model_call` hook model changes propagate to `ModelRequest`
- Orchestrator can select profile and override fields at spawn time
- Sub-agent receives profile context in system prompt
- Built-in profiles work out of the box
- `maxIterations` from profile limits sub-agent loop iterations
- `toolTimeoutMs` from profile cancels tools after timeout
- `maxContextMessages` from profile trims context window
- `streaming` from profile selects response mode
- All existing tests continue to pass
