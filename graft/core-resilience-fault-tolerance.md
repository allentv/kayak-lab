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
