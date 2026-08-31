## 1. WebSocket Server

- [x] 1.1 Implement `WebSocketProjectionServer` class that wraps `Deno.serve` with WebSocket upgrade. Verify: server starts and accepts WebSocket connections.
- [x] 1.2 Implement welcome message on client connection with server version and capabilities. Verify: client receives welcome message on connect.
- [x] 1.3 Implement graceful shutdown that sends close messages to all clients. Verify: all clients receive close and connections terminate.

## 2. Subscription Management

- [x] 2.1 Implement subscription state per client (session filter, event type filter, active flag). Verify: client can subscribe/unsubscribe.
- [x] 2.2 Handle `subscribe` message: parse filter options, register subscription. Verify: client receives events matching filter.
- [x] 2.3 Handle `unsubscribe` message: clear subscription, stop event delivery. Verify: client stops receiving events.
- [x] 2.4 Implement subscription filtering by session_id and event_types. Verify: only matching events delivered.

## 3. Event Delivery

- [x] 3.1 Implement in-process event bridge: subscribe to EventStore, fan out to connected clients. Verify: event appended → clients receive it.
- [ ] 3.2 Implement event ordering: ensure events within a session are delivered in sequence order. Verify: 10 events appended in order, client receives all 10 in order.
- [ ] 3.3 Implement backpressure: buffer events for slow clients, deliver when caught up. Verify: slow client receives all events without loss.

## 4. Reconnection and Gap Recovery

- [x] 4.1 Implement per-session ring buffer (last 1000 events). Verify: buffer stores events, oldest evicted when full.
- [x] 4.2 Handle `reconnect` message with last event_id: replay events from buffer/store after that point. Verify: client reconnects and receives missed events.
- [x] 4.3 Handle gap-too-large: when replay exceeds buffer and store retention, send error message. Verify: client receives gap_too_large error.

## 5. Connection Lifecycle

- [ ] 5.1 Implement heartbeat: send ping to idle clients every 30 seconds. Verify: client receives ping after 30s idle.
- [ ] 5.2 Implement pong handling: expect pong within 5 seconds of ping. Verify: client pong resets timeout.
- [ ] 5.3 Implement timeout disconnect: disconnect clients that don't pong within 15 seconds. Verify: non-responding client is disconnected.

## 6. Tests

- [x] 6.1 Write unit tests for WebSocket server: connect, subscribe, receive events, disconnect. Verify: all tests pass.
- [x] 6.2 Write unit tests for subscription filtering: session filter, type filter, unsubscribe. Verify: filtering works correctly.
- [x] 6.3 Write unit tests for gap recovery: reconnect after disconnect, buffer replay, gap-too-large. Verify: gap recovery works.
- [ ] 6.4 Write integration test: append events to store → WebSocket client subscribes → receives events in real time. Verify: end-to-end flow works.
- [x] 6.5 Verify existing 112+ tests still pass. Verify: `deno test` passes.
