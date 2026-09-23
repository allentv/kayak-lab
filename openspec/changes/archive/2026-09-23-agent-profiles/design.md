## Context

kayak-lab provides an event-sourced agent platform with AgentRuntime, ToolRegistry, and SQLite persistence. The platform has a hook system (`HookRegistry`) with lifecycle points including `before_model_call`, but the hook's model modification is silently discarded — only `messages` is propagated back to the `ModelRequest`.

Sub-agents are currently spawned via `AgentRuntime` with static configuration. There is no mechanism to:
- Bundle configuration defaults into a named profile
- Progressively configure a spawn via builder pattern
- Have an orchestrator agent select and parameterize profiles at runtime

Key existing components:
- `AgentRuntime`: Core execution loop with `buildModelRequest()` that omits the `model` field
- `HookRegistry`: Lifecycle hooks including `before_model_call` with mutable context
- `ModelManager`: Routes requests to providers, accepts optional `providerName`
- `ToolRegistry`: Manages available tools for the runtime

## Goals / Non-Goals

**Goals:**
- Named agent profiles with configurable defaults
- Builder pattern for progressive spawn configuration
- Orchestrator-driven profile selection at runtime
- Fix `before_model_call` hook model propagation bug
- Profile context injection into sub-agent system prompt
- Built-in profiles for common use cases

**Non-goals:**
- Dynamic tool registration from profiles
- Profile persistence to disk
- UI for profile management
- Profile versioning
- Cross-agent memory sharing via profiles

## Decisions

### 1. Profile Registry Architecture

**Decision:** Create `ProfileRegistry` as a standalone class with `Map<string, AgentProfile>` storage.

**Rationale:**
- Follows existing registry patterns (`ToolRegistry`, `MCPRegistry`)
- Simple key-value lookup by name
- Supports inheritance via `extends` field with recursive resolution
- Can be injected into `AgentRuntime` or `spawn()` function

**Alternatives considered:**
- Store profiles in `AgentConfig`: Rejected — mixes configuration with profile management
- Use event-sourced storage: Rejected — profiles are runtime configuration, not domain events
- Global singleton: Rejected — testability and isolation concerns

### 2. Builder Pattern Design

**Decision:** `SpawnConfigBuilder` with fluent API, initialized from a `ProfileRegistry`.

**Rationale:**
- Progressive configuration: start with profile defaults, override selectively
- Type-safe: each `with*()` method returns `this` for chaining
- Clear precedence: builder overrides > profile defaults > session defaults
- Familiar pattern: matches `Query.build()` and similar builder APIs

**Alternatives considered:**
- Plain object spread: Rejected — no progressive configuration, all-or-nothing
- Factory function with options: Rejected — less ergonomic for selective overrides
- Immutable config with `merge()`: Rejected — verbose for common cases

### 3. Hook Model Propagation Fix

**Decision:** Copy `beforeModelContext.model` back to `request.model` after hook dispatch.

**Rationale:**
- Minimal change: one line added to `agent-runtime.ts`
- Fixes existing bug without breaking current behavior (model was `undefined`, now can be set)
- Hooks can now set model from profile, environment, or any runtime state
- Consistent with how `messages` is already propagated

**Alternatives considered:**
- New `after_model_select` hook: Rejected — over-engineered, existing hook should work
- Model selection in `buildModelRequest()`: Rejected — separates model selection from hook lifecycle
- Always use default provider: Rejected — defeats purpose of hook system

### 4. Loop Control Configuration

**Decision:** Add `maxIterations` to `AgentConfig`, replace hardcoded `10` with config value.

**Rationale:**
- Currently hardcoded in two places (`runLoop` and `processInputStreaming`)
- Different sub-agents need different iteration limits (scout: 3, coder: 15)
- Minimal change: `const maxIterations = this.config.maxIterations ?? 10`
- Backward compatible: defaults to 10 when not set

**Alternatives considered:**
- Per-tool timeout only: Rejected — doesn't limit total iterations
- Hard limit per agent type: Rejected — not configurable at runtime

### 5. Tool Timeout Configuration

**Decision:** Implement `toolTimeoutMs` using `Promise.race` in `executeToolCalls()`.

**Rationale:**
- Already defined in `AgentConfig` but never used
- Different sub-agents need different timeouts (quick: 10s, coder: 60s)
- `Promise.race` is simple and doesn't require AbortController
- Timeout error is caught and reported as tool failure

**Alternatives considered:**
- AbortController: Rejected — more complex, requires provider support
- Per-provider timeout: Rejected — tool timeout is orthogonal to model timeout

### 6. Streaming Configuration

**Decision:** Add `streaming` to `AgentConfig`, `spawn()` chooses `processInput` vs `processInputStreaming`.

**Rationale:**
- Currently determined by caller, not configurable per-agent
- Some profiles benefit from streaming (quick), others from batch (reviewer)
- Simple branching in `spawn()` function
- Backward compatible: defaults to batch when not set

**Alternatives considered:**
- Always streaming: Rejected — batch is simpler for structured output
- Profile-specific stream handler: Rejected — over-engineered

