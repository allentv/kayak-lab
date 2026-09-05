## Why

The harness needs a persistent memory system to enable agents to learn and improve over time. Current agent implementations lack long-term memory capabilities, forcing agents to rebuild context from scratch each time. A memory system allows agents to retain knowledge, share memory between sub-agents, and improve over time based on accumulated experience. The memory system should be abstracted to allow testing different providers (mem0.ai, hindsight, custom) and support shared memory references for sub-agents.

## What Changes

- Add memory abstraction layer with provider-agnostic interface (mem0.ai, hindsight, custom)
- Add memory types: short-term (session), long-term (persistent), episodic (interactions), semantic (facts)
- Add memory storage with fallback chain: in-memory → persistent → distributed
- Add on-demand memory retrieval (not context injection) to preserve context window
- Add memory update (automatic and manual)
- Add shared memory references for sub-agents (shared context, memory pointers, memory snapshots)
- Add memory search (semantic and keyword)
- Add memory events to the event stream for observability
- Add memory configuration (provider, storage, fallback)

## Capabilities

### New Capabilities

- `memory-abstraction`: Provider-agnostic memory interface
- `memory-types`: Short-term, long-term, episodic, semantic memory
- `memory-storage`: In-memory, persistent, distributed storage with fallback
- `memory-retrieval`: On-demand memory retrieval
- `memory-update`: Automatic and manual memory update
- `memory-shared`: Shared memory references for sub-agents
- `memory-search`: Semantic and keyword memory search

### Modified Capabilities

- `agent-runtime`: Extend to support memory operations

## Out of Scope

- Memory UI (future work)
- Memory visualization (future work)
- Memory analytics (future work)
- Memory migration between providers (future work)