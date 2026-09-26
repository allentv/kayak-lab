---
name: Main Application Harness
slug: main-application-harness
type: file
sources:
  - path: src/main.ts
    hash: ce33a7d2a10066c853f5dab9dfee93d0fd42769e450795a610d69d7eda503393
sources_digest: fd81220b39c632327d0bebc13ce12be85e538d68ca7619ee7cea32853070dcc2
links:
  - to: event-sourcing-session-lifecycle
    relation: uses
    description: Creates and manages the central EventStream and SessionManager instances.
  - to: health-observability
    relation: configures
    description: Sets up health endpoints and registers component health checks.
  - to: model-context-protocol-mcp-integration
    relation: uses
    description: Integrates MCP clients and servers to expose and consume external tools.
generator:
  version: 1
covers:
  - symbol: CliArgs
    kind: interface
    at: 'src/main.ts:L26-L30'
  - symbol: parseArgs
    kind: function
    at: 'src/main.ts:L32-L52'
  - symbol: HarnessComponents
    kind: interface
    at: 'src/main.ts:L58-L65'
  - symbol: initializeHarness
    kind: function
    at: 'src/main.ts:L67-L102'
  - symbol: createRouter
    kind: function
    at: 'src/main.ts:L108-L166'
  - symbol: handleGetSessions
    kind: function
    at: 'src/main.ts:L172-L183'
  - symbol: handleGetSession
    kind: function
    at: 'src/main.ts:L185-L200'
  - symbol: handleGetSessionEvents
    kind: function
    at: 'src/main.ts:L202-L222'
  - symbol: handleCreateSession
    kind: function
    at: 'src/main.ts:L224-L241'
  - symbol: handlePatchSession
    kind: function
    at: 'src/main.ts:L243-L293'
  - symbol: handleGetCapabilities
    kind: function
    at: 'src/main.ts:L295-L306'
  - symbol: handleGetHealth
    kind: function
    at: 'src/main.ts:L308-L318'
  - symbol: WebSocketClient
    kind: interface
    at: 'src/main.ts:L324-L332'
  - symbol: handleWebSocketUpgrade
    kind: function
    at: 'src/main.ts:L337-L458'
  - symbol: main
    kind: function
    at: 'src/main.ts:L486-L556'
---
<!-- context:generated:start -->
## Summary

Primary entry point that orchestrates core components: initializes EventStream, SessionManager, CapabilityRegistry, EventStore, and optionally a Fresh UI. Starts HTTP/WebSocket server for API and real-time event streaming. Supports CLI arguments for headless (--no-web) or embedded web mode. Dynamically imports UI to keep it optional.

## Related

- uses [[event-sourcing-session-lifecycle]] — Creates and manages the central EventStream and SessionManager instances.
- configures [[health-observability]] — Sets up health endpoints and registers component health checks.
- uses [[model-context-protocol-mcp-integration]] — Integrates MCP clients and servers to expose and consume external tools.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
