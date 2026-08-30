## Why

The projection protocol defines how UI surfaces subscribe to events, but there's no real-time transport layer. The design doc specified WebSocket as the transport for UI delivery. Without WebSocket, UIs must poll for events, which is inefficient and adds latency.

## What Changes

Add WebSocket transport for the projection protocol:

- **WebSocket server**: Accepts UI connections, manages subscriptions, delivers events in real time
- **Client connection management**: Handle connect, disconnect, reconnect, and concurrent connections
- **Event streaming**: Push events to subscribed clients as they occur, with ordering guarantees
- **Reconnection and gap handling**: Clients can reconnect and receive events they missed (event gap recovery)
- **Subscription filtering**: Clients filter by event type, session ID, or custom predicates

### New Capabilities

- `projection/websocket`: WebSocket transport layer for the projection protocol

## Capabilities

### New Capabilities

- `projection/websocket`: WebSocket server and client for real-time event projection
