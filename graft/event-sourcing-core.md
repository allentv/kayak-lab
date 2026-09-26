---
name: Event-Sourcing Core
slug: event-sourcing-core
type: system
sources:
  - path: src/__tests__/e2e-session-lifecycle.test.ts
    hash: 599e893c38e21c102c3af40440c990fa540fef8a801e1d468704ba704f459006
  - path: src/analysis.ts
    hash: 8436c7b51a843d471a49d1fdf5a1954a3c463dda56a01e15712248b28c69c076
  - path: src/cli.ts
    hash: 45d10ec443e3d1d91f79ec470559d2077795900535455617f5a9c131aad0f24b
sources_digest: 347d84ffbf2af72b72d4a67b6bf8664ac0365d8e9621666c9a4914315423fc4a
links:
  - to: capability-framework
    relation: uses
    description: CLI initializes CapabilityRegistry and wires it into AgentRuntime
  - to: test-utilities
    relation: validates
    description: E2E tests verify event persistence and session isolation
generator:
  version: 1
covers:
  - symbol: SessionSummary
    kind: interface
    at: 'src/analysis.ts:L14-L21'
  - symbol: CommandStats
    kind: interface
    at: 'src/analysis.ts:L23-L30'
  - symbol: AnalysisResult
    kind: interface
    at: 'src/analysis.ts:L32-L39'
  - symbol: analyzeSessions
    kind: function
    at: 'src/analysis.ts:L48-L173'
  - symbol: generateSuggestions
    kind: function
    at: 'src/analysis.ts:L178-L233'
  - symbol: formatAnalysisReport
    kind: function
    at: 'src/analysis.ts:L238-L307'
  - symbol: formatDuration
    kind: function
    at: 'src/analysis.ts:L313-L317'
  - symbol: CliArgs
    kind: interface
    at: 'src/cli.ts:L40-L44'
  - symbol: parseArgs
    kind: function
    at: 'src/cli.ts:L50-L74'
  - symbol: ProjectInfo
    kind: interface
    at: 'src/cli.ts:L80-L85'
  - symbol: detectProject
    kind: function
    at: 'src/cli.ts:L87-L130'
  - symbol: HarnessComponents
    kind: interface
    at: 'src/cli.ts:L136-L145'
  - symbol: initializeHarness
    kind: function
    at: 'src/cli.ts:L147-L643'
  - symbol: invoke
    kind: method
    at: 'src/cli.ts:L227-L273'
  - symbol: stream
    kind: method
    at: 'src/cli.ts:L274-L340'
  - symbol: shellHandler
    kind: function
    at: 'src/cli.ts:L347-L361'
  - symbol: gitHandler
    kind: function
    at: 'src/cli.ts:L372-L384'
  - symbol: fileHandler
    kind: function
    at: 'src/cli.ts:L396-L450'
  - symbol: searchHandler
    kind: function
    at: 'src/cli.ts:L469-L511'
  - symbol: githubHandler
    kind: function
    at: 'src/cli.ts:L534-L615'
  - symbol: runRepl
    kind: function
    at: 'src/cli.ts:L649-L744'
  - symbol: analyze
    kind: function
    at: 'src/cli.ts:L750-L793'
  - symbol: main
    kind: function
    at: 'src/cli.ts:L799-L827'
---
<!-- context:generated:start -->
## Summary

Foundation for session management and event persistence: EventStream handles append-only event storage, SessionManager orchestrates session lifecycle (create/pause/resume/complete), and EventStore provides query capabilities with snapshot support. Events are immutable and sequenced with causal metadata.

## Related

- uses [[capability-framework]] — CLI initializes CapabilityRegistry and wires it into AgentRuntime
- validates [[test-utilities]] — E2E tests verify event persistence and session isolation
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
