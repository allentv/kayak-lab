/**
 * Bounded queue with configurable overflow policies.
 *
 * Supports drop-oldest, drop-newest, block, and reject policies
 * for handling queue overflow.
 */

/** Overflow policy for bounded queue. */
export type OverflowPolicy =
  | "drop-oldest"   // Remove oldest item when full
  | "drop-newest"   // Discard new item when full
  | "block"         // Wait until space available
  | "reject";       // Throw error when full

/** Configuration for bounded queue. */
export interface BoundedQueueConfig {
  /** Maximum queue size. */
  maxSize: number;
  /** Overflow policy. */
  policy: OverflowPolicy;
}

/**
 * Bounded queue with overflow policies.
 */
export class BoundedQueue<T> {
  private items: T[] = [];
  private config: BoundedQueueConfig;
  private waiters: Array<{ resolve: (value: T) => void }> = [];

  constructor(config: BoundedQueueConfig) {
    this.config = config;
  }

  /**
   * Add an item to the queue.
   * Behavior depends on overflow policy when queue is full.
   */
  push(item: T): void {
    // If queue has space, just add
    if (this.items.length < this.config.maxSize) {
      this.items.push(item);
      this.resolveWaiter();
      return;
    }

    // Queue is full — apply overflow policy
    switch (this.config.policy) {
      case "drop-oldest":
        this.items.shift(); // Remove oldest
        this.items.push(item);
        break;

      case "drop-newest":
        // Discard the new item
        break;

      case "block":
        // Will be handled by waitAndPush
        break;

      case "reject":
        throw new Error("Queue is full");
    }
  }

  /**
   * Add an item, waiting if queue is full (block policy).
   */
  async waitAndPush(item: T): Promise<void> {
    if (this.items.length < this.config.maxSize) {
      this.items.push(item);
      return;
    }

    if (this.config.policy !== "block") {
      this.push(item);
      return;
    }

    // Wait for space using polling
    const { promise, resolve } = Promise.withResolvers<void>();
    const checkSpace = () => {
      if (this.items.length < this.config.maxSize) {
        this.items.push(item);
        resolve();
      } else {
        setTimeout(checkSpace, 10);
      }
    };
    checkSpace();
    await promise;
  }

  /**
   * Remove and return the oldest item.
   * Returns undefined if queue is empty.
   */
  shift(): T | undefined {
    return this.items.shift();
  }

  /**
   * Peek at the oldest item without removing.
   */
  peek(): T | undefined {
    return this.items[0];
  }

  /**
   * Get current queue size.
   */
  get size(): number {
    return this.items.length;
  }

  /**
   * Get remaining capacity.
   */
  get remaining(): number {
    return this.config.maxSize - this.items.length;
  }

  /**
   * Check if queue is full.
   */
  get isFull(): boolean {
    return this.items.length >= this.config.maxSize;
  }

  /**
   * Clear all items from the queue.
   */
  clear(): void {
    this.items = [];
  }

  /**
   * Get all items as an array (for inspection).
   */
  toArray(): readonly T[] {
    return this.items;
  }

  /**
   * Resolve a waiter if any are waiting.
   */
  private resolveWaiter(): void {
    if (this.waiters.length > 0 && this.items.length < this.config.maxSize) {
      const waiter = this.waiters.shift()!;
      const item = this.items.shift();
      if (item !== undefined) {
        waiter.resolve(item);
      }
    }
  }
}
