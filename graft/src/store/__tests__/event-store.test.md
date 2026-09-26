# src/store/__tests__/event-store.test.ts · [[event-sourcing-persistence-system]]

- createTestEvent · function · L8-L23 — function createTestEvent( sessionId: string, sequenceNumber: number, eventType: (typeof EventTypes)[keyof typeof EventTypes] = EventTypes.SESSION_CREATED, ): BaseEvent
