/**
 * Memory update abstraction.
 *
 * Supports both automatic (agent-interaction-driven) and manual
 * (user-initiated) memory storage and updates.
 */

import { TypedEmitter } from "./emitter.ts";
import type { AnyMemory, CreateMemoryInput, UpdateMemoryInput } from "./types.ts";

// ============================================================================
// Update Events
// ============================================================================

/** Memory updated event payload. */
export interface MemoryUpdatedEvent {
  operation: "store" | "update";
  memory_id: string;
  automatic: boolean;
  timestamp: string;
}

/** Events emitted by update operations. */
export interface MemoryUpdateEvents {
  memory_updated: MemoryUpdatedEvent;
}

// ============================================================================
// Update Interface
// ============================================================================

/**
 * Interface for memory update operations.
 */
export interface IMemoryUpdate {
  /** Automatically store a memory from agent interaction context. */
  autoStore(input: CreateMemoryInput): Promise<AnyMemory>;

  /** Manually store a memory (user-initiated). */
  manualStore(input: CreateMemoryInput): Promise<AnyMemory>;

  /** Update an existing memory. */
  update(id: string, input: UpdateMemoryInput): Promise<AnyMemory | null>;
}

// ============================================================================
// Update Implementation
// ============================================================================

/**
 * Memory update with automatic and manual modes.
 *
 * Automatic updates happen during agent interactions.
 * Manual updates are user-initiated through explicit commands.
 */
export class MemoryUpdate extends TypedEmitter<MemoryUpdateEvents> implements IMemoryUpdate {
  private storeFn: (input: CreateMemoryInput) => Promise<AnyMemory>;
  private updateFn: (id: string, input: UpdateMemoryInput) => Promise<AnyMemory | null>;

  /**
   * @param storeFn - Function that persists a new memory.
   * @param updateFn - Function that updates an existing memory.
   */
  constructor(
    storeFn: (input: CreateMemoryInput) => Promise<AnyMemory>,
    updateFn: (id: string, input: UpdateMemoryInput) => Promise<AnyMemory | null>,
  ) {
    super();
    this.storeFn = storeFn;
    this.updateFn = updateFn;
  }

  async autoStore(input: CreateMemoryInput): Promise<AnyMemory> {
    const memory = await this.storeFn(input);
    this.emit("memory_updated", {
      operation: "store",
      memory_id: memory.id,
      automatic: true,
      timestamp: new Date().toISOString(),
    });
    return memory;
  }

  async manualStore(input: CreateMemoryInput): Promise<AnyMemory> {
    const memory = await this.storeFn(input);
    this.emit("memory_updated", {
      operation: "store",
      memory_id: memory.id,
      automatic: false,
      timestamp: new Date().toISOString(),
    });
    return memory;
  }

  async update(id: string, input: UpdateMemoryInput): Promise<AnyMemory | null> {
    const memory = await this.updateFn(id, input);
    if (memory) {
      this.emit("memory_updated", {
        operation: "update",
        memory_id: id,
        automatic: false,
        timestamp: new Date().toISOString(),
      });
    }
    return memory;
  }
}
