## 1. Token Bucket Rate Limiter

- [x] 1.1 Implement `TokenBucket` class with `capacity`, `refillRate`, `tokens` state. Verify: bucket created with correct capacity.
- [x] 1.2 Implement `tryConsume(tokens)` that returns true if tokens available and consumes them. Verify: consumes within limit, rejects at limit.
- [x] 1.3 Implement `waitAndConsume(tokens)` that returns a Promise resolving when tokens are available. Verify: waits for refill then consumes.
- [x] 1.4 Implement token refill on a timer interval. Verify: tokens refill at configured rate up to capacity.

## 2. Rate Limiter Integration

- [x] 2.1 Implement `RateLimiter` wrapper that takes a `TokenBucket` and wraps async functions. Verify: wrapper enforces rate limit.
- [ ] 2.2 Add rate limit config to capability definitions: `{ rateLimit?: { maxTokens, refillRateMs } }`. Verify: config parsed and bucket created.
- [ ] 2.3 Wrap GitHub, K8s, and Shell capabilities with rate limiters. Verify: capabilities respect rate limits.

## 3. Backpressure

- [x] 3.1 Implement `BoundedQueue<T>` with configurable max size and overflow policy (`drop-oldest`, `drop-newest`, `block`, `reject`). Verify: queue respects bounds.
- [ ] 3.2 Implement backpressure for WebSocket event delivery: use BoundedQueue per client. Verify: slow client triggers overflow policy.
- [ ] 3.3 Add backpressure config to WebSocket projection: `{ backpressure?: { maxSize, policy } }`. Verify: config controls behavior.

## 4. Tests

- [x] 4.1 Write token bucket tests: consume within limit, consume at limit, refill over time. Verify: all tests pass.
- [x] 4.2 Write rate limiter tests: wrapper enforces limits, waitAndConsume blocks. Verify: all tests pass.
- [x] 4.3 Write bounded queue tests: all overflow policies, capacity enforcement. Verify: all tests pass.
- [ ] 4.4 Write backpressure integration test: fast producer, slow consumer, verify overflow behavior. Verify: all tests pass.
- [x] 4.5 Verify existing 112+ tests still pass. Verify: `deno test` passes.
