/**
 * Memory module exports.
 *
 * Provider-agnostic memory system for the kayak-lab agent platform.
 */

// Types
export type {
  MemoryType,
  MemoryStatus,
  InteractionDirection,
  MemoryEntry,
  ShortTermMemory,
  LongTermMemory,
  EpisodicMemory,
  SemanticMemory,
  AnyMemory,
  CreateMemoryInput,
  CreateShortTermInput,
  CreateLongTermInput,
  CreateEpisodicInput,
  CreateSemanticInput,
  UpdateMemoryInput,
} from "./types.ts";

// Provider
export { MemoryProvider } from "./provider.ts";
export type {
  MemoryProviderType,
  MemoryProviderConfig,
  MemoryOperationEvent,
  MemoryProviderEvents,
  IMemoryProvider,
  ReflectOptions,
  ListOptions,
} from "./provider.ts";

// Storage
export {
  InMemoryStorage,
  PersistentStorage,
  DistributedStorage,
  FallbackStorage,
} from "./storage.ts";
export type {
  StorageBackend,
  MemoryStorageConfig,
  StorageBackendConfig,
  IMemoryStorage,
  StorageListOptions,
  MemoryStoredEvent,
  MemoryFallbackEvent,
  MemoryStorageEvents,
} from "./storage.ts";

// Retrieval
export { MemoryRetrieval } from "./retrieval.ts";
export type {
  RetrievalConfig,
  RetrievalOptions,
  IMemoryRetrieval,
  MemoryRetrievedEvent,
  MemoryRetrievalEvents,
} from "./retrieval.ts";

// Update
export { MemoryUpdate } from "./update.ts";
export type {
  IMemoryUpdate,
  MemoryUpdatedEvent,
  MemoryUpdateEvents,
} from "./update.ts";

// Shared
export { SharedMemory } from "./shared.ts";
export type {
  ISharedMemory,
  MemorySnapshot,
  SnapshotOptions,
  SharedMemoryEvent,
  SharedMemoryEvents,
} from "./shared.ts";

// Search
export { MemorySearch } from "./search.ts";
export type {
  SearchType,
  SearchFilters,
  SearchConfig,
  SearchOptions,
  SearchResult,
  IMemorySearch,
  MemorySearchEvent,
  MemorySearchResultEvent,
  MemorySearchEvents,
} from "./search.ts";

// Config
export { createMemoryConfig, validateMemoryConfig, DEFAULT_MEMORY_CONFIG } from "./config.ts";
export type { MemoryConfig, SharedMemoryConfig } from "./config.ts";
