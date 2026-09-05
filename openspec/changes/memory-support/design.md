## Context

The harness needs a persistent memory system to enable agents to learn and improve over time. Current agent implementations lack long-term memory capabilities, forcing agents to rebuild context from scratch each time. A memory system allows agents to retain knowledge, share memory between sub-agents, and improve over time based on accumulated experience.

The memory system should be abstracted to allow testing different providers (mem0.ai, hindsight, custom) and support shared memory references for sub-agents. The memory system should use on-demand retrieval (not context injection) to preserve context window space.

## Goals / Non-Goals

**Goals:**
- Define a provider-agnostic memory interface
- Support different memory types (short-term, long-term, episodic, semantic)
- Implement memory storage with fallback chain (in-memory → persistent → distributed)
- Support on-demand memory retrieval (not context injection)
- Support automatic and manual memory update
- Support shared memory references for sub-agents (shared context, memory pointers, memory snapshots)
- Support memory search (semantic and keyword)
- Generate memory events in the event stream for observability

**Non-Goals:**
- Memory UI (future work)
- Memory visualization (future work)
- Memory analytics (future work)
- Memory migration between providers (future work)

## Decisions

### Decision: Memory Provider Abstraction

**Choice:** Provider-agnostic interface with implementations for mem0.ai, hindsight, and custom.

**Rationale:** Allows testing different providers and switching between them without changing the core agent logic. The abstraction layer provides a consistent interface for all providers.

**Alternatives considered:**
- Single provider: Not flexible for testing and switching
- No abstraction: Hard to switch between providers

### Decision: Memory Storage Fallback

**Choice:** Custom fallback chain from in-memory to persistent to distributed.

**Rationale:** Allows flexible storage based on availability and requirements. In-memory is fast but temporary, persistent is reliable, distributed is scalable. The fallback chain ensures memory is always stored somewhere.

**Alternatives considered:**
- Single storage: Not flexible for different requirements
- No fallback: No memory storage when primary is unavailable

### Decision: On-demand Memory Retrieval

**Choice:** On-demand memory retrieval, not automatic context injection.

**Rationale:** Preserves context window space for agents. Automatic injection can quickly deplete the context window. On-demand retrieval allows agents to retrieve only what they need.

**Alternatives considered:**
- Automatic context injection: Depletes context window quickly
- No memory retrieval: No memory available to agents

### Decision: Shared Memory References

**Choice:** Support shared context, memory pointers, and memory snapshots for sub-agents.

**Rationale:** Allows multiple sub-agents to access accumulated memory without rebuilding it, saving context window space. Shared context allows sub-agents to work together, memory pointers allow sub-agents to reference specific memories, and memory snapshots allow sub-agents to get a snapshot of the memory state.

**Alternatives considered:**
- No shared memory: Sub-agents have to rebuild memory from scratch
- Shared context only: Limited functionality

### Decision: Memory Search

**Choice:** Support both semantic and keyword search.

**Rationale:** Semantic search allows agents to find memories by meaning, while keyword search allows agents to find memories by keywords. Combined search provides the best of both worlds.

**Alternatives considered:**
- Semantic search only: No keyword search
- Keyword search only: No semantic search

## Risks / Trade-offs

**Risk:** Provider abstraction may add overhead.
**Mitigation:** Use efficient abstractions and caching.

**Risk:** Fallback chain may add complexity.
**Mitigation:** Keep the fallback chain simple and well-documented.

**Risk:** On-demand retrieval may be slower than automatic injection.
**Mitigation:** Use efficient caching and indexing.

**Risk:** Shared memory may lead to conflicts.
**Mitigation:** Use memory snapshots and pointers to avoid conflicts.

**Risk:** Combined search may be slower than single search.
**Mitigation:** Use efficient indexing and caching.