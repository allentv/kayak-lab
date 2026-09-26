# src/memory/config.ts · [[memory-context-management]]

- MemoryConfig · interface · L18-L29 — Top-level interface that structures the complete memory system configuration by aggregating provider, storage, retrieval, search, and shared memory settings.
- SharedMemoryConfig · interface · L32-L39 — Interface defining settings for shared memory functionality, enabling multiple agents to share context and snapshots.
- createMemoryConfig · function · L82-L94 — Factory function that creates a memory configuration by merging user-provided overrides with sensible defaults while preserving nested structure.
- validateMemoryConfig · function · L97-L131 — Validates a memory configuration by checking provider types, storage backends, and numeric constraints to ensure system integrity.
