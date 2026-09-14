## Why

The memory system currently stores episodic (interaction logs) and semantic (extracted facts) memories, but lacks two critical layers found in production agent platforms: structured persistent knowledge (how-to guides, learned patterns as documents) and stable agent identity (name, goals, constraints, personality). Without these, agents lose learned knowledge across sessions, have no persistent identity, and self-evolution patterns can't accumulate into reusable knowledge documents.

Inspired by the TencentDB Agent Memory SDK's L2 (Scenario) and L3 (Core) layers, this change adds path-addressable structured knowledge and per-agent core identity to the existing memory subsystem — all local-first, no external service dependency.

## What Changes

- **New `ScenarioMemory` type** (L2): Path-addressable markdown documents stored per agent. Think of these as agent-owned knowledge files (`git.workflow`, `error-handling.retry`, `deployment.full-guide`). Written by self-evolution (PatternAnalyzer) and directly by users/agents.
- **New `CoreMemory` type** (L3): Singleton per agent. Structured sections (name, goals, constraints, personality) that form the agent's stable identity. Loaded into the system prompt at session start.
- **New `agent_memory` SQLite table**: Separate from existing `memories` table. Stores L2 scenarios and L3 core with agent scoping and path uniqueness.
- **Extended storage interface**: `IMemoryStorage` gains `writeScenario`, `readScenario`, `listScenarios`, `deleteScenario`, `countScenarios`, `readCore`, `writeCore` methods.
- **Extended provider**: `MemoryProvider` exposes L2/L3 operations with event emission.
- **Default `maxTokens` increase**: 8000 → 9000 to accommodate L2/L3 context overhead (~600 tokens). Further optimization deferred to real-world data.

## Capabilities

### New Capabilities

- `memory/structured-knowledge`: L2 Scenario memory — path-addressable structured knowledge documents per agent, with CRUD operations, prefix-based listing, and SQLite persistence.
- `memory/agent-identity`: L3 Core memory — singleton per agent with structured sections, loaded into system prompt at session start, upsert semantics.

### Modified Capabilities

- `memory/storage`: Extended `IMemoryStorage` interface with L2/L3 method signatures. No breaking changes — new methods are additive.
- `memory/context-budget`: Default `maxTokens` increased from 8000 to 9000 in `provenance-context-types.ts` to accommodate L2/L3 overhead.

## Scope

- **In scope**: Types, storage interface, SQLite implementation, provider methods, context budget adjustment.
- **Out of scope**: Wiring to AgentRuntime (session-start loading), PatternAnalyzer integration, MemoryRetrieval L2/L3 scoring. These are follow-up changes that depend on the foundational storage being in place.
