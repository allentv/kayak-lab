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
covers:
  - symbol: createEmptyReport
    kind: function
    at: 'src/runtime/__tests__/dynamic-tool-registry.test.ts:L10-L18'
  - symbol: ToolState
    kind: interface
    at: 'src/runtime/dynamic-tool-registry.ts:L17-L23'
  - symbol: ToolAction
    kind: interface
    at: 'src/runtime/dynamic-tool-registry.ts:L26-L31'
  - symbol: PatternMapping
    kind: interface
    at: 'src/runtime/dynamic-tool-registry.ts:L34-L38'
  - symbol: ToolLifecycleHooks
    kind: interface
    at: 'src/runtime/dynamic-tool-registry.ts:L41-L45'
  - symbol: IDynamicToolRegistry
    kind: interface
    at: 'src/runtime/dynamic-tool-registry.ts:L51-L58'
  - symbol: DynamicToolRegistry
    kind: class
    at: 'src/runtime/dynamic-tool-registry.ts:L64-L232'
  - symbol: constructor
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L86-L92'
  - symbol: evaluatePatterns
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L94-L129'
  - symbol: enableTool
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L131-L157'
  - symbol: disableTool
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L159-L191'
  - symbol: updateTool
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L193-L209'
  - symbol: getToolState
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L211-L213'
  - symbol: getAllToolStates
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L215-L217'
  - symbol: executeAction
    kind: method
    at: 'src/runtime/dynamic-tool-registry.ts:L219-L231'
---
<!-- context:generated:start -->
## Summary

Pattern-driven automatic enablement/disablement of tools based on runtime performance analysis. Tools can be disabled after repeated failures, re-enabled when improving, with safeguards preventing critical tools from being disabled. State changes are emitted as events.

## Related

- part of [[runtime-orchestration]] — DynamicToolRegistry integrates with ToolRegistry and uses AnalysisReport from PatternAnalyzer to evaluate trends.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
