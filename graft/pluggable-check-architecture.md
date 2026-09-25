---
name: Pluggable Check Architecture
slug: pluggable-check-architecture
type: concept
sources:
  - path: review/cli.ts
    hash: f46e8d8b0efa5613197edd553eded67e310a65983f9065617ccb481b1665ee83
  - path: review/registry.ts
    hash: 9dd80adec361f8c0f9dfe69c668c13e8ea156511fe8ad8b899e220ddcdf7ba34
sources_digest: 1e3b3f9968aef3d990a091b7073f1d2d81e5a02592ea80afe48f2b5c50f9bb43
links:
  - to: code-review-system
    relation: implements
    description: CLI uses registry to load checks and delegates dynamically
  - to: review-checks
    relation: configures
    description: Registry discovers checks from review/checks/ directory
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Dynamic discovery and loading of ReviewCheck modules from directories, enabling extensibility without code changes. Registry scans for modules, skipping test files and underscores, requiring each to export a check object with a run method. Same mechanism loads both built-in checks and external tool delegates.

## Related

- implements [[code-review-system]] — CLI uses registry to load checks and delegates dynamically
- configures [[review-checks]] — Registry discovers checks from review/checks/ directory
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
