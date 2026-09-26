# src/memory/retrieval.ts · [[memory-system]] [[memory-tiering-l1-l2-l3]]

- MemoryRetrievedEvent · interface · L17-L22 — Defines the payload structure for memory retrieval events, tracking query, result count, session context, and timestamp for monitoring retrieval operations.
- MemoryRetrievalEvents · interface · L25-L27 — Declares the event types emitted by retrieval operations, currently only the memory_retrieved event for tracking retrieval outcomes.
- RetrievalConfig · interface · L34-L41 — Specifies the configuration for memory retrieval operations including result limits, relevance thresholds, and session scoping to control retrieval behavior.
- RetrievalOptions · interface · L44-L57 — Defines the options that can be passed to a retrieval request, allowing callers to filter by query, type, session, and override configuration parameters.
- MemoryRetrievalResult · interface · L60-L69 — Represents a scored memory retrieval result combining relevance, provenance, and final scores to rank memories by their likely usefulness to the agent.
- IMemoryRetrieval · interface · L78-L87 — Defines the interface for on-demand memory retrieval systems, standardizing the retrieve, configure, and getConfig operations across implementations.
- MemoryRetrieval · class · L99-L255 — Implements on-demand memory retrieval with scoring, L2/L3 memory inclusion, and event emission while preserving context space by avoiding automatic injection.
- constructor · method · L111-L126 — Initializes the retrieval system with a fetch function, configuration defaults, provenance weight, and optional storage for L2/L3 memory access.
- retrieve · method · L128-L209 — Retrieves and scores memories based on options, includes L2/L3 memories when agentId is provided, sorts by final score, and emits retrieval events.
- configure · method · L211-L213 — Updates the retrieval configuration by merging partial updates with existing settings to dynamically adjust retrieval behavior.
- getConfig · method · L215-L217 — Returns a copy of the current retrieval configuration to allow inspection of active retrieval settings.
- calculateRelevanceScore · method · L222-L245 — Calculates a relevance score for a memory based on its type and recency, with higher-level memory types and more recent memories receiving better scores.
- calculateProvenanceScore · method · L250-L254 — Placeholder for provenance scoring that would adjust scores based on session success/failure links, returning neutral scores without provenance graph access.
