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

/** Memory retrieval result with provenance score. */
export interface MemoryRetrievalResult {
  /** The memory entry. */
  memory: AnyMemory;
  /** Relevance score (0-1). */
  relevance_score: number;
  /** Provenance score: +1.0 success-linked, -0.5 dead-end-linked, 0 unlinked. */
  provenance_score: number;
  /** Final score: relevance_score + 0.3 * provenance_score. */
  final_score: number;
}

// ============================================================================
// Retrieval Interface
// ============================================================================

/**
 * Interface for on-demand memory retrieval.
 */
export interface IMemoryRetrieval {
  /** Retrieve memories matching the given options. */
  retrieve(options?: RetrievalOptions): Promise<MemoryRetrievalResult[]>;

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
  private provenanceWeight: number;

  /**
   * @param retrieveFn - Function that fetches memories from storage.
   * @param config - Initial retrieval configuration.
   */
  constructor(
    retrieveFn: (options?: RetrievalOptions) => Promise<AnyMemory[]>,
    config?: Partial<RetrievalConfig>,
    provenanceWeight?: number,
  ) {
    super();
    this.retrieveFn = retrieveFn;
    this.config = {
      max_results: config?.max_results ?? 10,
      relevance_threshold: config?.relevance_threshold ?? 0.0,
      scope: config?.scope ?? "all",
    };
    this.provenanceWeight = provenanceWeight ?? 0.3;
  }

  async retrieve(options?: RetrievalOptions): Promise<MemoryRetrievalResult[]> {
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

    // Calculate provenance scores for each memory
    const scoredResults: MemoryRetrievalResult[] = results.map(memory => {
      // Calculate relevance score based on memory type and recency
      const relevanceScore = this.calculateRelevanceScore(memory);

      // Calculate provenance score based on session success/failure
      const provenanceScore = this.calculateProvenanceScore(memory);

      // Calculate final score
      const finalScore = relevanceScore + this.provenanceWeight * provenanceScore;

      return {
        memory,
        relevance_score: relevanceScore,
        provenance_score: provenanceScore,
        final_score: finalScore,
      };
    });

    // Sort by final score
    scoredResults.sort((a, b) => b.final_score - a.final_score);

    this.emit("memory_retrieved", {
      query: effectiveOptions.query,
      result_count: scoredResults.length,
      session_id: effectiveOptions.session_id,
      timestamp: new Date().toISOString(),
    });

    return scoredResults;
  }

  configure(config: Partial<RetrievalConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): RetrievalConfig {
    return { ...this.config };
  }

  /**
   * Calculate relevance score based on memory type and recency.
   */
  private calculateRelevanceScore(memory: AnyMemory): number {
    // Base score by memory type
    const typeScores: Record<string, number> = {
      "short_term": 0.3,
      "long_term": 0.8,
      "episodic": 0.6,
      "semantic": 0.7,
    };

    const baseScore = typeScores[memory.type] ?? 0.5;

    // Recency bonus (more recent = higher score)
    const now = Date.now();
    const created = new Date(memory.created_at).getTime();
    const ageMs = now - created;
    const ageHours = ageMs / (1000 * 60 * 60);

    // Decay: lose 0.1 per day, minimum 0.1
    const recencyBonus = Math.max(0.1, 1.0 - (ageHours / 24) * 0.1);

    return Math.min(1.0, baseScore * recencyBonus);
  }

  /**
   * Calculate provenance score based on session success/failure.
   */
  private calculateProvenanceScore(_memory: AnyMemory): number {
    // Without provenance graph access, return neutral score
    // The ProvenanceContextManager handles provenance-aware scoring
    return 0;
  }
}
