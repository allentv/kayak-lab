## Purpose

WebSocket transport for the projection protocol, enabling real-time event delivery from the event store to UI surfaces over persistent connections.

## ADDED Requirements

### Requirement: WebSocket server

The system MUST provide a WebSocket server that accepts UI connections and delivers events.

#### Scenario: Server startup
- **WHEN** the WebSocket server is started with a host and port
- **THEN** it listens for incoming WebSocket connections on that address

#### Scenario: Client connection
- **WHEN** a UI client connects via WebSocket
- **THEN** the server accepts the connection and sends a welcome message with server version and capabilities

#### Scenario: Server shutdown
- **WHEN** the server is shut down
- **THEN** all connected clients receive a close message and connections are terminated gracefully

### Requirement: Subscription management

Clients MUST be able to subscribe to event streams with filtering.

#### Scenario: Subscribe to all events
- **WHEN** a client sends a `subscribe` message with no filter
- **THEN** all events from all sessions are delivered to the client

#### Scenario: Subscribe to session events
- **WHEN** a client sends a `subscribe` message with `session_id`
- **THEN** only events for that session are delivered

#### Scenario: Subscribe with type filter
- **WHEN** a client sends a `subscribe` message with `event_types` array
- **THEN** only events matching those types are delivered

#### Scenario: Unsubscribe
- **WHEN** a client sends an `unsubscribe` message
- **THEN** no more events are delivered until a new subscription is created

### Requirement: Event delivery

Events MUST be delivered to subscribed clients in real time with ordering guarantees.

#### Scenario: Real-time push
- **WHEN** an event is appended to the event store
- **THEN** all subscribed clients receive the event within 100ms

#### Scenario: Event ordering
- **WHEN** multiple events are delivered to a client
- **THEN** they arrive in sequence_number order within each session

#### Scenario: Backpressure handling
- **WHEN** a client cannot keep up with event delivery
- **THEN** the server buffers events and delivers them when the client catches up (no event loss)

### Requirement: Reconnection and gap recovery

Clients MUST be able to reconnect and receive missed events.

#### Scenario: Reconnect with last event ID
- **WHEN** a client reconnects and provides the last received `event_id`
- **THEN** the server delivers all events after that event_id

#### Scenario: Reconnect with sequence number
- **WHEN** a client reconnects and provides `session_id` + `sequence_number`
- **THEN** the server delivers all events for that session after the given sequence number

#### Scenario: Gap too large
- **WHEN** the client's requested replay exceeds the server's retention
- **THEN** the server sends an error message indicating the gap is too large and suggesting full replay

### Requirement: Connection lifecycle

The server MUST manage connection lifecycle and heartbeats.

#### Scenario: Heartbeat ping
- **WHEN** a client is idle for 30 seconds
- **THEN** the server sends a ping frame

#### Scenario: Client pong
- **WHEN** the server sends a ping
- **THEN** the client responds with a pong within 5 seconds

#### Scenario: Timeout disconnect
- **WHEN** a client does not respond to pings for 15 seconds
- **THEN** the server disconnects the client

#### Scenario: Graceful disconnect
- **WHEN** a client sends a close frame
- **THEN** the server acknowledges and closes the connection
