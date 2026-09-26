# src/memory/shared.ts · [[memory-system]]

- SharedMemoryEvent · interface · L16-L22 — interface SharedMemoryEvent
- SharedMemoryEvents · interface · L25-L27 — interface SharedMemoryEvents
- MemorySnapshot · interface · L34-L43 — interface MemorySnapshot
- ISharedMemory · interface · L52-L64 — interface ISharedMemory
- SnapshotOptions · interface · L67-L72 — interface SnapshotOptions
- SharedMemory · class · L85-L192 — class SharedMemory extends TypedEmitter<SharedMemoryEvents> implements ISharedMemory
- constructor · method · L92-L99 — constructor(memories?: AnyMemory[])
- addMemory · method · L102-L104 — addMemory(memory: AnyMemory): void
- removeMemory · method · L107-L109 — removeMemory(id: string): boolean
- getAllMemories · method · L112-L114 — getAllMemories(): AnyMemory[]
- shareContext · method · L116-L133 — async shareContext(agent_id: string, memory_ids: string[]): Promise<void>
- reference · method · L135-L153 — async reference(agent_id: string, memory_id: string): Promise<AnyMemory | null>
- getSnapshot · method · L155-L187 — async getSnapshot(agent_id: string, options?: SnapshotOptions): Promise<MemorySnapshot>
- getSharedAgents · method · L189-L191 — getSharedAgents(): string[]
