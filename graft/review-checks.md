---
name: Review Checks
slug: review-checks
type: system
sources:
  - path: review/checks/file-size.ts
    hash: df18770d8416268a78c6f60578c5bf52e61006af817d62c5513975f3915fd7bc
  - path: review/checks/reexports.ts
    hash: a0d935dcb1a48ab5c811380c07b4bec0491cfe643fb24777bb58f0f22b1f5b76
  - path: review/checks/test-pairing.ts
    hash: e92a5e9d8ceb1e0f22efaf345cd6df7fb79f351a22803d1a8249951feafb9373
sources_digest: 458f16520aa0c98be65ab12cf6b125db3ad7cd3ad253d949d167b24cc0b56bcd
links:
  - to: code-review-system
    relation: part_of
    description: Loaded by registry and executed by CLI
  - to: finding-types
    relation: implements
    description: Each check implements ReviewCheck interface and returns Finding objects
generator:
  version: 1
covers:
  - symbol: run
    kind: method
    at: 'review/checks/file-size.ts:L8-L29'
  - symbol: run
    kind: method
    at: 'review/checks/reexports.ts:L6-L42'
  - symbol: run
    kind: method
    at: 'review/checks/test-pairing.ts:L6-L33'
---
<!-- context:generated:start -->
## Summary

Built-in static analysis checks that enforce project conventions: file size limits, test pairing, and centralized re-exports via mod.ts. These checks scan the file map and dependency graph from ReviewContext to flag violations.

## Related

- part of [[code-review-system]] — Loaded by registry and executed by CLI
- implements [[finding-types]] — Each check implements ReviewCheck interface and returns Finding objects
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
