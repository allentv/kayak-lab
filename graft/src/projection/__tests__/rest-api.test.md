# src/projection/__tests__/rest-api.test.ts · [[projection-system]]

- MockSessionManager · class · L19-L49 — class MockSessionManager
- getSessions · method · L22-L24 — getSessions()
- getSession · method · L26-L28 — getSession(id: string)
- createSession · method · L30-L41 — createSession(options?: { description?: string; config?: Record<string, unknown> })
- cancelSession · method · L43-L48 — cancelSession(id: string)
- MockEventStore · class · L51-L96 — class MockEventStore
- store · method · L54-L58 — store(event: BaseEvent): void
- getEvents · method · L60-L62 — getEvents(sessionId: string): readonly BaseEvent[]
- getEventsInRange · method · L64-L68 — getEventsInRange(sessionId: string, from: number, to: number): readonly BaseEvent[]
- getLastEvent · method · L70-L73 — getLastEvent(sessionId: string): BaseEvent | undefined
- hasSession · method · L75-L77 — hasSession(sessionId: string): boolean
- getSessionIds · method · L79-L81 — getSessionIds(): string[]
- createSnapshot · method · L83-L85 — createSnapshot(sessionId: string, state: Record<string, unknown>)
- getLatestSnapshot · method · L87-L89 — getLatestSnapshot(_sessionId: string)
- getEventsAfterSnapshot · method · L91-L93 — getEventsAfterSnapshot(_sessionId: string, _snapshot: unknown)
- flush · method · L95-L95 — flush(): void
- createTestEvent · function · L102-L117 — function createTestEvent( type: string = EventTypes.SESSION_CREATED, sessionId = "test-session", seq = 1, ): BaseEvent
- makeRequest · function · L119-L130 — function makeRequest( method: string, path: string, options?: { body?: unknown; headers?: Record<string, string> }, ): Request
