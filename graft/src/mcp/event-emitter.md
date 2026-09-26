# src/mcp/event-emitter.ts · [[model-context-protocol-mcp-integration]]

- AppendEventFn · type · L21-L21 — type AppendEventFn = (event: AppendEventInput) => Promise<void>;
- makeEvent · function · L27-L39 — function makeEvent( eventType: string, payload: Record<string, unknown>, sessionId?: string, ): AppendEventInput
- wireClientEvents · function · L48-L80 — function wireClientEvents( client: MCPClient, appendEvent: AppendEventFn, ): void
- wireServerEvents · function · L89-L125 — function wireServerEvents( server: MCPServer, appendEvent: AppendEventFn, ): void
- wireRegistryEvents · function · L134-L159 — function wireRegistryEvents( registry: MCPRegistry, appendEvent: AppendEventFn, ): void
- wireSearchEvents · function · L168-L182 — function wireSearchEvents( search: MCPSearch, appendEvent: AppendEventFn, ): void
