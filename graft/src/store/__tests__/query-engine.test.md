# src/store/__tests__/query-engine.test.ts · [[analytics-query-engines]]

- createTestEvent · function · L9-L26 — function createTestEvent( sessionId: string, sequenceNumber: number, eventType: (typeof EventTypes)[keyof typeof EventTypes] = EventTypes.SESSION_CREATED, payload: Record<string, unknown> = {}, timestamp?: string, ): BaseEvent
