# src/main.ts · [[main-application-harness]]

- CliArgs · interface · L26-L30 — interface CliArgs
- parseArgs · function · L32-L52 — function parseArgs(args: string[]): CliArgs
- HarnessComponents · interface · L58-L65 — interface HarnessComponents
- initializeHarness · function · L67-L102 — async function initializeHarness(configDir?: string): Promise<HarnessComponents>
- createRouter · function · L108-L166 — function createRouter(components: HarnessComponents)
- handleGetSessions · function · L172-L183 — function handleGetSessions( components: HarnessComponents, headers: Record<string, string>, ): Response
- handleGetSession · function · L185-L200 — function handleGetSession( components: HarnessComponents, sessionId: string, headers: Record<string, string>, ): Response
- handleGetSessionEvents · function · L202-L222 — function handleGetSessionEvents( components: HarnessComponents, sessionId: string, url: URL, headers: Record<string, string>, ): Response
- handleCreateSession · function · L224-L241 — async function handleCreateSession( request: Request, components: HarnessComponents, headers: Record<string, string>, ): Promise<Response>
- handlePatchSession · function · L243-L293 — async function handlePatchSession( request: Request, sessionId: string, components: HarnessComponents, headers: Record<string, string>, ): Promise<Response>
- handleGetCapabilities · function · L295-L306 — function handleGetCapabilities( components: HarnessComponents, headers: Record<string, string>, ): Response
- handleGetHealth · function · L308-L318 — function handleGetHealth( components: HarnessComponents, headers: Record<string, string>, ): Response
- WebSocketClient · interface · L324-L332 — interface WebSocketClient
- handleWebSocketUpgrade · function · L337-L458 — function handleWebSocketUpgrade( request: Request, components: HarnessComponents, ): Response
- main · function · L486-L556 — async function main()
