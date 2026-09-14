## 1. Types

- [x] 1.1 Add `ScenarioMemory` and `CoreMemory` interfaces to `src/memory/types.ts`. Add `"scenario" | "core"` to `MemoryType` union. Add both to `AnyMemory` union. Add `CreateScenarioInput` and `CreateCoreInput` types. Verify: `deno check src/memory/types.ts` passes.

- [x] 1.2 Export new types from `src/memory/mod.ts`. Verify: import `ScenarioMemory` and `CoreMemory` from `./src/memory/mod.ts` resolves.

## 2. Storage Interface

- [x] 2.1 Add L2/L3 method signatures to `IMemoryStorage` in `src/memory/storage.ts`: `writeScenario`, `readScenario`, `listScenarios`, `deleteScenario`, `countScenarios`, `readCore`, `writeCore`. All return promises. Verify: `deno check src/memory/storage.ts` passes.

- [x] 2.2 Add stub implementations to `InMemoryStorage`, `PersistentStorage`, `DistributedStorage`, and `FallbackStorage` in `src/memory/storage.ts`. Stubs return empty/null/0. Verify: `deno check src/memory/storage.ts` passes with all implementations satisfying the interface.

## 3. SQLite Backend

- [x] 3.1 Add `agent_memory` table creation to `SQLitePersistenceBackend.initialize()` in `src/store/sqlite-backend.ts`. Schema: `id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, memory_type TEXT NOT NULL, path TEXT, name TEXT, content TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, metadata TEXT DEFAULT '{}'`. Indexes: `idx_agent_memory_agent (agent_id, memory_type)`, unique `idx_agent_memory_path (agent_id, path) WHERE memory_type = 'scenario'`. Verify: `deno check src/store/sqlite-backend.ts` passes.

- [x] 3.2 Implement `writeScenario` in `SQLitePersistenceBackend`. Upsert semantics: insert or replace where `agent_id` and `path` match. Set timestamps. Return the stored `ScenarioMemory`. Verify: `deno check src/store/sqlite-backend.ts` passes.

- [x] 3.3 Implement `readScenario` in `SQLitePersistenceBackend`. Query by `agent_id` and `path`. Return `ScenarioMemory` or null. Verify: `deno check src/store/sqlite-backend.ts` passes.

- [x] 3.4 Implement `listScenarios` in `SQLitePersistenceBackend`. Query by `agent_id`, optional `LIKE` prefix filter. Return array of `ScenarioMemory`. Verify: `deno check src/store/sqlite-backend.ts` passes.

- [x] 3.5 Implement `deleteScenario` in `SQLitePersistenceBackend`. Delete by `agent_id` and `path`. Return boolean. Verify: `deno check src/store/sqlite-backend.ts` passes.

- [x] 3.6 Implement `countScenarios` in `SQLitePersistenceBackend`. Count by `agent_id`. Return number. Verify: `deno check src/store/sqlite-backend.ts` passes.

- [x] 3.7 Implement `readCore` in `SQLitePersistenceBackend`. Query by `agent_id` where `memory_type = 'core'`. Parse JSON `content` column to `sections` record. Return `CoreMemory` or null. Verify: `deno check src/store/sqlite-backend.ts` passes.

- [x] 3.8 Implement `writeCore` in `SQLitePersistenceBackend`. Upsert semantics: insert or replace where `agent_id` and `memory_type = 'core'`. Serialize `sections` to JSON in `content` column. Set timestamps. Return the stored `CoreMemory`. Verify: `deno check src/store/sqlite-backend.ts` passes.

## 4. Provider

- [x] 4.1 Add L2/L3 convenience methods to `MemoryProvider` in `src/memory/provider.ts`: `writeScenario`, `readScenario`, `listScenarios`, `deleteScenario`, `countScenarios`, `readCore`, `writeCore`. Each delegates to `this.storage` and emits `memory_operation` event. Verify: `deno check src/memory/provider.ts` passes.

## 5. Context Budget

- [x] 5.1 Change `DEFAULT_CONFIG.maxTokens` from `8000` to `9000` in `src/memory/provenance-context-types.ts`. Verify: `deno check src/memory/provenance-context-types.ts` passes.

## 6. Tests

- [x] 6.1 Create `src/store/__tests__/sqlite-agent-memory.test.ts`. Test L2 CRUD: write, read, overwrite (preserves created_at), delete, list, list with prefix, count. Test L3 CRUD: write, read, overwrite, singleton per agent. Test agent isolation: two agents with same path don't conflict. Test storage independence: existing `memories` table unaffected. Verify: `deno test --allow-read --allow-write --allow-env src/store/__tests__/sqlite-agent-memory.test.ts` passes.

- [x] 6.2 Run full test suite: `deno task verify`. Verify: all checks, lint, and tests pass with no regressions.
