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
---
<!-- context:generated:start -->
## Summary

A hierarchy of error classes (AppError, ValidationError, TimeoutError, etc.) that embed metadata like module, operation, retryable flag, and context. This enables consistent error handling, logging, and automated retry decisions across the system. Errors are designed to be serializable and include service-specific details (e.g., statusCode for ExternalServiceError).

## Related

- configures [[core-resilience-fault-tolerance]] — The 'retryable' property on AppError directly controls whether withRetry will attempt a retry.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
