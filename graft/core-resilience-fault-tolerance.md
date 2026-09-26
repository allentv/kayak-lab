---
name: Core Resilience & Fault Tolerance
slug: core-resilience-fault-tolerance
type: system
sources:
  - path: src/core/bounded-queue.ts
    hash: f96b4a63e8354e84d16213219e448a1d58331ae7562074a4142a79932a8126c7
  - path: src/core/circuit-breaker.ts
    hash: 153e27ef570e47ceb8c8e30bd8a18b5ca5ad044fa22bf323dc6d3f27e70bb0b4
  - path: src/core/fallback.ts
    hash: 0a09ba50e497819364c4f09f6531ed9dd020244a2cf58940d678423161f6bfe4
  - path: src/core/rate-limiter.ts
    hash: 621b57f5d86f3011e6299b0de814a02b7891fe15b84932c37e7416635e6837c6
  - path: src/core/retry.ts
    hash: 1a17fab9b780a07ebb3deda67b05d8ce7caae0ceb359be87f45a47123c124c84
sources_digest: 6b5b8e84bd75924fd7de418360c7cf342c38cae09ffb7da550cd2d05b397a242
links:
  - to: event-sourcing-session-lifecycle
    relation: depends_on
    description: >-
      These resilience utilities are used by capabilities and other systems that
      produce events and manage sessions.
  - to: structured-error-taxonomy
    relation: uses
    description: >-
      Retry logic checks the 'retryable' property on AppError; CircuitBreaker
      throws CircuitOpenError which extends AppError.
generator:
  version: 1
covers:
  - symbol: OverflowPolicy
    kind: type
    at: 'src/core/bounded-queue.ts:L9-L13'
  - symbol: BoundedQueueConfig
    kind: interface
    at: 'src/core/bounded-queue.ts:L16-L21'
  - symbol: BoundedQueue
    kind: class
    at: 'src/core/bounded-queue.ts:L26-L157'
  - symbol: constructor
    kind: method
    at: 'src/core/bounded-queue.ts:L31-L33'
  - symbol: push
    kind: method
    at: 'src/core/bounded-queue.ts:L39-L65'
  - symbol: waitAndPush
    kind: method
    at: 'src/core/bounded-queue.ts:L70-L93'
  - symbol: checkSpace
    kind: function
    at: 'src/core/bounded-queue.ts:L83-L90'
  - symbol: shift
    kind: method
    at: 'src/core/bounded-queue.ts:L99-L101'
  - symbol: peek
    kind: method
    at: 'src/core/bounded-queue.ts:L106-L108'
  - symbol: size
    kind: method
    at: 'src/core/bounded-queue.ts:L113-L115'
  - symbol: remaining
    kind: method
    at: 'src/core/bounded-queue.ts:L120-L122'
  - symbol: isFull
    kind: method
    at: 'src/core/bounded-queue.ts:L127-L129'
  - symbol: clear
    kind: method
    at: 'src/core/bounded-queue.ts:L134-L136'
  - symbol: toArray
    kind: method
    at: 'src/core/bounded-queue.ts:L141-L143'
  - symbol: resolveWaiter
    kind: method
    at: 'src/core/bounded-queue.ts:L148-L156'
  - symbol: CircuitState
    kind: type
    at: 'src/core/circuit-breaker.ts:L21-L21'
  - symbol: CircuitBreakerOptions
    kind: interface
    at: 'src/core/circuit-breaker.ts:L27-L34'
  - symbol: CircuitOpenError
    kind: class
    at: 'src/core/circuit-breaker.ts:L49-L65'
  - symbol: constructor
    kind: method
    at: 'src/core/circuit-breaker.ts:L50-L64'
  - symbol: CircuitBreaker
    kind: class
    at: 'src/core/circuit-breaker.ts:L79-L165'
  - symbol: constructor
    kind: method
    at: 'src/core/circuit-breaker.ts:L86-L91'
  - symbol: getState
    kind: method
    at: 'src/core/circuit-breaker.ts:L94-L103'
  - symbol: getFailureCount
    kind: method
    at: 'src/core/circuit-breaker.ts:L106-L108'
  - symbol: reset
    kind: method
    at: 'src/core/circuit-breaker.ts:L111-L116'
  - symbol: execute
    kind: method
    at: 'src/core/circuit-breaker.ts:L122-L137'
  - symbol: onSuccess
    kind: method
    at: 'src/core/circuit-breaker.ts:L139-L150'
  - symbol: onFailure
    kind: method
    at: 'src/core/circuit-breaker.ts:L152-L164'
  - symbol: FallbackResult
    kind: interface
    at: 'src/core/fallback.ts:L18-L23'
  - symbol: executeWithFallback
    kind: function
    at: 'src/core/fallback.ts:L38-L58'
  - symbol: TokenBucketConfig
    kind: interface
    at: 'src/core/rate-limiter.ts:L9-L18'
  - symbol: TokenBucket
    kind: class
    at: 'src/core/rate-limiter.ts:L26-L109'
  - symbol: constructor
    kind: method
    at: 'src/core/rate-limiter.ts:L34-L40'
  - symbol: tryConsume
    kind: method
    at: 'src/core/rate-limiter.ts:L46-L54'
  - symbol: waitAndConsume
    kind: method
    at: 'src/core/rate-limiter.ts:L60-L65'
  - symbol: getAvailableTokens
    kind: method
    at: 'src/core/rate-limiter.ts:L70-L73'
  - symbol: startRefill
    kind: method
    at: 'src/core/rate-limiter.ts:L78-L84'
  - symbol: stopRefill
    kind: method
    at: 'src/core/rate-limiter.ts:L89-L94'
  - symbol: refill
    kind: method
    at: 'src/core/rate-limiter.ts:L99-L108'
  - symbol: RateLimiter
    kind: class
    at: 'src/core/rate-limiter.ts:L119-L160'
  - symbol: constructor
    kind: method
    at: 'src/core/rate-limiter.ts:L122-L124'
  - symbol: wrap
    kind: method
    at: 'src/core/rate-limiter.ts:L130-L143'
  - symbol: limited
    kind: function
    at: 'src/core/rate-limiter.ts:L135-L140'
  - symbol: wrapWithWait
    kind: method
    at: 'src/core/rate-limiter.ts:L148-L159'
  - symbol: limited
    kind: function
    at: 'src/core/rate-limiter.ts:L153-L156'
  - symbol: RetryPolicy
    kind: interface
    at: 'src/core/retry.ts:L24-L30'
  - symbol: calculateDelay
    kind: function
    at: 'src/core/retry.ts:L53-L63'
  - symbol: isRetryable
    kind: function
    at: 'src/core/retry.ts:L69-L77'
  - symbol: withRetry
    kind: function
    at: 'src/core/retry.ts:L91-L117'
---
<!-- context:generated:start -->
## Summary

Implements foundational resilience patterns: circuit breaker, retry with exponential backoff, graceful fallback, and rate limiting. These components are designed to work together to prevent cascading failures, handle transient errors, and degrade gracefully under load. The circuit breaker skips failing operations entirely, retry respects the 'retryable' flag on AppError, and fallback can bypass primary operations when the circuit is open.

## Related

- depends on [[event-sourcing-session-lifecycle]] — These resilience utilities are used by capabilities and other systems that produce events and manage sessions.
- uses [[structured-error-taxonomy]] — Retry logic checks the 'retryable' property on AppError; CircuitBreaker throws CircuitOpenError which extends AppError.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
