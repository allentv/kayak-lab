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
