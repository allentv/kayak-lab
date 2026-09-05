/**
 * Memory retrieval abstraction.
 *
 * On-demand retrieval that does NOT inject into context window.
 * Agents request memories explicitly, preserving context space.
 */

import { TypedEmitter } from "./emitter.ts";
import type { AnyMemory, MemoryType } from "./types.ts";

// ============================================================================
// Retrieval Events
// ============================================================================

/** Memory retrieved event payload. */
export interface MemoryRetrievedEvent {
  query?: string;
  result_count: number;
  session_id?: string;
  timestamp: string;
}

/** Events emitted by retrieval operations. */
export interface MemoryRetrievalEvents {
  memory_retrieved: MemoryRetrievedEvent;
}

// ============================================================================
// Retrieval Types
// ============================================================================

/** Retrieval configuration. */
export interface RetrievalConfig {
  /** Maximum results to return per retrieval. */
  max_results: number;
  /** Minimum relevance score (0-1). */
  relevance_threshold: number;
  /** Scope: current session or all sessions. */
  scope: "session" | "all";
}

/** Options for a retrieval request. */
export interface RetrievalOptions {
  /** Optional query string. */
  query?: string;
  /** Filter by memory type. */
  type?: MemoryType;
  /** Override max results. */
  max_results?: number;
  /** Override relevance threshold. */
  relevance_threshold?: number;
  /** Session ID for scoped retrieval. */
  session_id?: string;
}

// ============================================================================
// Retrieval Interface
// ============================================================================

/**
 * Interface for on-demand memory retrieval.
 */
export interface IMemoryRetrieval {
  /** Retrieve memories matching the given options. */
  retrieve(options?: RetrievalOptions): Promise<AnyMemory[]>;

  /** Update retrieval configuration. */
  configure(config: Partial<RetrievalConfig>): void;

  /** Get current configuration. */
  getConfig(): RetrievalConfig;
}

// ============================================================================
// On-demand Retrieval Implementation
// ============================================================================

/**
 * On-demand memory retrieval.
 *
 * Memories are returned to the agent on request, never automatically
 * injected into the context window. This preserves context space.
 */
export class MemoryRetrieval extends TypedEmitter<MemoryRetrievalEvents> implements IMemoryRetrieval {
  private config: RetrievalConfig;
  private retrieveFn: (options?: RetrievalOptions) => Promise<AnyMemory[]>;

  /**
   * @param retrieveFn - Function that fetches memories from storage.
   * @param config - Initial retrieval configuration.
   */
  constructor(
    retrieveFn: (options?: RetrievalOptions) => Promise<AnyMemory[]>,
    config?: Partial<RetrievalConfig>,
  ) {
    super();
    this.retrieveFn = retrieveFn;
    this.config = {
      max_results: config?.max_results ?? 10,
      relevance_threshold: config?.relevance_threshold ?? 0.0,
      scope: config?.scope ?? "all",
    };
  }

  async retrieve(options?: RetrievalOptions): Promise<AnyMemory[]> {
    const effectiveOptions: RetrievalOptions = {
      ...options,
      max_results: options?.max_results ?? this.config.max_results,
      relevance_threshold: options?.relevance_threshold ?? this.config.relevance_threshold,
    };

    // Apply scope default
    if (!effectiveOptions.session_id && this.config.scope === "session") {
      // Scope is session-only but no session_id provided — return empty
      this.emit("memory_retrieved", {
        result_count: 0,
        timestamp: new Date().toISOString(),
      });
      return [];
    }

    const results = await this.retrieveFn(effectiveOptions);

    this.emit("memory_retrieved", {
      query: effectiveOptions.query,
      result_count: results.length,
      session_id: effectiveOptions.session_id,
      timestamp: new Date().toISOString(),
    });

    return results;
  }

  configure(config: Partial<RetrievalConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): RetrievalConfig {
    return { ...this.config };
  }
}
