# src/mcp/client.ts · [[model-context-protocol-mcp-integration]]

- MCPClient · class · L30-L227 — class MCPClient extends EventEmitter implements IMCPClient
- state · method · L38-L40 — get state(): MCPClientState
- tools · method · L42-L44 — get tools(): MCPToolDefinition[]
- constructor · method · L46-L68 — constructor(config: MCPClientConfig)
- setState · method · L70-L92 — private setState(state: MCPClientState, error?: Error): void
- scheduleReconnect · method · L94-L111 — private scheduleReconnect(): void
- connect · method · L113-L157 — async connect(): Promise<void>
- disconnect · method · L159-L169 — async disconnect(): Promise<void>
- discover · method · L171-L195 — async discover(): Promise<MCPToolDefinition[]>
- invoke · method · L197-L218 — async invoke(params: MCPToolCallParams): Promise<MCPToolCallResult>
- on · method · L220-L222 — override on<K extends keyof MCPClientEvents>(event: K, listener: MCPClientEvents[K]): this
- off · method · L224-L226 — override off<K extends keyof MCPClientEvents>(event: K, listener: MCPClientEvents[K]): this
