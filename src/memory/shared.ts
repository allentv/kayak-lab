/**
 * Shared memory for sub-agents.
 *
 * Provides shared context, memory pointers (by ID), and memory snapshots
 * so sub-agents can access accumulated memory without rebuilding it.
 */

import { TypedEmitter } from "./emitter.ts";
import type { AnyMemory, MemoryType } from "./types.ts";

// ============================================================================
// Shared Memory Events
// ============================================================================

/** Shared memory event payload. */
export interface SharedMemoryEvent {
  operation: "share" | "reference" | "snapshot";
  agent_id: string;
  memory_id?: string;
  snapshot_count?: number;
  timestamp: string;
}

/** Events emitted by shared memory operations. */
export interface SharedMemoryEvents {
  shared_memory: SharedMemoryEvent;
}

// ============================================================================
// Snapshot Types
// ============================================================================

/** A point-in-time snapshot of shared memory. */
export interface MemorySnapshot {
  /** Snapshot ID. */
  id: string;
  /** When the snapshot was taken. */
  timestamp: string;
  /** Agent that requested the snapshot. */
  agent_id: string;
  /** Memories included in the snapshot. */
  memories: AnyMemory[];
}

// ============================================================================
// Shared Memory Interface
// ============================================================================

/**
 * Interface for shared memory operations.
 */
export interface ISharedMemory {
  /** Share a memory context with a sub-agent. */
  shareContext(agent_id: string, memory_ids: string[]): Promise<void>;

  /** Reference a specific memory by ID. */
  reference(agent_id: string, memory_id: string): Promise<AnyMemory | null>;

  /** Get a snapshot of all accessible memories for an agent. */
  getSnapshot(agent_id: string, options?: SnapshotOptions): Promise<MemorySnapshot>;

  /** Get the list of agents sharing this memory context. */
  getSharedAgents(): string[];
}

/** Options for snapshot retrieval. */
export interface SnapshotOptions {
  /** Filter by memory type. */
  type?: MemoryType;
  /** Session ID scope. */
  session_id?: string;
}

// ============================================================================
// Shared Memory Implementation
// ============================================================================

/**
 * Shared memory context for sub-agents.
 *
 * Multiple sub-agents can access the same accumulated memory,
 * reference specific memories by ID, and get snapshots of the
 * current memory state.
 */
export class SharedMemory extends TypedEmitter<SharedMemoryEvents> implements ISharedMemory {
  private memories = new Map<string, AnyMemory>();
  private agentMemories = new Map<string, Set<string>>();

  /**
   * @param memories - Initial memories to share.
   */
  constructor(memories?: AnyMemory[]) {
    super();
    if (memories) {
      for (const m of memories) {
        this.memories.set(m.id, m);
      }
    }
  }

  /** Add a memory to the shared context. */
  addMemory(memory: AnyMemory): void {
    this.memories.set(memory.id, memory);
  }

  /** Remove a memory from the shared context. */
  removeMemory(id: string): boolean {
    return this.memories.delete(id);
  }

  /** Get all memories in the shared context. */
  getAllMemories(): AnyMemory[] {
    return Array.from(this.memories.values());
  }

  async shareContext(agent_id: string, memory_ids: string[]): Promise<void> {
    let ids = this.agentMemories.get(agent_id);
    if (!ids) {
      ids = new Set();
      this.agentMemories.set(agent_id, ids);
    }
    for (const id of memory_ids) {
      if (this.memories.has(id)) {
        ids.add(id);
      }
    }

    this.emit("shared_memory", {
      operation: "share",
      agent_id,
      timestamp: new Date().toISOString(),
    });
  }

  async reference(agent_id: string, memory_id: string): Promise<AnyMemory | null> {
    const memory = this.memories.get(memory_id);
    if (!memory) return null;

    // Check if agent has access — only agents with explicit shareContext get access
    const agentIds = this.agentMemories.get(agent_id);
    if (!agentIds || !agentIds.has(memory_id)) {
      return null;
    }

    this.emit("shared_memory", {
      operation: "reference",
      agent_id,
      memory_id,
      timestamp: new Date().toISOString(),
    });

    return { ...memory };
  }

  async getSnapshot(agent_id: string, options?: SnapshotOptions): Promise<MemorySnapshot> {
    let memories = Array.from(this.memories.values());

    // Filter to agent's shared memories if any restrictions exist
    const agentIds = this.agentMemories.get(agent_id);
    if (agentIds && agentIds.size > 0) {
      memories = memories.filter((m) => agentIds.has(m.id));
    }

    // Apply filters
    if (options?.type) {
      memories = memories.filter((m) => m.type === options.type);
    }
    if (options?.session_id) {
      memories = memories.filter((m) => m.session_id === options.session_id);
    }

    const snapshot: MemorySnapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      agent_id,
      memories,
    };

    this.emit("shared_memory", {
      operation: "snapshot",
      agent_id,
      snapshot_count: memories.length,
      timestamp: new Date().toISOString(),
    });

    return snapshot;
  }

  getSharedAgents(): string[] {
    return Array.from(this.agentMemories.keys());
  }
}
