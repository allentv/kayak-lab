# src/mcp/registry.ts · [[model-context-protocol-mcp-integration]]

- MCPRegistry · class · L24-L106 — class MCPRegistry extends EventEmitter implements IMCPRegistry
- register · method · L27-L44 — register(registration: MCPToolRegistration): void
- unregister · method · L46-L51 — unregister(toolName: string, serverName: string): void
- list · method · L53-L55 — list(): MCPToolRegistration[]
- get · method · L57-L65 — get(toolName: string): MCPToolRegistration | undefined
- enable · method · L67-L74 — enable(toolName: string, serverName: string): void
- disable · method · L76-L83 — disable(toolName: string, serverName: string): void
- findByCapability · method · L85-L89 — findByCapability(capabilityId: string): MCPToolRegistration[]
- findByCategory · method · L91-L93 — findByCategory(categoryId: string): MCPToolRegistration[]
- toolKey · method · L95-L97 — private toolKey(toolName: string, serverName: string): string
- on · method · L99-L101 — override on<K extends keyof MCPRegistryEvents>(event: K, listener: MCPRegistryEvents[K]): this
- off · method · L103-L105 — override off<K extends keyof MCPRegistryEvents>(event: K, listener: MCPRegistryEvents[K]): this
