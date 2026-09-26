# src/mcp/transport.ts · [[model-context-protocol-mcp-integration]]

Provides stdio, HTTP, and WebSocket transport implementations for MCP communication, handling low-level messaging and connection management.

- BaseTransport · class · L28-L132 — Abstract base class that handles event emission and pending request tracking for all MCP transport implementations.
- state · method · L36-L38 — Getter that returns the current transport state (disconnected, connecting, connected, error).
- setState · method · L40-L45 — Updates the transport state and emits a stateChange event when the state actually changes.
- send · method · L50-L69 — Sends an MCP request with timeout handling and pending request tracking, ensuring the transport is connected.
- notify · method · L71-L76 — Sends an MCP notification without expecting a response, verifying the transport is connected first.
- handleRawMessage · method · L82-L115 — Parses incoming JSON messages, routes responses to pending requests, and emits notifications or errors.
- clearPendingRequests · method · L117-L123 — Clears all pending requests with connection error rejections when the transport disconnects.
- on · method · L125-L127 — Type-safe wrapper for adding event listeners to transport events.
- off · method · L129-L131 — Type-safe wrapper for removing event listeners from transport events.
- StdioTransport · class · L142-L250 — MCP transport implementation that communicates with a subprocess via stdin/stdout for local MCP servers.
- constructor · method · L147-L152 — Creates a stdio transport with the command and arguments to spawn the subprocess.
- connect · method · L154-L180 — Spawns the subprocess, sets up stdout reading, and manages connection state transitions.
- disconnect · method · L182-L201 — Terminates the subprocess, cancels pending requests, and cleans up resources.
- sendRaw · method · L203-L215 — Writes data to the subprocess's stdin with proper text encoding and stream management.
- _readLoop · method · L217-L249 — Continuously reads from stdout, buffers incomplete messages, and processes newline-delimited JSON-RPC messages.
- HttpTransport · class · L260-L333 — MCP transport implementation for HTTP-based communication using POST requests and synchronous responses.
- constructor · method · L264-L271 — Creates an HTTP transport with a base URL and optional headers, setting default content type.
- connect · method · L273-L306 — Verifies server reachability by sending an initialize request and handles connection errors.
- disconnect · method · L308-L311 — Clears pending requests and transitions to disconnected state for stateless HTTP transport.
- sendRaw · method · L313-L332 — Sends data via HTTP POST, handles response status codes, and processes synchronous responses.
- WebSocketTransport · class · L342-L414 — MCP transport implementation for persistent bidirectional communication over WebSocket connections.
- constructor · method · L346-L349 — Creates a WebSocket transport with the target URL for connection.
- connect · method · L351-L397 — Establishes WebSocket connection, sets up event handlers, and manages connection lifecycle.
- disconnect · method · L399-L406 — Closes the WebSocket connection and clears pending requests.
- sendRaw · method · L408-L413 — Sends data over the WebSocket if it's open and connected.
- createTransport · function · L423-L458 — Factory function that creates the appropriate transport instance based on configuration type.
