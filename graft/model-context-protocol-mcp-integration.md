---
name: Model Context Protocol (MCP) Integration
slug: model-context-protocol-mcp-integration
type: system
sources:
  - path: src/mcp/client.ts
    hash: 32d4c0fdc2f7815108253a1b7792ade7852477315d82982b9b9eca6ee5af26ce
  - path: src/mcp/event-emitter.ts
    hash: 18367d499052f7cb12044f421300952bcce8f7f3855fd88dfb4563d0bb224281
  - path: src/mcp/events.ts
    hash: 1964886335f70eb2a6576bd5043553fd94bf8fd3366add76d2f0b48997969417
  - path: src/mcp/mod.ts
    hash: 23dd7552d4a61e3dac2736a2a01af2553964ca7044059902d6a852376f843174
  - path: src/mcp/registry.ts
    hash: 6ceacb27fdf40cb379212f180863353fd45bc8534f164f44114df6192c82a973
  - path: src/mcp/search.ts
    hash: a5e9b072dd6a674a3e44ffe933542d798d54d4ebf2303d95143a980d053116e5
  - path: src/mcp/server.ts
    hash: d8729fa85a043f1f53b437ba62230401b3ee490dcd44ca82b87ee716f5040155
  - path: src/mcp/transport.ts
    hash: f19fc3111809b80d424dca07a6fffe5d8c43f392bf90fe4d44cc84885eebf792
  - path: src/mcp/types.ts
    hash: c3b013b2abe9ea4f8149a44e4600c1e295fc415b925236bd744736dad01c14fe
sources_digest: 65621df983660a679c1e8e8b90f2579064f04cebb389b522894937ed68d45957
links:
  - to: core-resilience-fault-tolerance
    relation: uses
    description: >-
      MCP client uses exponential backoff for reconnection and may employ
      retry/fallback for tool calls.
  - to: event-sourcing-session-lifecycle
    relation: produces
    description: >-
      MCP events (connected, tool invocation, etc.) are emitted as standardized
      events via event-emitter wiring.
generator:
  version: 1
