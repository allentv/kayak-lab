## Context

Current state: No rate limiting on any capability. Event delivery has no backpressure — slow clients receive events via WebSocket with no flow control. Internal queues (event buffer, subscription queues) have no bounds.

## Goals / Non-Goals

**Goals:**
- Token bucket rate limiters for external API capabilities
- Configurable backpressure policies for event delivery
- Bounded internal queues with overflow policies

**Non-Goals:**
- Distributed rate limiting (single-process only)
- Adaptive rate limiting (ML-based)
- Priority-based queue scheduling
- Quota management across tenants

## Decisions

### 1. Token bucket algorithm

**Decision:** Use token bucket for rate limiting.

**Rationale:**
- Smooths burst traffic while enforcing average rate
- Simple to implement and understand
- Well-suited for API rate limits (which are typically per-hour or per-minute)

### 2. Configurable overflow policies

**Decision:** Queues support overflow policies: `drop-oldest`, `drop-newest`, `block`, `reject`.

**Rationale:**
- Different use cases need different behaviors
- Event delivery: drop-oldest (keep latest)
- Tool invocation: reject (report error)
- User input: block (wait for space)

### 3. Backpressure at WebSocket layer only

**Decision:** Apply backpressure only at the WebSocket projection layer, not in the event store.

**Rationale:**
- Event store must never drop events (durability guarantee)
- WebSocket is the only multi-consumer delivery point
- Backpressure in the store would affect all consumers

## Risks / Trade-offs

### Risk: Rate limiter clock skew

**Impact:** Low — single-process, no clock synchronization needed.

**Mitigation:** Use monotonic clock for token refill calculations.

### Risk: Backpressure event loss

**Impact:** Medium — drop-oldest policy loses events for slow consumers.

**Mitigation:** Document trade-off. Consumers can reconnect with gap recovery to retrieve lost events.
