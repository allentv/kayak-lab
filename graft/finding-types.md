---
name: Finding Types
slug: finding-types
type: concept
sources:
  - path: review/types.ts
    hash: 4afdc3e5116100aeac867f5b38a4424a85b22eb27b4cc61717ae6c45965eb359
sources_digest: 39ac6d07e7d28194ed717dbb5622c99648c5db34ff8552617143d46ad2dbe7a5
links:
  - to: code-review-system
    relation: produces
    description: Defines the data structures that flow through the entire review pipeline
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Centralized type definitions that establish the contract between checks, delegates, and the review system: Finding represents an issue, ReviewCheck defines check behavior, and ReviewContext provides shared file metadata and dependency graphs.

## Related

- produces [[code-review-system]] — Defines the data structures that flow through the entire review pipeline
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