### 7. Profile Inheritance

**Decision:** `extends` field on `AgentProfile` with recursive resolution in `ProfileRegistry.resolve()`.

**Rationale:**
- Common pattern: `quick` extends `coder` with different model
- Shallow merge: child fields override parent fields
- Cycle detection: track resolution stack to prevent infinite loops
- Simple to implement and understand

**Alternatives considered:**
- Deep merge: Rejected — profiles are flat configuration, not nested objects
- Trait composition: Rejected — over-engineered for current needs
- Template strings: Rejected — not composable

### 8. Context Injection Order

**Decision:** Profile context → spawn context → orchestrator context (prepended to system prompt).

**Rationale:**
- Profile context is most general (applies to all uses of the profile)
- Spawn context is specific to this invocation
- Orchestrator context is most specific (from the parent agent)
- Prepending ensures profile identity is always visible

**Alternatives considered:**
- Reverse order: Rejected — profile identity would be buried
- Single context field: Rejected — no separation of concerns
- Appended to user message: Rejected — should be in system prompt

### 9. Built-in Profiles

**Decision:** Ship four default profiles: `reviewer`, `scout`, `coder`, `quick`.

**Rationale:**
- `reviewer`: Common use case, structured output, read-only tools
- `scout`: Exploration, no edit/write tools, fast model
- `coder`: Full tool access, implementation tasks
- `quick`: Fast model, minimal context, simple tasks
- Profiles are registered at startup, can be overridden by user

**Alternatives considered:**
- No built-in profiles: Rejected — users need examples and defaults
- More profiles: Rejected — start minimal, add based on usage patterns
- Profiles as markdown files: Rejected — runtime configuration, not documentation

## Risks / Trade-offs

### Risk: Hook Model Propagation Breaking Change

**Impact:** Existing code that assumes model is always `undefined` may break.

**Mitigation:** Model was `undefined` before; setting it is additive behavior. Code that doesn't set model continues to work.

### Risk: maxIterations Breaking Change

**Impact:** Code that depends on exactly 10 iterations may behave differently.

**Mitigation:** Default is 10 when not set. Only changes behavior when explicitly configured.

### Risk: toolTimeoutMs Implementation Complexity

**Impact:** `Promise.race` may not cancel the underlying tool execution.

**Mitigation:** Tool continues in background but result is discarded. Acceptable for most tools; document limitation.

### Risk: Profile Inheritance Cycles

**Impact:** Circular `extends` references cause infinite recursion.

**Mitigation:** `resolve()` tracks visited names and throws on cycles.

### Risk: Tool Set Restriction Complexity

**Impact:** Profiles restricting tools may break assumptions about available tools.

**Mitigation:** Tool restriction is opt-in; profiles that don't specify `tools` use session defaults.

### Trade-off: Simplicity vs. Features

**Decision:** Start with flat profiles and simple inheritance; add nesting and composition later.

**Rationale:** Covers 80% of use cases with minimal complexity. Nested profiles and trait composition can be added incrementally.

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create `AgentProfile` type in `src/runtime/types.ts`
2. Create `ProfileRegistry` class in `src/runtime/profile-registry.ts`
3. Add unit tests for registry operations and inheritance

### Phase 2: Builder Pattern
1. Create `SpawnConfig` and `SpawnConfigBuilder` in `src/runtime/spawn-config.ts`
2. Add unit tests for builder operations
3. Integrate with `ProfileRegistry`

### Phase 3: Hook Fix
1. Fix `before_model_call` propagation in `agent-runtime.ts`
2. Add test verifying model propagation
3. Update `BeforeModelCallContext` type if needed

### Phase 4: Spawn Integration
1. Create `spawn()` function in `src/runtime/spawn.ts`
2. Integrate `SpawnConfigBuilder` with `AgentRuntime`
3. Add profile context injection to system prompt

### Phase 5: Built-in Profiles
1. Register built-in profiles at startup
2. Add integration tests for profile-based spawning
3. Document profile usage in README

## Files to Create/Modify

### New Files
- `src/runtime/types.ts` — `AgentProfile` type
- `src/runtime/profile-registry.ts` — `ProfileRegistry` class
- `src/runtime/spawn-config.ts` — `SpawnConfigBuilder` class
- `src/runtime/spawn.ts` — `spawn()` function

### Modified Files
- `src/runtime/agent-runtime.ts` — Fix hook model propagation, add `maxIterations`, implement `toolTimeoutMs`, add `streaming`
- `src/runtime/hooks.ts` — Update `BeforeModelCallContext` type
- `src/runtime/mod.ts` — Export new types and classes

### Test Files
- `src/runtime/__tests__/profile-registry.test.ts`
- `src/runtime/__tests__/spawn-config.test.ts`
- `src/runtime/__tests__/spawn.test.ts`
- `src/runtime/__tests__/agent-runtime-profile.test.ts`
- `src/runtime/__tests__/agent-runtime-config.test.ts` — tests for maxIterations, toolTimeoutMs, streaming
