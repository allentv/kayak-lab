## Tasks

### Phase 1: Core Infrastructure

- [x] Create `AgentProfile` type in `src/runtime/types.ts`
  - Fields: `name`, `description?`, `model?`, `thinkingLevel?`, `tools?`, `context?`, `systemPrompt?`, `maxTokens?`, `temperature?`, `extends?`
  - Export from `src/runtime/mod.ts`

- [x] Create `ProfileRegistry` class in `src/runtime/profile-registry.ts`
  - Methods: `register()`, `unregister()`, `get()`, `list()`, `resolve()` with inheritance
  - Cycle detection in `resolve()` — throw on circular `extends`
  - Export from `src/runtime/mod.ts`

- [x] Write unit tests for `ProfileRegistry`
  - Test register/unregister/get/list
  - Test inheritance resolution (parent → child override)
  - Test cycle detection
  - Test undefined profile returns undefined

### Phase 2: Builder Pattern

- [x] Create `SpawnConfig` interface in `src/runtime/spawn-config.ts`
  - Fields match `AgentProfile` plus `profile?: string` and `overrides`

- [x] Create `SpawnConfigBuilder` class in `src/runtime/spawn-config.ts`
  - Constructor takes `ProfileRegistry`
  - Methods: `fromProfile()`, `withModel()`, `withThinking()`, `withTools()`, `withContext()`, `withSystemPrompt()`, `withMaxTokens()`, `withTemperature()`, `build()`
  - `fromProfile()` loads defaults from registry
  - Explicit `with*()` calls override profile defaults
  - Export from `src/runtime/mod.ts`

- [x] Write unit tests for `SpawnConfigBuilder`
  - Test building from profile
  - Test overriding profile fields
  - Test building without profile (session defaults only)
  - Test precedence: override > profile > session default

### Phase 3: Hook Model Propagation Fix

- [x] Fix `before_model_call` propagation in `agent-runtime.ts`
  - After hook dispatch, copy `beforeModelContext.model` to `request.model`
  - Add comment explaining the fix
  - Location: `runLoop()` method, after `await this.hookRegistry.dispatch(...)`

- [x] Write test for hook model propagation
  - Register `before_model_call` hook that sets `model = "test-model"`
  - Verify `ModelRequest.model` is `"test-model"` after hook runs

### Phase 3b: AgentConfig Extensions

- [x] Add `maxIterations` to `AgentConfig` in `agent-runtime.ts`
  - Replace hardcoded `const maxIterations = 10` with `this.config.maxIterations ?? 10`
  - Apply in both `runLoop()` and `processInputStreaming()`

- [x] Implement `toolTimeoutMs` in `executeToolCalls()`
  - Wrap tool invocation with `Promise.race` and timeout
  - Return timeout error if exceeded
  - Currently defined in `AgentConfig` but never used

- [x] Add `streaming` to `AgentConfig`
  - Document that `spawn()` uses this to choose `processInput` vs `processInputStreaming`

- [x] Write tests for new config fields
  - Test `maxIterations` limits loop iterations
  - Test `toolTimeoutMs` cancels tool after timeout
  - Test `streaming` selects response mode

### Phase 4: Spawn Integration

- [x] Create `spawn()` function in `src/runtime/spawn.ts`
  - Accepts `SpawnConfig` + `task: string`
  - Creates `AgentRuntime` with config from `SpawnConfig` (including maxIterations, toolTimeoutMs, maxContextMessages, streaming)
  - Registers `before_model_call` hook to propagate model
  - Injects profile context into system prompt
  - Starts runtime and processes task
  - Uses streaming or batch based on `config.streaming`
  - Returns sub-agent result

- [x] Integrate `ProfileRegistry` with `AgentRuntime`
  - `AgentRuntime` constructor accepts optional `ProfileRegistry`
  - `spawn()` uses registry to resolve profiles

- [x] Write unit tests for `spawn()`
  - Test spawning with profile
  - Test spawning with profile + overrides
  - Test context injection order (profile → spawn → orchestrator)
  - Test tool set restriction

### Phase 5: Built-in Profiles

- [x] Create built-in profiles in `src/runtime/profiles.ts`
  - `reviewer`: model=?, tools=["read","grep","glob"], structured output
  - `scout`: model=?, tools=["read","grep","glob","find"], fast model
  - `coder`: model=?, tools=["read","grep","glob","find","edit","write","bash"]
  - `quick`: model=?, fast model, minimal context

- [x] Register built-in profiles at startup
  - Call `ProfileRegistry.register()` for each built-in profile
  - Make registry available to `spawn()` function

- [x] Write integration tests
  - Test spawning with each built-in profile
  - Test profile inheritance between built-in profiles
  - Test orchestrator selecting profile and overriding fields

### Phase 6: Documentation

- [x] Update `docs/architecture.md` with profile system overview
- [x] Add profile usage examples to agent definition files
- [x] Update `agents/reviewer.md` to show profile-based spawning
