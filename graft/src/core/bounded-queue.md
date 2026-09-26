# src/core/bounded-queue.ts · [[core-resilience-fault-tolerance]]

- OverflowPolicy · type · L9-L13 — Defines the four strategies for handling queue overflow: dropping oldest items, dropping newest items, blocking until space is available, or rejecting new items with an error.
- BoundedQueueConfig · interface · L16-L21 — Specifies the configuration parameters for a bounded queue, including its maximum size and overflow handling policy.
- BoundedQueue · class · L26-L157 — Provides a thread-safe bounded queue implementation that enforces capacity limits and applies configurable overflow policies when full.
- constructor · method · L31-L33 — Initializes the bounded queue with its configuration including maximum size and overflow policy.
- push · method · L39-L65 — Adds an item to the queue, applying the configured overflow policy (drop-oldest, drop-newest, block, or reject) when the queue is full.
- waitAndPush · method · L70-L93 — Adds an item to the queue with blocking behavior when configured, waiting for space to become available through polling.
- checkSpace · function · L83-L90 — Polling function that repeatedly checks for available space in the queue when using the block policy, pushing the item when capacity allows.
- shift · method · L99-L101 — Removes and returns the oldest item from the queue, returning undefined if the queue is empty.
- peek · method · L106-L108 — Returns the oldest item in the queue without removing it, allowing inspection of the next item to be processed.
- size · method · L113-L115 — Returns the current number of items in the queue for monitoring queue utilization.
- remaining · method · L120-L122 — Calculates the remaining capacity of the queue by subtracting current size from maximum size.
- isFull · method · L127-L129 — Determines whether the queue has reached its maximum capacity, triggering overflow policy application.
- clear · method · L134-L136 — Removes all items from the queue, resetting it to an empty state.
- toArray · method · L141-L143 — Returns a read-only copy of all queue items for inspection without modifying the queue state.
- resolveWaiter · method · L148-L156 — Resolves waiting consumers when items become available, ensuring blocked push operations can complete.
