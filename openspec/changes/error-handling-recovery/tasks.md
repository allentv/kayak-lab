## 1. Error Taxonomy

- [x] 1.1 Define base `AppError` class with `code`, `module`, `operation`, `retryable`, `context` fields. Verify: class compiles and is throwable.
- [x] 1.2 Implement error subclasses: `ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `TimeoutError`, `RateLimitError`, `ExternalServiceError`, `InternalError`. Verify: each compiles and has correct defaults.
- [x] 1.3 Update `CapabilityResult` to accept `AppError` in the `error` field (alongside string). Verify: backward compatible — old string errors still work.

## 2. Retry Policies

- [x] 2.1 Implement `RetryPolicy` type: `{ maxRetries, baseDelayMs, maxDelayMs, jitter, retryableFn }`. Verify: type compiles.
- [x] 2.2 Implement `withRetry<T>(fn, policy)` wrapper that retries on transient errors with exponential backoff. Verify: retries 3 times on timeout, stops on auth error.
- [x] 2.3 Define default retry policy: 3 retries, 1s base delay, 10s max delay, jitter enabled. Verify: default policy applied when none specified.

## 3. Circuit Breaker

- [x] 3.1 Implement `CircuitBreaker` class with states: closed, open, half-open. Verify: state transitions work.
- [x] 3.2 Implement `CircuitBreaker.execute(fn)` that tracks failures, opens circuit after threshold, allows half-open test. Verify: 5 failures → open, 30s → half-open, success → closed.
- [x] 3.3 Implement `CircuitOpenError` that is thrown when circuit is open. Verify: error thrown on open circuit.

## 4. Graceful Degradation

- [x] 4.1 Add optional `fallback` function to capability definitions. Verify: fallback defined and callable.
- [x] 4.2 Implement `executeWithFallback(capability, operation)` that tries capability, falls back on failure. Verify: fallback executed on capability failure.
- [x] 4.3 Integrate circuit breaker with fallback: when circuit open, execute fallback directly. Verify: open circuit triggers fallback.

## 5. Tests

- [x] 5.1 Write error taxonomy tests: error codes, context, retryable flag. Verify: all tests pass.
- [x] 5.2 Write retry tests: transient failure retry, non-transient stop, backoff timing. Verify: all tests pass.
- [x] 5.3 Write circuit breaker tests: open/half-open/close transitions, threshold behavior. Verify: all tests pass.
- [x] 5.4 Write degradation tests: fallback execution, fallback failure. Verify: all tests pass.
- [x] 5.5 Verify existing 112+ tests still pass. Verify: `deno test` passes.
