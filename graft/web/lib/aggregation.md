# web/lib/aggregation.ts · [[aggregation-layer]]

- AggregatedSession · interface · L12-L18 — interface AggregatedSession
- AggregatedEvent · interface · L20-L26 — interface AggregatedEvent
- AggregatedCapability · interface · L28-L33 — interface AggregatedCapability
- AggregatedState · interface · L35-L40 — interface AggregatedState
- HarnessStatus · interface · L42-L47 — interface HarnessStatus
- querySql · function · L64-L71 — async function querySql<T>(sql: string): Promise<T[]>
- onHarnessEvent · function · L81-L83 — function onHarnessEvent(_harnessUrl: string, _event: unknown): void
- updateCapabilities · function · L89-L91 — function updateCapabilities(_harnessUrl: string, _capabilities: unknown[]): void
- updateHarnessStatus · function · L96-L108 — function updateHarnessStatus( url: string, status: "connected" | "disconnected", ): void
- getAggregatedState · function · L113-L178 — async function getAggregatedState(): Promise<AggregatedState>
- onStateChange · function · L183-L190 — function onStateChange( listener: (state: AggregatedState) => void, ): () => void
- notifyListeners · function · L195-L201 — function notifyListeners(): void
