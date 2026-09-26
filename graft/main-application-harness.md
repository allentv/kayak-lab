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
