---
name: Structured Error Taxonomy
slug: structured-error-taxonomy
type: concept
sources:
  - path: src/core/errors.ts
    hash: fa8083f676e7788ec3fbc25ca546fe9533a7773563b0baf4ae0a701abcb85096
sources_digest: b41976800b8e1f80db8c7f7b586220f6ccff5c54ffa6d1082b8c9bd313489435
links:
  - to: core-resilience-fault-tolerance
    relation: configures
    description: >-
      The 'retryable' property on AppError directly controls whether withRetry
      will attempt a retry.
generator:
  version: 1
covers:
  - symbol: ErrorCode
    kind: type
    at: 'src/core/errors.ts:L23-L23'
  - symbol: AppError
    kind: class
    at: 'src/core/errors.ts:L38-L50'
  - symbol: constructor
    kind: method
    at: 'src/core/errors.ts:L39-L49'
  - symbol: ValidationError
    kind: class
    at: 'src/core/errors.ts:L60-L70'
  - symbol: constructor
    kind: method
    at: 'src/core/errors.ts:L61-L69'
  - symbol: AuthenticationError
    kind: class
    at: 'src/core/errors.ts:L76-L86'
  - symbol: constructor
    kind: method
    at: 'src/core/errors.ts:L77-L85'
  - symbol: AuthorizationError
    kind: class
    at: 'src/core/errors.ts:L92-L102'
  - symbol: constructor
    kind: method
    at: 'src/core/errors.ts:L93-L101'
  - symbol: NotFoundError
    kind: class
    at: 'src/core/errors.ts:L108-L118'
  - symbol: constructor
    kind: method
    at: 'src/core/errors.ts:L109-L117'
  - symbol: TimeoutError
    kind: class
    at: 'src/core/errors.ts:L124-L134'
  - symbol: constructor
    kind: method
    at: 'src/core/errors.ts:L125-L133'
  - symbol: RateLimitError
    kind: class
    at: 'src/core/errors.ts:L140-L154'
  - symbol: constructor
    kind: method
    at: 'src/core/errors.ts:L141-L153'
  - symbol: ExternalServiceError
    kind: class
    at: 'src/core/errors.ts:L160-L174'
  - symbol: constructor
    kind: method
    at: 'src/core/errors.ts:L161-L173'
  - symbol: InternalError
    kind: class
    at: 'src/core/errors.ts:L180-L194'
  - symbol: constructor
    kind: method
    at: 'src/core/errors.ts:L181-L193'
---
<!-- context:generated:start -->
## Summary

A hierarchy of error classes (AppError, ValidationError, TimeoutError, etc.) that embed metadata like module, operation, retryable flag, and context. This enables consistent error handling, logging, and automated retry decisions across the system. Errors are designed to be serializable and include service-specific details (e.g., statusCode for ExternalServiceError).

## Related

- configures [[core-resilience-fault-tolerance]] — The 'retryable' property on AppError directly controls whether withRetry will attempt a retry.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
