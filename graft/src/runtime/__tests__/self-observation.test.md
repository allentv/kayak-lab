# src/runtime/__tests__/self-observation.test.ts · [[runtime-orchestration]] [[self-observation-and-pattern-detection]]

- createTestEvent · function · L11-L27 — function createTestEvent( sessionId: string, sequenceNumber: number, eventType: (typeof EventTypes)[keyof typeof EventTypes] = EventTypes.SESSION_CREATED, payload: Record<string, unknown> = {}, ): BaseEvent
