---
name: Code Review System
slug: code-review-system
type: system
sources:
  - path: review/cli.ts
    hash: f46e8d8b0efa5613197edd553eded67e310a65983f9065617ccb481b1665ee83
  - path: review/context.ts
    hash: cab2714df3803615fcf6dc1e27cc6e648e0c71eaebfc8cdfea7571f02e1d129a
  - path: review/formatter.ts
    hash: b0080d6dd29a2f95aafcf520fbd715b64fbc6ce0b601917dd889027ae6176f52
  - path: review/registry.ts
    hash: 9dd80adec361f8c0f9dfe69c668c13e8ea156511fe8ad8b899e220ddcdf7ba34
  - path: review/types.ts
    hash: 4afdc3e5116100aeac867f5b38a4424a85b22eb27b4cc61717ae6c45965eb359
sources_digest: 45980b95371c3b15eb8818c095df8ab658fdab5bd2d64d011e7b100c2b584e8f
links:
  - to: finding-types
    relation: depends_on
    description: 'Uses Finding, ReviewCheck, ReviewContext interfaces for all operations'
  - to: review-checks
    relation: uses
    description: 'Loads and runs checks via registry, providing them with ReviewContext'
  - to: review-delegates
    relation: uses
    description: Loads and runs external tool wrappers via registry
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

A pluggable static analysis framework that runs configurable checks and delegates to external tools (deno check, knip, madge) to detect code quality issues. It builds a shared context of file exports/imports and test mappings, orchestrates parallel check execution, and formats findings with priority-based filtering.

## Related

- depends on [[finding-types]] — Uses Finding, ReviewCheck, ReviewContext interfaces for all operations
- uses [[review-checks]] — Loads and runs checks via registry, providing them with ReviewContext
- uses [[review-delegates]] — Loads and runs external tool wrappers via registry
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
