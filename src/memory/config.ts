/**
 * Memory system configuration.
 *
 * Defines the full configuration schema for the memory subsystem:
 * provider, storage, retrieval, search, and shared memory settings.
 */

import type { MemoryProviderConfig, MemoryProviderType } from "./provider.ts";
import type { MemoryStorageConfig, StorageBackend } from "./storage.ts";
import type { RetrievalConfig } from "./retrieval.ts";
import type { SearchConfig, SearchType } from "./search.ts";

// ============================================================================
// Memory System Configuration
// ============================================================================

/** Top-level memory configuration. */
export interface MemoryConfig {
  /** Memory provider settings. */
  provider: MemoryProviderConfig;
  /** Storage backend settings. */
  storage: MemoryStorageConfig;
  /** Retrieval defaults. */
  retrieval: RetrievalConfig;
  /** Search defaults. */
  search: SearchConfig;
  /** Shared memory settings. */
  shared: SharedMemoryConfig;
}

/** Shared memory configuration. */
export interface SharedMemoryConfig {
  /** Whether shared memory is enabled. */
  enabled: boolean;
  /** Maximum sub-agents that can share context. */
  max_shared_agents: number;
  /** Whether snapshots are enabled. */
  snapshots_enabled: boolean;
}

// ============================================================================
// Defaults
// ============================================================================

/** Default memory configuration. */
export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  provider: {
    provider: "custom",
    settings: {},
  },
  storage: {
    backend: "in_memory",
    fallback_chain: ["in_memory", "persistent"],
    settings: {
      in_memory: { enabled: true, settings: {} },
      persistent: { enabled: false, settings: { path: "./memory-store.json" } },
      distributed: { enabled: false, settings: {} },
    },
  },
  retrieval: {
    max_results: 10,
    relevance_threshold: 0.0,
    scope: "all",
  },
  search: {
    max_results: 10,
    relevance_threshold: 0.0,
    default_type: "combined" as SearchType,
  },
  shared: {
    enabled: true,
    max_shared_agents: 10,
    snapshots_enabled: true,
  },
};

// ============================================================================
// Config Helpers
// ============================================================================

/** Create a memory config with overrides. */
export function createMemoryConfig(
  overrides?: Partial<MemoryConfig>,
): MemoryConfig {
  return {
    ...DEFAULT_MEMORY_CONFIG,
    ...overrides,
    provider: { ...DEFAULT_MEMORY_CONFIG.provider, ...overrides?.provider },
    storage: { ...DEFAULT_MEMORY_CONFIG.storage, ...overrides?.storage },
    retrieval: { ...DEFAULT_MEMORY_CONFIG.retrieval, ...overrides?.retrieval },
    search: { ...DEFAULT_MEMORY_CONFIG.search, ...overrides?.search },
    shared: { ...DEFAULT_MEMORY_CONFIG.shared, ...overrides?.shared },
  };
}

/** Validate a memory configuration. Returns errors or empty array. */
export function validateMemoryConfig(config: MemoryConfig): string[] {
  const errors: string[] = [];

  const validProviders: MemoryProviderType[] = ["mem0", "hindsight", "custom"];
  if (!validProviders.includes(config.provider.provider)) {
    errors.push(`Invalid provider: ${config.provider.provider}`);
  }

  const validBackends: StorageBackend[] = ["in_memory", "persistent", "distributed"];
  if (!validBackends.includes(config.storage.backend)) {
    errors.push(`Invalid storage backend: ${config.storage.backend}`);
  }

  if (config.retrieval.max_results < 0) {
    errors.push("retrieval.max_results must be non-negative");
  }

  if (config.retrieval.relevance_threshold < 0 || config.retrieval.relevance_threshold > 1) {
    errors.push("retrieval.relevance_threshold must be between 0 and 1");
  }

  if (config.search.max_results < 0) {
    errors.push("search.max_results must be non-negative");
  }

  if (config.search.relevance_threshold < 0 || config.search.relevance_threshold > 1) {
    errors.push("search.relevance_threshold must be between 0 and 1");
  }

  if (config.shared.max_shared_agents < 0) {
    errors.push("shared.max_shared_agents must be non-negative");
  }

  return errors;
}
