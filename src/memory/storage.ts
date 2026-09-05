/**
 * Memory storage abstraction.
 *
 * Defines IMemoryStorage interface and implementations: InMemoryStorage,
 * PersistentStorage, DistributedStorage, with a FallbackStorage chain.
 */

import { TypedEmitter } from "./emitter.ts";
import type { AnyMemory, MemoryType } from "./types.ts";

// ============================================================================
// Storage Events
// ============================================================================

/** Memory stored event payload. */
export interface MemoryStoredEvent {
  memory_id: string;
  backend: StorageBackend;
  timestamp: string;
}

/** Memory fallback event payload. */
export interface MemoryFallbackEvent {
  memory_id: string;
  from_backend: StorageBackend;
  to_backend: StorageBackend;
  reason: string;
  timestamp: string;
}

/** Events emitted by storage implementations. */
export interface MemoryStorageEvents {
  memory_stored: MemoryStoredEvent;
  memory_fallback: MemoryFallbackEvent;
}

// ============================================================================
// Storage Types
// ============================================================================

/** Storage backend identifiers. */
export type StorageBackend = "in_memory" | "persistent" | "distributed";

/** Storage configuration. */
export interface MemoryStorageConfig {
  /** Primary storage backend. */
  backend: StorageBackend;
  /** Fallback chain order. */
  fallback_chain: StorageBackend[];
  /** Backend-specific settings. */
  settings: Record<string, StorageBackendConfig>;
}

/** Per-backend configuration. */
export interface StorageBackendConfig {
  enabled: boolean;
  settings: Record<string, unknown>;
}

// ============================================================================
// Storage Interface
// ============================================================================

/**
 * Interface for memory storage operations.
 */
export interface IMemoryStorage {
  /** Backend identifier. */
  readonly backend: StorageBackend;

  /** Store a memory entry. */
  store(memory: AnyMemory): Promise<void>;

  /** Retrieve a memory by ID. Returns null if not found. */
  retrieve(id: string): Promise<AnyMemory | null>;

  /** Delete a memory by ID. Returns true if deleted. */
  delete(id: string): Promise<boolean>;

  /** List memories with optional filters. */
  list(options?: StorageListOptions): Promise<AnyMemory[]>;

  /** Check if storage backend is available. */
  isAvailable(): Promise<boolean>;
}

/** Options for storage list operations. */
export interface StorageListOptions {
  type?: MemoryType;
  session_id?: string;
  max_results?: number;
}

// ============================================================================
// In-Memory Storage
// ============================================================================

/**
 * In-memory storage implementation.
 * Fast but non-persistent; data lost on process exit.
 */
export class InMemoryStorage extends TypedEmitter<MemoryStorageEvents> implements IMemoryStorage {
  readonly backend: StorageBackend = "in_memory";
  private store_ = new Map<string, AnyMemory>();

  async store(memory: AnyMemory): Promise<void> {
    this.store_.set(memory.id, { ...memory });
    this.emit("memory_stored", {
      memory_id: memory.id,
      backend: this.backend,
      timestamp: new Date().toISOString(),
    });
  }

  async retrieve(id: string): Promise<AnyMemory | null> {
    const memory = this.store_.get(id);
    return memory ? { ...memory } : null;
  }

  async delete(id: string): Promise<boolean> {
    return this.store_.delete(id);
  }

  async list(options?: StorageListOptions): Promise<AnyMemory[]> {
    let results = Array.from(this.store_.values());

    if (options?.type) {
      results = results.filter((m) => m.type === options.type);
    }
    if (options?.session_id) {
      results = results.filter((m) => m.session_id === options.session_id);
    }

    results.sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (options?.max_results) {
      results = results.slice(0, options.max_results);
    }

    return results;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  /** Number of stored memories (for testing). */
  get size(): number {
    return this.store_.size;
  }
}

// ============================================================================
// Persistent Storage
// ============================================================================

/**
 * Persistent storage implementation.
 * Wraps an abstract persistent backend (file, database).
 * For now, delegates to a simple JSON-file-backed store.
 */
export class PersistentStorage extends TypedEmitter<MemoryStorageEvents> implements IMemoryStorage {
  readonly backend: StorageBackend = "persistent";
  private store_ = new Map<string, AnyMemory>();
  private filePath: string;
  private loadPromise: Promise<void> | null = null;
  private loaded = false;

  constructor(filePath: string = "./memory-store.json") {
    super();
    this.filePath = filePath;
  }

  async store(memory: AnyMemory): Promise<void> {
    await this.ensureLoaded();
    this.store_.set(memory.id, { ...memory });
    await this.persist();
    this.emit("memory_stored", {
      memory_id: memory.id,
      backend: this.backend,
      timestamp: new Date().toISOString(),
    });
  }

  async retrieve(id: string): Promise<AnyMemory | null> {
    await this.ensureLoaded();
    const memory = this.store_.get(id);
    return memory ? { ...memory } : null;
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureLoaded();
    const result = this.store_.delete(id);
    if (result) await this.persist();
    return result;
  }