covers:
  - symbol: MCPClient
    kind: class
    at: 'src/mcp/client.ts:L30-L227'
  - symbol: state
    kind: method
    at: 'src/mcp/client.ts:L38-L40'
  - symbol: tools
    kind: method
    at: 'src/mcp/client.ts:L42-L44'
  - symbol: constructor
    kind: method
    at: 'src/mcp/client.ts:L46-L68'
  - symbol: setState
    kind: method
    at: 'src/mcp/client.ts:L70-L92'
  - symbol: scheduleReconnect
    kind: method
    at: 'src/mcp/client.ts:L94-L111'
  - symbol: connect
    kind: method
    at: 'src/mcp/client.ts:L113-L157'
  - symbol: disconnect
    kind: method
    at: 'src/mcp/client.ts:L159-L169'
  - symbol: discover
    kind: method
    at: 'src/mcp/client.ts:L171-L195'
  - symbol: invoke
    kind: method
    at: 'src/mcp/client.ts:L197-L218'
  - symbol: 'on'
    kind: method
    at: 'src/mcp/client.ts:L220-L222'
  - symbol: 'off'
    kind: method
    at: 'src/mcp/client.ts:L224-L226'
  - symbol: AppendEventFn
    kind: type
    at: 'src/mcp/event-emitter.ts:L21-L21'
  - symbol: makeEvent
    kind: function
    at: 'src/mcp/event-emitter.ts:L27-L39'
  - symbol: wireClientEvents
    kind: function
    at: 'src/mcp/event-emitter.ts:L48-L80'
  - symbol: wireServerEvents
    kind: function
    at: 'src/mcp/event-emitter.ts:L89-L125'
  - symbol: wireRegistryEvents
    kind: function
    at: 'src/mcp/event-emitter.ts:L134-L159'
  - symbol: wireSearchEvents
    kind: function
    at: 'src/mcp/event-emitter.ts:L168-L182'
  - symbol: MCPEventType
    kind: type
    at: 'src/mcp/events.ts:L40-L41'
  - symbol: MCPEventBase
    kind: interface
    at: 'src/mcp/events.ts:L48-L52'
  - symbol: MCPConnectedEvent
    kind: interface
    at: 'src/mcp/events.ts:L55-L59'
  - symbol: MCPDisconnectedEvent
    kind: interface
    at: 'src/mcp/events.ts:L62-L66'
  - symbol: MCPToolsDiscoveredEvent
    kind: interface
    at: 'src/mcp/events.ts:L69-L74'
  - symbol: MCPToolInvocationEvent
    kind: interface
    at: 'src/mcp/events.ts:L77-L82'
  - symbol: MCPToolResultEvent
    kind: interface
    at: 'src/mcp/events.ts:L85-L92'
  - symbol: MCPServerStartedEvent
    kind: interface
    at: 'src/mcp/events.ts:L95-L99'
  - symbol: MCPServerStoppedEvent
    kind: interface
    at: 'src/mcp/events.ts:L102-L104'
  - symbol: MCPSearchEvent
    kind: interface
    at: 'src/mcp/events.ts:L107-L114'
  - symbol: MCPSearchResultEvent
    kind: interface
    at: 'src/mcp/events.ts:L117-L125'
  - symbol: isMCPEvent
    kind: function
    at: 'src/mcp/events.ts:L134-L136'
  - symbol: MCPRegistry
    kind: class
    at: 'src/mcp/registry.ts:L24-L106'
  - symbol: register
    kind: method
    at: 'src/mcp/registry.ts:L27-L44'
  - symbol: unregister
    kind: method
    at: 'src/mcp/registry.ts:L46-L51'
  - symbol: list
    kind: method
    at: 'src/mcp/registry.ts:L53-L55'
  - symbol: get
    kind: method
    at: 'src/mcp/registry.ts:L57-L65'
  - symbol: enable
    kind: method
    at: 'src/mcp/registry.ts:L67-L74'
  - symbol: disable
    kind: method
    at: 'src/mcp/registry.ts:L76-L83'
  - symbol: findByCapability
    kind: method
    at: 'src/mcp/registry.ts:L85-L89'
  - symbol: findByCategory
    kind: method
    at: 'src/mcp/registry.ts:L91-L93'
  - symbol: toolKey
    kind: method
    at: 'src/mcp/registry.ts:L95-L97'
  - symbol: 'on'
    kind: method
    at: 'src/mcp/registry.ts:L99-L101'
  - symbol: 'off'
    kind: method
    at: 'src/mcp/registry.ts:L103-L105'
  - symbol: MCPSearch
    kind: class
    at: 'src/mcp/search.ts:L28-L105'
  - symbol: constructor
    kind: method
    at: 'src/mcp/search.ts:L32-L39'
  - symbol: search
    kind: method
    at: 'src/mcp/search.ts:L41-L91'
  - symbol: getClientState
    kind: method
    at: 'src/mcp/search.ts:L93-L96'
  - symbol: 'on'
    kind: method
    at: 'src/mcp/search.ts:L98-L100'
  - symbol: 'off'
    kind: method
    at: 'src/mcp/search.ts:L102-L104'
  - symbol: MCPServer
    kind: class
    at: 'src/mcp/server.ts:L27-L127'
  - symbol: state
    kind: method
    at: 'src/mcp/server.ts:L32-L34'
  - symbol: constructor
    kind: method
    at: 'src/mcp/server.ts:L36-L40'
  - symbol: refreshExposedTools
    kind: method
    at: 'src/mcp/server.ts:L43-L50'
  - symbol: start
    kind: method
    at: 'src/mcp/server.ts:L52-L65'
  - symbol: stop
    kind: method
    at: 'src/mcp/server.ts:L67-L72'
  - symbol: listTools
    kind: method
    at: 'src/mcp/server.ts:L74-L76'
  - symbol: getTool
    kind: method
    at: 'src/mcp/server.ts:L78-L80'
  - symbol: handleToolCall
    kind: method
    at: 'src/mcp/server.ts:L82-L118'
  - symbol: 'on'
    kind: method
    at: 'src/mcp/server.ts:L120-L122'
  - symbol: 'off'
    kind: method
    at: 'src/mcp/server.ts:L124-L126'
  - symbol: BaseTransport
    kind: class
    at: 'src/mcp/transport.ts:L28-L132'
  - symbol: state
    kind: method
    at: 'src/mcp/transport.ts:L36-L38'
  - symbol: setState
    kind: method
    at: 'src/mcp/transport.ts:L40-L45'
  - symbol: send
    kind: method
    at: 'src/mcp/transport.ts:L50-L69'
  - symbol: notify
    kind: method
    at: 'src/mcp/transport.ts:L71-L76'
  - symbol: handleRawMessage
    kind: method
    at: 'src/mcp/transport.ts:L82-L115'
  - symbol: clearPendingRequests
    kind: method
    at: 'src/mcp/transport.ts:L117-L123'
  - symbol: 'on'
    kind: method
    at: 'src/mcp/transport.ts:L125-L127'
  - symbol: 'off'
    kind: method
    at: 'src/mcp/transport.ts:L129-L131'
  - symbol: StdioTransport
    kind: class
    at: 'src/mcp/transport.ts:L142-L250'
  - symbol: constructor
    kind: method
    at: 'src/mcp/transport.ts:L147-L152'
  - symbol: connect
    kind: method
    at: 'src/mcp/transport.ts:L154-L180'
  - symbol: disconnect
    kind: method
    at: 'src/mcp/transport.ts:L182-L201'
  - symbol: sendRaw
    kind: method
    at: 'src/mcp/transport.ts:L203-L215'
  - symbol: _readLoop
    kind: method
    at: 'src/mcp/transport.ts:L217-L249'
  - symbol: HttpTransport
    kind: class
    at: 'src/mcp/transport.ts:L260-L333'
  - symbol: constructor
    kind: method
    at: 'src/mcp/transport.ts:L264-L271'
  - symbol: connect
    kind: method
    at: 'src/mcp/transport.ts:L273-L306'
  - symbol: disconnect
    kind: method
    at: 'src/mcp/transport.ts:L308-L311'
  - symbol: sendRaw
    kind: method
    at: 'src/mcp/transport.ts:L313-L332'
  - symbol: WebSocketTransport
    kind: class
    at: 'src/mcp/transport.ts:L342-L414'
  - symbol: constructor
    kind: method
    at: 'src/mcp/transport.ts:L346-L349'
  - symbol: connect
    kind: method
    at: 'src/mcp/transport.ts:L351-L397'
  - symbol: disconnect
    kind: method
    at: 'src/mcp/transport.ts:L399-L406'
  - symbol: sendRaw
    kind: method
    at: 'src/mcp/transport.ts:L408-L413'
  - symbol: createTransport
    kind: function
    at: 'src/mcp/transport.ts:L423-L458'
  - symbol: MCPRequest
    kind: interface
    at: 'src/mcp/types.ts:L20-L25'
  - symbol: MCPResponse
    kind: interface
    at: 'src/mcp/types.ts:L28-L37'
  - symbol: MCPNotification
    kind: interface
    at: 'src/mcp/types.ts:L40-L44'
  - symbol: MCPToolDefinition
    kind: interface
    at: 'src/mcp/types.ts:L51-L55'
  - symbol: MCPToolCallParams
    kind: interface
    at: 'src/mcp/types.ts:L58-L61'
  - symbol: MCPToolCallResult
    kind: interface
    at: 'src/mcp/types.ts:L64-L67'
  - symbol: TransportState
    kind: type
    at: 'src/mcp/types.ts:L74-L74'
  - symbol: MCPTransportConfig
    kind: interface
    at: 'src/mcp/types.ts:L77-L88'
  - symbol: TransportEvents
    kind: interface
    at: 'src/mcp/types.ts:L91-L98'
  - symbol: IMCPTransport
    kind: interface
    at: 'src/mcp/types.ts:L104-L120'
  - symbol: MCPClientConfig
    kind: interface
    at: 'src/mcp/types.ts:L127-L138'
  - symbol: MCPClientState
    kind: type
    at: 'src/mcp/types.ts:L141-L141'
  - symbol: MCPClientEvents
    kind: interface
    at: 'src/mcp/types.ts:L144-L153'
  - symbol: IMCPClient
    kind: interface
    at: 'src/mcp/types.ts:L158-L176'
  - symbol: MCPServerConfig
    kind: interface
    at: 'src/mcp/types.ts:L183-L188'
  - symbol: MCPToolExposure
    kind: interface
    at: 'src/mcp/types.ts:L191-L201'
  - symbol: MCPServerState
    kind: type
    at: 'src/mcp/types.ts:L204-L204'
  - symbol: MCPServerEvents
    kind: interface
    at: 'src/mcp/types.ts:L207-L218'
  - symbol: IMCPServer
    kind: interface
    at: 'src/mcp/types.ts:L223-L243'
  - symbol: MCPToolRegistration
    kind: interface
    at: 'src/mcp/types.ts:L250-L263'
  - symbol: MCPRegistryEvents
    kind: interface
    at: 'src/mcp/types.ts:L266-L277'
  - symbol: IMCPRegistry
    kind: interface
    at: 'src/mcp/types.ts:L282-L303'
  - symbol: MCPSearchQuery
    kind: interface
    at: 'src/mcp/types.ts:L310-L317'
  - symbol: MCPSearchResultItem
    kind: interface
    at: 'src/mcp/types.ts:L320-L327'
  - symbol: MCPSearchResult
    kind: interface
    at: 'src/mcp/types.ts:L330-L337'
  - symbol: MCPSearchEvents
    kind: interface
    at: 'src/mcp/types.ts:L340-L345'
  - symbol: IMCPSearch
    kind: interface
    at: 'src/mcp/types.ts:L350-L357'
  - symbol: MCPErrorCode
    kind: type
    at: 'src/mcp/types.ts:L376-L377'
  - symbol: MCPError
    kind: class
    at: 'src/mcp/types.ts:L380-L389'
  - symbol: constructor
    kind: method
    at: 'src/mcp/types.ts:L381-L388'
---
<!-- context:generated:start -->
## Summary

Connects to external MCP servers to discover and invoke remote tools, and exposes harness tools to external MCP clients. Includes client (with auto-reconnect), server, registry (tool state management), search, and transports (stdio/HTTP/WebSocket). Events are wired into the main event stream for observability. Tools are filtered by 'exposable' flag.

## Related

- uses [[core-resilience-fault-tolerance]] — MCP client uses exponential backoff for reconnection and may employ retry/fallback for tool calls.
- produces [[event-sourcing-session-lifecycle]] — MCP events (connected, tool invocation, etc.) are emitted as standardized events via event-emitter wiring.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
