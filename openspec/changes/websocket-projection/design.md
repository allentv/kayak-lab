## Context

The projection protocol (`src/projection/protocol.ts`) defines subscribe/pause/resume semantics with event filtering. The terminal projection renders events locally. There's no network transport layer — projections currently run in the same process. The design doc specified WebSocket as the transport for UI surfaces (CLI, VS Code, Web, Desktop).

## Goals / Non-Goals

**Goals:**
- Real-time event delivery from event store to remote UI clients over WebSocket
- Subscription management with event type and session filtering
- Reconnection with event gap recovery
- Connection lifecycle management (heartbeats, timeout, graceful disconnect)

**Non-Goals:**
- HTTP/REST projection endpoint (future change)
- Server-Sent Events (SSE) transport
- Authentication/authorization (future cross-cutting concern)
- Message compression or binary framing (JSON is sufficient)

## Decisions

### 1. Deno std library WebSocket

**Decision:** Use Deno's standard library WebSocket implementation (`Deno.serve` with WebSocket upgrade).

**Rationale:**
- Built into Deno — no external dependencies
- Well-tested and maintained
- Native integration with Deno's HTTP server

**Alternatives considered:**
- Third-party WebSocket library: Adds dependency, Deno's built-in is sufficient
- Raw TCP: Too low-level, WebSocket provides framing and protocol support

### 2. JSON message protocol

**Decision:** All WebSocket messages use JSON with a `type` field for discrimination.

**Rationale:**
- Consistent with the event system (events are JSON)
- Easy to parse and debug
- Extensible (new message types added without breaking existing clients)

**Message types:**
- Client → Server: `subscribe`, `unsubscribe`, `pong`, `reconnect`
- Server → Client: `welcome`, `event`, `ping`, `error`, `gap_too_large`

### 3. In-process event bridge

**Decision:** The WebSocket server subscribes to the event store directly (in-process), not via a message queue.

**Rationale:**
- Simpler architecture — no external broker needed
- Low latency (no serialization/deserialization hop)
- Sufficient for single-server deployment
- Message queue can be added later for distributed deployments

**Alternatives considered:**
- Redis Pub/Sub: Adds dependency, overkill for single-server
- NATS: Better for distributed but adds complexity

### 4. Per-session event buffer

**Decision:** Maintain a small ring buffer (last 1000 events per session) for gap recovery.

**Rationale:**
- Enables reconnection without hitting disk for small gaps
- 1000 events per session is ~1MB memory (acceptable)
- Larger gaps fall back to event store replay

**Alternatives considered:**
- No buffer (always replay from store): Slower reconnection
- Unlimited buffer: Memory risk with many sessions

## Risks / Trade-offs

### Risk: Memory usage with many connections

**Impact:** Low — agent platform is not a high-concurrency system. Tens of connections, not thousands.

**Mitigation:** Monitor connection count; add connection limits if needed.

### Risk: Event ordering across sessions

**Impact:** Low — events are ordered within sessions. Cross-session ordering is not guaranteed (by design in event sourcing).

**Mitigation:** Document that cross-session ordering is not guaranteed. Clients filter by session.

### Risk: Large gap recovery

**Impact:** Medium — if a client is offline for a long time, replaying thousands of events is slow.

**Mitigation:** Gap-too-large error suggests full snapshot reload. Snapshots (from persistence layer) enable fast recovery.
