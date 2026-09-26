# web/lib/harness-connection.ts · [[harness-connection-manager]]

- HarnessConnection · interface · L8-L14 — interface HarnessConnection
- HarnessState · interface · L16-L19 — interface HarnessState
- connectToHarness · function · L29-L46 — function connectToHarness(url: string): HarnessConnection
- connectWebSocket · function · L51-L102 — function connectWebSocket(connection: HarnessConnection): void
- scheduleReconnect · function · L107-L118 — function scheduleReconnect(connection: HarnessConnection): void
- handleHarnessEvent · function · L123-L128 — function handleHarnessEvent(harnessUrl: string, event: unknown): void
- onHarnessStateChange · function · L133-L140 — function onHarnessStateChange( listener: (harnesses: Map<string, HarnessConnection>) => void, ): () => void
- notifyListeners · function · L145-L149 — function notifyListeners(): void
- getHarnessConnections · function · L154-L156 — function getHarnessConnections(): Map<string, HarnessConnection>
- connectFromEnv · function · L161-L171 — function connectFromEnv(): void
