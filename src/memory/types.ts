/**
 * Core memory type definitions for the kayak-lab memory system.
 *
 * Defines memory entries, type enums, and type-specific interfaces
 * for short-term, long-term, episodic, and semantic memory.
 */

// ============================================================================
// Memory Types
// ============================================================================

/** Memory type enumeration. */
export type MemoryType = "short_term" | "long_term" | "episodic" | "semantic";

/** Memory entry status. */
export type MemoryStatus = "active" | "archived" | "deleted";

/** Episodic memory interaction direction. */
export type InteractionDirection = "user_to_agent" | "agent_to_user" | "agent_to_agent";

// ============================================================================
// Base Memory Entry
// ============================================================================

/**
 * Base memory entry shared by all memory types.
 */
export interface MemoryEntry {
  /** Unique memory identifier. */
  id: string;
  /** Memory type classification. */
  type: MemoryType;
  /** Memory content (text). */
  content: string;
  /** Session ID that created this memory. */
  session_id: string;
  /** When the memory was created. */
  created_at: string;
  /** When the memory was last updated. */
  updated_at: string;
  /** Memory status. */
  status: MemoryStatus;
  /** Arbitrary metadata for provider-specific data. */
  metadata: Record<string, unknown>;
}

// ============================================================================
// Short-term Memory
// ============================================================================

/**
 * Short-term memory: session-scoped, lost on restart.
 */
export interface ShortTermMemory extends MemoryEntry {
  type: "short_term";
  /** When this memory expires (ISO timestamp). */
  expires_at: string;
}

// ============================================================================
// Long-term Memory
// ============================================================================

/**
 * Long-term memory: persistent across sessions.
 */
export interface LongTermMemory extends MemoryEntry {
  type: "long_term";
  /** Importance score 0-1 for prioritization. */
  importance: number;
  /** Access count for recency weighting. */
  access_count: number;
}

// ============================================================================
// Episodic Memory
// ============================================================================

/**
 * Episodic memory: records specific interactions.
 */
export interface EpisodicMemory extends MemoryEntry {
  type: "episodic";
  /** Who was involved. */
  participants: string[];
  /** What happened (summary). */
  interaction_summary: string;
  /** Direction of interaction. */
  direction: InteractionDirection;
  /** When the interaction occurred. */
  interaction_timestamp: string;
}

// ============================================================================
// Semantic Memory
// ============================================================================

/**
 * Semantic memory: stores facts and knowledge.
 */
export interface SemanticMemory extends MemoryEntry {
  type: "semantic";
  /** The fact or knowledge. */
  fact: string;
  /** Confidence in the fact (0-1). */
  confidence: number;
  /** Source of the fact. */
  source?: string;
}

// ============================================================================
// Union Type
// ============================================================================

/** Any memory entry type. */
export type AnyMemory = ShortTermMemory | LongTermMemory | EpisodicMemory | SemanticMemory;

// ============================================================================
// Input Types (for creating/updating memories)
// ============================================================================

/** Input for creating a short-term memory. */
export interface CreateShortTermInput {
  type: "short_term";
  content: string;
  session_id: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

/** Input for creating a long-term memory. */
export interface CreateLongTermInput {
  type: "long_term";
  content: string;
  session_id: string;
  importance?: number;
  metadata?: Record<string, unknown>;
}

/** Input for creating an episodic memory. */
export interface CreateEpisodicInput {
  type: "episodic";
  content: string;
  session_id: string;
  participants?: string[];
  interaction_summary: string;
  direction: InteractionDirection;
  interaction_timestamp?: string;
  metadata?: Record<string, unknown>;
}

/** Input for creating a semantic memory. */
export interface CreateSemanticInput {
  type: "semantic";
  content: string;
  session_id: string;
  fact: string;
  confidence?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

/** Any create input. */
export type CreateMemoryInput =
  | CreateShortTermInput
  | CreateLongTermInput
  | CreateEpisodicInput
  | CreateSemanticInput;

/** Input for updating a memory entry. */
export interface UpdateMemoryInput {
  content?: string;
  status?: MemoryStatus;
  metadata?: Record<string, unknown>;
  /** Type-specific fields. */
  expires_at?: string;
  importance?: number;
  fact?: string;
  confidence?: number;
}
