## Why

kayak-lab's sub-agent system uses static agent definitions with no runtime configurability. An orchestrator agent cannot:

1. **Select a model for a sub-agent** — model is hardcoded in the definition or defaults to the session provider
2. **Apply a behavioral profile** — no way to bundle model + tools + context + thinking level into a reusable unit
3. **Progressively configure at spawn time** — all configuration must be set upfront in the definition file
4. **Override profile defaults per-spawn** — no builder pattern for selective overrides

Additionally, the existing `before_model_call` hook has a bug where model modifications are silently discarded (only `messages` is propagated back to the request).

## What Changes

- **Agent profiles**: Named configuration bundles (model, thinking, tools, context, loop control) that can be registered and resolved at runtime
- **Profile registry**: Runtime registry with inheritance support for managing profiles
- **Builder pattern**: `SpawnConfigBuilder` for progressive configuration from profile defaults + explicit overrides
- **Spawn function**: New `spawn()` that accepts profile + overrides and creates a configured sub-agent
- **Hook fix**: `before_model_call` hook model changes propagate to `ModelRequest`
- **Loop control**: `maxIterations` replaces hardcoded `10` limit
- **Tool timeout**: `toolTimeoutMs` adds timeout to tool execution (currently defined but unused)
- **Streaming**: `streaming` field selects batch vs streaming response mode
- **Built-in profiles**: Default profiles for common use cases (reviewer, scout, coder, quick)

## Capabilities

### New Capabilities

- `agent-profiles`: Profile definition, registry, resolution with inheritance
- `spawn-config`: Builder pattern for progressive sub-agent configuration

### Modified Capabilities

- `agent-runtime`: Hook model propagation fix, profile-aware spawning
- `hooks`: `BeforeModelCallContext` gains mutable `model` field that propagates

## Scope

### In Scope

- `AgentProfile` type and `ProfileRegistry` class
- `SpawnConfigBuilder` for progressive configuration
- `spawn()` function integrating profile + overrides into AgentRuntime
- `before_model_call` hook model propagation bug fix
- Profile context injection into sub-agent system prompt
- Built-in profiles: `reviewer`, `scout`, `coder`, `quick`
- Tool set restriction per profile
- Profile inheritance (`extends` field)

### Out of Scope

- Dynamic tool registration from profiles
- Profile persistence to disk
- UI for profile management
- Profile versioning
- Cross-agent memory sharing via profiles (existing SharedMemory handles this)

## Success Criteria

- Orchestrator can spawn sub-agent with `spawn({ profile: "reviewer", model: "gpt-4", task: "..." })`
- Sub-agent receives profile's model, tools, and context
- `before_model_call` hook model changes propagate correctly
- Profile inheritance resolves correctly (base + override)
- All existing tests continue to pass
- Built-in profiles work out of the box
