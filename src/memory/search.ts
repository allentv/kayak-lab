/**
 * Memory search abstraction.
 *
 * Supports semantic search (vector similarity), keyword search,
 * and combined search (semantic + keyword).
 */

import { TypedEmitter } from "./emitter.ts";
import type { AnyMemory, MemoryType } from "./types.ts";

// ============================================================================
// Search Events
// ============================================================================

/** Memory search event payload. */
export interface MemorySearchEvent {
  query: string;
  search_type: SearchType;
  filters?: SearchFilters;
  timestamp: string;
}

/** Memory search result event payload. */
export interface MemorySearchResultEvent {
  query: string;
  search_type: SearchType;
  result_count: number;
  timestamp: string;
}

/** Events emitted by search operations. */
export interface MemorySearchEvents {
  memory_search: MemorySearchEvent;
  memory_search_result: MemorySearchResultEvent;
}

// ============================================================================
// Search Types
// ============================================================================

/** Search mode. */
export type SearchType = "semantic" | "keyword" | "combined";

/** Search filters. */
export interface SearchFilters {
  /** Filter by memory type. */
  type?: MemoryType;
  /** Session ID scope. */
  session_id?: string;
  /** Status filter. */
  status?: "active" | "archived" | "deleted";
}

/** Search configuration. */
export interface SearchConfig {
  /** Maximum results per search. */
  max_results: number;
  /** Minimum relevance score (0-1). */
  relevance_threshold: number;
  /** Default search type. */
  default_type: SearchType;
}

/** Options for a search request. */
export interface SearchOptions {
  /** Search type override. */
  type?: SearchType;
  /** Filters. */
  filters?: SearchFilters;
  /** Max results override. */
  max_results?: number;
  /** Relevance threshold override. */
  relevance_threshold?: number;
}

/** A single search result with score. */
export interface SearchResult {
  memory: AnyMemory;
  score: number;
}

// ============================================================================
// Search Interface
// ============================================================================

/**
 * Interface for memory search operations.
 */
export interface IMemorySearch {
  /** Perform semantic search (vector similarity). */
  semanticSearch(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /** Perform keyword search. */
  keywordSearch(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /** Perform combined semantic + keyword search. */
  combinedSearch(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /** Search with auto-detected type or configured default. */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /** Update search configuration. */
  configure(config: Partial<SearchConfig>): void;

  /** Get current configuration. */
  getConfig(): SearchConfig;
}

// ============================================================================
// Search Implementation
// ============================================================================

/**
 * Memory search with semantic, keyword, and combined modes.
 *
 * Semantic search uses simple TF-IDF-like scoring for vector similarity.
 * Keyword search matches on content text.
 * Combined search merges both result sets.
 */
export class MemorySearch extends TypedEmitter<MemorySearchEvents> implements IMemorySearch {
  private config: SearchConfig;
  private memories: AnyMemory[];

  /**
   * @param memories - The memory pool to search.
   * @param config - Initial search configuration.
   */
  constructor(memories?: AnyMemory[], config?: Partial<SearchConfig>) {
    super();
    this.memories = memories ?? [];
    this.config = {
      max_results: config?.max_results ?? 10,
      relevance_threshold: config?.relevance_threshold ?? 0.0,
      default_type: config?.default_type ?? "combined",
    };
  }

  /** Update the memory pool (call when memories change). */
  setMemories(memories: AnyMemory[]): void {
    this.memories = memories;
  }

  /** Add a memory to the search pool. Deduplicates by ID. */
  addMemory(memory: AnyMemory): void {
    const existing = this.memories.findIndex((m) => m.id === memory.id);
    if (existing >= 0) {
      this.memories[existing] = memory;
    } else {
      this.memories.push(memory);
    }
  }

  /** Remove a memory from the search pool. */
  removeMemory(id: string): void {
    this.memories = this.memories.filter((m) => m.id !== id);
  }

  async semanticSearch(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    this.emitSearchEvent(query, "semantic", options?.filters);

    const filtered = this.applyFilters(options?.filters);
    const results = filtered.map((memory) => ({
      memory,
      score: this.semanticScore(query, memory),
    }));

    return this.rankAndLimit(results, options);
  }

  async keywordSearch(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    this.emitSearchEvent(query, "keyword", options?.filters);

    const filtered = this.applyFilters(options?.filters);
    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results = filtered.map((memory) => ({
      memory,
      score: this.keywordScore(keywords, memory),
    }));

    return this.rankAndLimit(results, options);
  }

  async combinedSearch(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    this.emitSearchEvent(query, "combined", options?.filters);

    const filtered = this.applyFilters(options?.filters);
    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);

    const results = filtered.map((memory) => {
      const semantic = this.semanticScore(query, memory);
      const keyword = this.keywordScore(keywords, memory);
      // Weighted combination: 60% semantic, 40% keyword
      return {
        memory,
        score: semantic * 0.6 + keyword * 0.4,
      };
    });

    return this.rankAndLimit(results, options);
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const type = options?.type ?? this.config.default_type;
    switch (type) {
      case "semantic":
        return this.semanticSearch(query, options);
      case "keyword":
        return this.keywordSearch(query, options);
      case "combined":
        return this.combinedSearch(query, options);
    }
  }

  configure(config: Partial<SearchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SearchConfig {
    return { ...this.config };
  }

  // --- Private helpers ---

  private applyFilters(filters?: SearchFilters): AnyMemory[] {
    let result = this.memories;
    if (filters?.type) {
      result = result.filter((m) => m.type === filters.type);
    }
    if (filters?.session_id) {
      result = result.filter((m) => m.session_id === filters.session_id);
    }
    if (filters?.status) {
      result = result.filter((m) => m.status === filters.status);
    } else {
      // Default: only active memories
      result = result.filter((m) => m.status === "active");
    }
    return result;
  }

  /**
   * Simple TF-IDF-like semantic scoring.
   * Splits query and content into tokens, counts overlap.
   */
  private semanticScore(query: string, memory: AnyMemory): number {
    const queryTokens = this.tokenize(query);
    const contentTokens = this.tokenize(memory.content);
    const contentSet = new Set(contentTokens);

    if (queryTokens.length === 0 || contentTokens.length === 0) return 0;

    let matches = 0;
    for (const token of queryTokens) {
      if (contentSet.has(token)) matches++;
    }

    return matches / queryTokens.length;
  }

  /**
   * Keyword scoring: checks for exact substring matches.
   */
  private keywordScore(keywords: string[], memory: AnyMemory): number {
    const content = memory.content.toLowerCase();
    if (keywords.length === 0) return 0;

    let matches = 0;
    for (const kw of keywords) {
      if (content.includes(kw)) matches++;
    }

    return matches / keywords.length;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s,.;:!?()]+/)
      .filter((t) => t.length > 1);
  }

  private rankAndLimit(results: SearchResult[], options?: SearchOptions): Promise<SearchResult[]> {
    const threshold = options?.relevance_threshold ?? this.config.relevance_threshold;
    const maxResults = options?.max_results ?? this.config.max_results;

    const filtered = results
      .filter((r) => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    this.emit("memory_search_result", {
      query: "",
      search_type: options?.type ?? this.config.default_type,
      result_count: filtered.length,
      timestamp: new Date().toISOString(),
    });

    return Promise.resolve(filtered);
  }

  private emitSearchEvent(
    query: string,
    searchType: SearchType,
    filters?: SearchFilters,
  ): void {
    this.emit("memory_search", {
      query,
      search_type: searchType,
      filters,
      timestamp: new Date().toISOString(),
    });
  }
}
