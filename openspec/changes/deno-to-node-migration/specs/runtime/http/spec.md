## Purpose

Platform-agnostic HTTP server. Replaces `Deno.serve`. Must support the Web-standard `Request`/`Response` interface and WebSocket upgrades.

## ADDED Requirements

### Requirement: HTTP server via abstraction

The system MUST provide an HTTP server that accepts a port, hostname, and a handler function receiving a `Request` and returning a `Response`.

#### Scenario: Start server on port

- **WHEN** the server is started with a port and handler
- **THEN** it listens on the specified port and routes requests to the handler

#### Scenario: Handler receives Web-standard Request

- **WHEN** a request arrives
- **THEN** the handler receives a standard `Request` object with headers, method, URL, and body

#### Scenario: Handler returns Web-standard Response

- **WHEN** the handler returns a `Response`
- **THEN** the server sends the status, headers, and body to the client

### Requirement: WebSocket upgrade support

The server MUST support WebSocket protocol upgrades on the same port.

#### Scenario: Upgrade HTTP to WebSocket

- **WHEN** a client sends an upgrade request
- **THEN** the connection is upgraded and the handler receives the WebSocket socket

#### Scenario: WebSocket message exchange

- **WHEN** a WebSocket client sends a message
- **THEN** the server receives it and can send responses back

### Requirement: Runtime adapter is swappable

The HTTP server MUST have Deno and Node.js implementations with identical observable behavior.

#### Scenario: Deno adapter uses Deno.serve

- **WHEN** running on Deno
- **THEN** the adapter delegates to `Deno.serve`

#### Scenario: Node adapter uses node:http or compatible

- **WHEN** running on Node.js
- **THEN** the adapter provides equivalent HTTP + WebSocket serving
