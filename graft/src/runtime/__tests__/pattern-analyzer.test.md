# src/runtime/__tests__/pattern-analyzer.test.ts · [[runtime-orchestration]]

- createTestEvent · function · L10-L27 — function createTestEvent( sessionId: string, sequenceNumber: number, eventType: (typeof EventTypes)[keyof typeof EventTypes] = EventTypes.SESSION_CREATED, payload: Record<string, unknown> = {}, timestamp?: string, ): BaseEvent