  async list(options?: StorageListOptions): Promise<AnyMemory[]> {
    await this.ensureLoaded();
    let results = Array.from(this.store_.values());

    if (options?.type) {
      results = results.filter((m) => m.type === options.type);
    }
    if (options?.session_id) {
      results = results.filter((m) => m.session_id === options.session_id);
    }

    results.sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (options?.max_results) {
      results = results.slice(0, options.max_results);
    }

    return results;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  get size(): number {
    return this.store_.size;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    if (!this.loadPromise) {
      this.loadPromise = this.load().finally(() => {
        this.loaded = true;
        this.loadPromise = null;
      });
    }
    await this.loadPromise;
  }

  private async persist(): Promise<void> {
    const data = JSON.stringify(Array.from(this.store_.values()), null, 2);
    await Deno.writeTextFile(this.filePath, data);
  }

  private async load(): Promise<void> {
    try {
      const data = await Deno.readTextFile(this.filePath);
      if (!data.trim()) return;
      const memories: AnyMemory[] = JSON.parse(data);
      for (const m of memories) {
        this.store_.set(m.id, m);
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        // Corrupted file — log but don't swallow silently
        console.error(`PersistentStorage: corrupted file ${this.filePath}, starting fresh`);
      }
      // File doesn't exist yet — start fresh
    }
  }
}

// ============================================================================
// Distributed Storage
// ============================================================================

/**
 * Distributed storage implementation.
 * Placeholder for networked/clustered storage (e.g., Redis, DynamoDB).
 * Returns unavailable until a real backend is configured.
 */
export class DistributedStorage extends TypedEmitter<MemoryStorageEvents> implements IMemoryStorage {
  readonly backend: StorageBackend = "distributed";
  private available = false;

  async store(_memory: AnyMemory): Promise<void> {
    if (!this.available) throw new Error("Distributed storage not available");
  }

  async retrieve(_id: string): Promise<AnyMemory | null> {
    return null;
  }

  async delete(_id: string): Promise<boolean> {
    return false;
  }

  async list(_options?: StorageListOptions): Promise<AnyMemory[]> {
    return [];
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  /** Enable distributed storage (for testing). */
  enable(): void {
    this.available = true;
  }

  /** Disable distributed storage. */
  disable(): void {
    this.available = false;
  }
}

// ============================================================================
// Fallback Storage
// ============================================================================

/**
 * Storage with automatic fallback chain.
 *
 * Tries each backend in order; falls back on failure or unavailability.
 * Emits memory_fallback events when a fallback is triggered.
 */
export class FallbackStorage extends TypedEmitter<MemoryStorageEvents> implements IMemoryStorage {
  readonly backend: StorageBackend = "in_memory";
  private backends: IMemoryStorage[];

  constructor(backends: (IMemoryStorage & TypedEmitter<MemoryStorageEvents>)[]) {
    super();
    if (backends.length === 0) {
      throw new Error("FallbackStorage requires at least one backend");
    }
    this.backends = backends;
    // Forward events from child backends
    for (const b of backends) {
      b.on("memory_stored", (e: MemoryStoredEvent) => this.emit("memory_stored", e));
      b.on("memory_fallback", (e: MemoryFallbackEvent) => this.emit("memory_fallback", e));
    }
  }

  async store(memory: AnyMemory): Promise<void> {
    for (let i = 0; i < this.backends.length; i++) {
      const backend = this.backends[i];
      try {
        const available = await backend.isAvailable();
        if (!available) {
          this.emit("memory_fallback", {
            memory_id: memory.id,
            from_backend: backend.backend,
            to_backend: i + 1 < this.backends.length
              ? this.backends[i + 1].backend
              : "in_memory",
            reason: "backend not available",
            timestamp: new Date().toISOString(),
          });
          continue;
        }
        await backend.store(memory);
        return;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        this.emit("memory_fallback", {
          memory_id: memory.id,
          from_backend: backend.backend,
          to_backend: i + 1 < this.backends.length
            ? this.backends[i + 1].backend
            : "in_memory",
          reason,
          timestamp: new Date().toISOString(),
        });
      }
    }
    throw new Error("All storage backends failed");
  }

  async retrieve(id: string): Promise<AnyMemory | null> {
    for (const backend of this.backends) {
      try {
        if (await backend.isAvailable()) {
          const result = await backend.retrieve(id);
          if (result) return result;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  async delete(id: string): Promise<boolean> {
    let deleted = false;
    for (const backend of this.backends) {
      try {
        if (await backend.isAvailable()) {
          const result = await backend.delete(id);
          if (result) deleted = true;
        }
      } catch {
        continue;
      }
    }
    return deleted;
  }

  async list(options?: StorageListOptions): Promise<AnyMemory[]> {
    for (const backend of this.backends) {
      try {
        if (await backend.isAvailable()) {
          return await backend.list(options);
        }
      } catch {
        continue;
      }
    }
    return [];
  }

  async isAvailable(): Promise<boolean> {
    for (const backend of this.backends) {
      if (await backend.isAvailable()) return true;
    }
    return false;
  }
}
