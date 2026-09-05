/**
 * Memory provider abstraction.
 *
 * Provider-agnostic interface for memory operations (retain, recall, reflect,
 * delete, list) with configuration and event emission.
 */

import { TypedEmitter } from "./emitter.ts";
import {
  AnyMemory,
  CreateMemoryInput,
  MemoryType,
} from "./types.ts";

// ============================================================================
// Provider Types
// ============================================================================

/** Supported memory providers. */
export type MemoryProviderType = "mem0" | "hindsight" | "custom";

/** Memory provider configuration. */
export interface MemoryProviderConfig {
  /** Provider type to use. */
  provider: MemoryProviderType;
  /** Provider-specific settings. */
  settings: Record<string, unknown>;
}

// ============================================================================
// Provider Events
// ============================================================================

/** Memory operation event payload. */
export interface MemoryOperationEvent {
  operation: "retain" | "recall" | "reflect" | "delete" | "list";
  provider: MemoryProviderType;
  memory_id?: string;
  memory_type?: MemoryType;
  timestamp: string;
}

/** Events emitted by the memory provider. */
export interface MemoryProviderEvents {
  memory_operation: MemoryOperationEvent;
}

// ============================================================================
// Provider Interface
// ============================================================================

/**
 * Provider-agnostic interface for memory operations.
 *
 * - retain: store a new memory
 * - recall: retrieve a memory by ID
 * - reflect: search/retrieve memories by query
 * - delete: remove a memory
 * - list: list memories with optional filters
 */
export interface IMemoryProvider {
  /** Provider type identifier. */
  readonly providerType: MemoryProviderType;

  /** Store a new memory entry. */
  retain(input: CreateMemoryInput): Promise<AnyMemory>;

  /** Retrieve a memory by ID. */
  recall(id: string): Promise<AnyMemory | null>;

  /** Search/retrieve memories matching a query. */
  reflect(query: string, options?: ReflectOptions): Promise<AnyMemory[]>;

  /** Delete a memory by ID. */
  delete(id: string): Promise<boolean>;

  /** List memories with optional type/status filters. */
  list(options?: ListOptions): Promise<AnyMemory[]>;
}

/** Options for reflect (search) operations. */
export interface ReflectOptions {
  /** Filter by memory type. */
  type?: MemoryType;
  /** Maximum results to return. */
  max_results?: number;
  /** Minimum relevance score (0-1). */
  relevance_threshold?: number;
  /** Session ID scope. */
  session_id?: string;
}

/** Options for list operations. */
export interface ListOptions {
  /** Filter by memory type. */
  type?: MemoryType;
  /** Filter by status. */
  status?: "active" | "archived" | "deleted";
  /** Maximum results to return. */
  max_results?: number;
  /** Session ID scope. */
  session_id?: string;
}

// ============================================================================
// Memory Provider Implementation
// ============================================================================

/**
 * Concrete memory provider with event emission.
 *
 * Wraps a provider-specific implementation and emits memory_operation events
 * for observability.
 */
export class MemoryProvider extends TypedEmitter<MemoryProviderEvents> implements IMemoryProvider {
  private _providerType: MemoryProviderType;
  private _config: MemoryProviderConfig;

  constructor(config: MemoryProviderConfig) {
    super();
    this._config = config;
    this._providerType = config.provider;
  }

  get providerType(): MemoryProviderType {
    return this._providerType;
  }

  get config(): MemoryProviderConfig {
    return {
      ...this._config,
      settings: { ...this._config.settings },
    };
  }

  async retain(input: CreateMemoryInput): Promise<AnyMemory> {
    this.emit("memory_operation", {
      operation: "retain",
      provider: this._providerType,
      memory_type: input.type,
      timestamp: new Date().toISOString(),
    });

    // Base memory creation — subclasses or providers extend this
    const now = new Date().toISOString();
    const memory = this.createMemoryEntry(input, now);
    return memory;
  }

  async recall(_id: string): Promise<AnyMemory | null> {
    this.emit("memory_operation", {
      operation: "recall",
      provider: this._providerType,
      timestamp: new Date().toISOString(),
    });
    return null;
  }

  async reflect(_query: string, _options?: ReflectOptions): Promise<AnyMemory[]> {
    this.emit("memory_operation", {
      operation: "reflect",
      provider: this._providerType,
      timestamp: new Date().toISOString(),
    });
    return [];
  }

  async delete(_id: string): Promise<boolean> {
    this.emit("memory_operation", {
      operation: "delete",
      provider: this._providerType,
      timestamp: new Date().toISOString(),
    });
    return false;
  }

  async _list(_options?: ListOptions): Promise<AnyMemory[]> {
    this.emit("memory_operation", {
      operation: "list",
      provider: this._providerType,
      timestamp: new Date().toISOString(),
    });
    return [];
  }

  // alias for interface compliance
  async list(options?: ListOptions): Promise<AnyMemory[]> {
    return this._list(options);
  }

  /**
   * Create a memory entry from input with defaults applied.
   */
  private createMemoryEntry(input: CreateMemoryInput, now: string): AnyMemory {
    const base = {
      id: crypto.randomUUID(),
      content: input.content,
      session_id: input.session_id,
      created_at: now,
      updated_at: now,
      status: "active" as const,
      metadata: input.metadata ?? {},
    };

    switch (input.type) {
      case "short_term":
        return {
          ...base,
          type: "short_term",
          expires_at: input.expires_at ??
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
      case "long_term":
        return {
          ...base,
          type: "long_term",
          importance: input.importance ?? 0.5,
          access_count: 0,
        };
      case "episodic":
        return {
          ...base,
          type: "episodic",
          participants: input.participants ?? [],
          interaction_summary: input.interaction_summary,
          direction: input.direction,
          interaction_timestamp: input.interaction_timestamp ?? now,
        };
      case "semantic":
        return {
          ...base,
          type: "semantic",
          fact: input.fact,
          confidence: input.confidence ?? 1.0,
          source: input.source,
        };
    }
  }
}
