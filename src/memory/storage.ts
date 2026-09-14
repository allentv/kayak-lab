/**
 * Memory storage abstraction.
 *
 * Defines IMemoryStorage interface and implementations: InMemoryStorage,
 * PersistentStorage, DistributedStorage, with a FallbackStorage chain.
 */

import { TypedEmitter } from "./emitter.ts";
import type { AnyMemory, MemoryType, ScenarioMemory, CoreMemory } from "./types.ts";

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
export type StorageBackend = "in_memory" | "persistent" | "distributed" | "duckdb" | "sqlite";

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

  // -----------------------------------------------------------------------
  // L2 Scenario Memory
  // -----------------------------------------------------------------------

  /** Write (upsert) a scenario memory. Returns the stored scenario. */
  writeScenario(agentId: string, path: string, content: string, name?: string): Promise<ScenarioMemory>;

  /** Read a scenario by agent and path. Returns null if not found. */
  readScenario(agentId: string, path: string): Promise<ScenarioMemory | null>;

  /** List scenarios for an agent, optionally filtered by path prefix. */
  listScenarios(agentId: string, prefix?: string): Promise<ScenarioMemory[]>;

  /** Delete a scenario by agent and path. Returns true if deleted. */
  deleteScenario(agentId: string, path: string): Promise<boolean>;

  /** Count scenarios for an agent. */
  countScenarios(agentId: string): Promise<number>;

  // -----------------------------------------------------------------------
  // L3 Core Memory
  // -----------------------------------------------------------------------

  /** Read core memory for an agent. Returns null if not found. */
  readCore(agentId: string): Promise<CoreMemory | null>;

  /** Write (upsert) core memory for an agent. Returns the stored core memory. */
  writeCore(agentId: string, sections: Record<string, string>): Promise<CoreMemory>;

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
  private scenarios_ = new Map<string, ScenarioMemory>();
  private cores_ = new Map<string, CoreMemory>();

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

  // L2 Scenario Memory
  async writeScenario(agentId: string, path: string, content: string, name?: string): Promise<ScenarioMemory> {
    const key = `${agentId}:${path}`;
    const existing = this.scenarios_.get(key);
    const now = new Date().toISOString();

    const scenario: ScenarioMemory = {
      id: existing?.id ?? crypto.randomUUID(),
      type: "scenario",
      path,
      name: name ?? path,
      agent_id: agentId,
      content,
      session_id: "",
      created_at: existing?.created_at ?? now,
      updated_at: now,
      status: "active",
      metadata: {},
    };

    this.scenarios_.set(key, scenario);
    return { ...scenario };
  }

  async readScenario(agentId: string, path: string): Promise<ScenarioMemory | null> {
    const key = `${agentId}:${path}`;
    const scenario = this.scenarios_.get(key);
    return scenario ? { ...scenario } : null;
  }

  async listScenarios(agentId: string, prefix?: string): Promise<ScenarioMemory[]> {
    return Array.from(this.scenarios_.values())
      .filter((s) => s.agent_id === agentId && (!prefix || s.path.startsWith(prefix)))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  async deleteScenario(agentId: string, path: string): Promise<boolean> {
    const key = `${agentId}:${path}`;
    return this.scenarios_.delete(key);
  }

  async countScenarios(agentId: string): Promise<number> {
    return Array.from(this.scenarios_.values()).filter((s) => s.agent_id === agentId).length;
  }

  // L3 Core Memory
  async readCore(agentId: string): Promise<CoreMemory | null> {
    const core = this.cores_.get(agentId);
    return core ? { ...core } : null;
  }

  async writeCore(agentId: string, sections: Record<string, string>): Promise<CoreMemory> {
    const existing = this.cores_.get(agentId);
    const now = new Date().toISOString();

    const core: CoreMemory = {
      id: existing?.id ?? crypto.randomUUID(),
      type: "core",
      agent_id: agentId,
      sections: { ...sections },
      content: JSON.stringify(sections),
      session_id: "",
      created_at: existing?.created_at ?? now,
      updated_at: now,
      status: "active",
      metadata: {},
    };

    this.cores_.set(agentId, core);
    return { ...core };
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

  // L2 Scenario stubs (not implemented for persistent file store)
  async writeScenario(_agentId: string, _path: string, _content: string, _name?: string): Promise<ScenarioMemory> {
    throw new Error("Scenario storage not implemented in PersistentStorage");
  }
  async readScenario(_agentId: string, _path: string): Promise<ScenarioMemory | null> { return null; }
  async listScenarios(_agentId: string, _prefix?: string): Promise<ScenarioMemory[]> { return []; }
  async deleteScenario(_agentId: string, _path: string): Promise<boolean> { return false; }
  async countScenarios(_agentId: string): Promise<number> { return 0; }

  // L3 Core stubs (not implemented for persistent file store)
  async readCore(_agentId: string): Promise<CoreMemory | null> { return null; }
  async writeCore(_agentId: string, _sections: Record<string, string>): Promise<CoreMemory> {
    throw new Error("Core storage not implemented in PersistentStorage");
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

  // L2 Scenario stubs (distributed storage not implemented)
  async writeScenario(_agentId: string, _path: string, _content: string, _name?: string): Promise<ScenarioMemory> {
    throw new Error("Distributed storage not available");
  }
  async readScenario(_agentId: string, _path: string): Promise<ScenarioMemory | null> { return null; }
  async listScenarios(_agentId: string, _prefix?: string): Promise<ScenarioMemory[]> { return []; }
  async deleteScenario(_agentId: string, _path: string): Promise<boolean> { return false; }
  async countScenarios(_agentId: string): Promise<number> { return 0; }

  // L3 Core stubs (distributed storage not implemented)
  async readCore(_agentId: string): Promise<CoreMemory | null> { return null; }
  async writeCore(_agentId: string, _sections: Record<string, string>): Promise<CoreMemory> {
    throw new Error("Distributed storage not available");
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

  // L2 Scenario — delegate to first available backend
  async writeScenario(agentId: string, path: string, content: string, name?: string): Promise<ScenarioMemory> {
    for (const backend of this.backends) {
      if (await backend.isAvailable()) return backend.writeScenario(agentId, path, content, name);
    }
    throw new Error("All storage backends failed");
  }
  async readScenario(agentId: string, path: string): Promise<ScenarioMemory | null> {
    for (const backend of this.backends) {
      if (await backend.isAvailable()) return backend.readScenario(agentId, path);
    }
    return null;
  }
  async listScenarios(agentId: string, prefix?: string): Promise<ScenarioMemory[]> {
    for (const backend of this.backends) {
      if (await backend.isAvailable()) return backend.listScenarios(agentId, prefix);
    }
    return [];
  }
  async deleteScenario(agentId: string, path: string): Promise<boolean> {
    let deleted = false;
    for (const backend of this.backends) {
      if (await backend.isAvailable()) {
        if (await backend.deleteScenario(agentId, path)) deleted = true;
      }
    }
    return deleted;
  }
  async countScenarios(agentId: string): Promise<number> {
    for (const backend of this.backends) {
      if (await backend.isAvailable()) return backend.countScenarios(agentId);
    }
    return 0;
  }

  // L3 Core — delegate to first available backend
  async readCore(agentId: string): Promise<CoreMemory | null> {
    for (const backend of this.backends) {
      if (await backend.isAvailable()) return backend.readCore(agentId);
    }
    return null;
  }
  async writeCore(agentId: string, sections: Record<string, string>): Promise<CoreMemory> {
    for (const backend of this.backends) {
      if (await backend.isAvailable()) return backend.writeCore(agentId, sections);
    }
    throw new Error("All storage backends failed");
  }
}
