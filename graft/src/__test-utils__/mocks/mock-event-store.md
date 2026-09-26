# src/__test-utils__/mocks/mock-event-store.ts

- MockEventStoreConfig · interface · L10-L13 — interface MockEventStoreConfig
- MockEventStore · class · L15-L239 — class MockEventStore implements IEventStore
- constructor · method · L23-L34 — constructor(config: MockEventStoreConfig = {})
- store · method · L36-L40 — store(event: BaseEvent): void
- getEvents · method · L42-L47 — getEvents(sessionId: string): readonly BaseEvent[]
- getEventsInRange · method · L49-L63 — getEventsInRange( sessionId: string, from: number, to: number, ): readonly BaseEvent[]
- getLastEvent · method · L65-L71 — getLastEvent(sessionId: string): BaseEvent | undefined
- hasSession · method · L73-L76 — hasSession(sessionId: string): boolean
- getSessionIds · method · L78-L81 — getSessionIds(): string[]
- createSnapshot · method · L83-L103 — createSnapshot( sessionId: string, state: Record<string, unknown>, ): Snapshot
- getLatestSnapshot · method · L105-L109 — getLatestSnapshot(sessionId: string): Snapshot | undefined
- getEventsAfterSnapshot · method · L111-L126 — getEventsAfterSnapshot( sessionId: string, snapshot: Snapshot, ): readonly BaseEvent[]
- flush · method · L128-L130 — flush(): void
- buildCausalGraph · method · L132-L154 — buildCausalGraph( sessionId: string, ): Map<string, { event: BaseEvent; children: string[] }>
- findDownstream · method · L156-L186 — findDownstream(eventId: string): BaseEvent[]
- findIndependentChains · method · L188-L231 — findIndependentChains(sessionId: string): string[][]
- reset · method · L233-L238 — reset(): void
