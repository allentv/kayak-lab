/**
 * Types, enums, and defaults for provenance-aware context management.
 *
 * Extracted from provenance-context.ts to reduce file size and make
 * type definitions independently importable.
 */

// ============================================================================
// Types
// ============================================================================

/** Message priority levels for provenance-weighted scoring. */
export enum MessagePriority {
  SYSTEM = 1000,
  GOAL = 900,
  COMMITMENT = 800,
  VERIFICATION = 700,
  EXPLORATION = 500,
  OTHER = 300,
}

/** Outcome scores for provenance links. */
export enum OutcomeScore {
  SUCCESS = 200,
  FAILURE = -100,
  DEAD_END = -200,
  NO_LINK = 0,
}

/** Token budget allocation for context sections. */
export interface TokenBudget {
  /** Fixed allocation for system prompt. */
  system: number;
  /** Percentage of remaining budget for goal context. */
  goalPercent: number;
  /** Percentage of remaining budget for provenance summary. */
  summaryPercent: number;
  /** Percentage of remaining budget for compressed history. */
  historyPercent: number;
  /** Percentage of remaining budget for retrieved memories. */
  memoriesPercent: number;
}

/** Compression result for tool outputs. */
export interface CompressionResult {
  /** Compressed content (referenced lines only). */
  compressed: string;
  /** Reference to full original for audit. */
  fullReference: string;
  /** Original token count. */
  originalTokens: number;
  /** Compressed token count. */
  compressedTokens: number;
}

/** Configuration for ProvenanceContextManager. */
export interface ProvenanceContextConfig {
  /** Maximum number of messages in context. */
  maxMessages?: number;
  /** Maximum tokens for assembled context. */
  maxTokens?: number;
  /** Token threshold for tool result compression. */
  compressionThreshold?: number;
  /** Weight for provenance score in memory ranking (0-1). */
  provenanceWeight?: number;
  /** Token budget allocation. */
  budget?: TokenBudget;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_BUDGET: TokenBudget = {
  system: 0,
  goalPercent: 25,
  summaryPercent: 15,
  historyPercent: 40,
  memoriesPercent: 20,
};

export const DEFAULT_CONFIG: ProvenanceContextConfig = {
  maxMessages: 100,
  maxTokens: 8000,
  compressionThreshold: 2000,
  provenanceWeight: 0.3,
  budget: DEFAULT_BUDGET,
};

// ============================================================================
// Helpers
// ============================================================================

/** Estimate token count (simple heuristic: ~4 chars per token). */
export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);
