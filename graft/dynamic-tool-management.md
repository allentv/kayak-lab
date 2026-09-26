---
name: Dynamic Tool Management
slug: dynamic-tool-management
type: concept
sources:
  - path: src/runtime/__tests__/dynamic-tool-registry.test.ts
    hash: 6988522b48727679677b29ec0bda40b53e1471ee62de3cb46d70da7bbe83c49f
  - path: src/runtime/dynamic-tool-registry.ts
    hash: 2fa4a2276d02195abc3f9bcb9f8ded58d50bcc0171b3c63f24ce53339836709a
sources_digest: 08dc0915be49a502d0eb1df32887c1ed4d832be6856f6a2b22fe555c06e3ee5d
links:
  - to: runtime-orchestration
    relation: part_of
    description: >-
      DynamicToolRegistry integrates with ToolRegistry and uses AnalysisReport
      from PatternAnalyzer to evaluate trends.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Pattern-driven automatic enablement/disablement of tools based on runtime performance analysis. Tools can be disabled after repeated failures, re-enabled when improving, with safeguards preventing critical tools from being disabled. State changes are emitted as events.

## Related

- part of [[runtime-orchestration]] — DynamicToolRegistry integrates with ToolRegistry and uses AnalysisReport from PatternAnalyzer to evaluate trends.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
