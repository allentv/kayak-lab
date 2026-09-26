# src/core/component-health.ts · [[health-observability]]

Provides health check functions for core system components (EventStore, CapabilityRegistry, WebSocket server) to verify their operational status.

- createEventStoreHealthCheck · function · L16-L39 — Creates a health check that verifies the EventStore is accessible by attempting to retrieve session IDs.
- createCapabilityHealthCheck · function · L45-L79 — Creates a health check that verifies key capabilities (git, github, shell) are properly registered and accessible in the CapabilityRegistry.
- createWebSocketHealthCheck · function · L85-L126 — Creates a health check that verifies the WebSocket server is reachable by attempting an HTTP connection to its health endpoint with a timeout.
