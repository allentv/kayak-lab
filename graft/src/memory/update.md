# src/memory/update.ts · [[memory-system]]

- MemoryUpdatedEvent · interface · L16-L21 — Defines the payload structure for memory update events, capturing whether the operation was automatic or manual along with timing and operation type.
- MemoryUpdateEvents · interface · L24-L26 — Declares the event map for memory update operations, currently containing only the memory_updated event.
- IMemoryUpdate · interface · L35-L44 — Specifies the contract for memory update operations, separating automatic storage from manual storage and updates.
- MemoryUpdate · class · L56-L107 — Implements memory storage and updates with automatic/manual distinction, emitting events after successful operations.
- constructor · method · L64-L71 — Initializes the memory update component with dependency-injected storage and update functions.
- autoStore · method · L73-L82 — Stores a memory automatically during agent interactions and emits an event marking it as automatic.
- manualStore · method · L84-L93 — Stores a memory manually via user command and emits an event marking it as manual.
- update · method · L95-L106 — Updates an existing memory and emits an event only if the update was successful.
