---
name: Review Delegates
slug: review-delegates
type: system
sources:
  - path: review/delegate/deno-check.ts
    hash: b5ebce768bb6229e1d2132ac58b9c9a31de1a460aadef5d353d74f640684eaeb
  - path: review/delegate/deno-lint.ts
    hash: bd94c9c07fd5a39174269c460cf60613c9d82bc406c25519d5a6ac842b1c36db
  - path: review/delegate/knip.ts
    hash: b0fa7d91289fecb857e572a3d61ff64cdaf3217472f2aae7bf84f1f551a7045a
  - path: review/delegate/madge.ts
    hash: f07a630264c0940570c0f6301b5d236555c1ff5f0f59a80cad95bc9deb088b40
sources_digest: d92d58f3e68c941f1bea6527da82a3d887884f6576e03ac6dda3398d6e799a62
links:
  - to: code-review-system
    relation: part_of
    description: Loaded by registry and executed in parallel with built-in checks
  - to: finding-types
    relation: implements
    description: Each delegate implements ReviewCheck interface
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Wrappers that execute external analysis tools (deno check, deno lint, knip, madge) and convert their output into the system's Finding format. They handle tool availability gracefully and fall back to text parsing when JSON output is unavailable.

## Related

- part of [[code-review-system]] — Loaded by registry and executed in parallel with built-in checks
- implements [[finding-types]] — Each delegate implements ReviewCheck interface
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
