---
name: CLI & REPL
slug: cli-repl
type: system
sources:
  - path: src/cli.ts
    hash: 45d10ec443e3d1d91f79ec470559d2077795900535455617f5a9c131aad0f24b
sources_digest: a44b4cc7ec1ecc544b32964b30e22af3a98d749f5a752ef9ea5731e48c3ccf55
links:
  - to: capability-framework
    relation: uses
    description: Initializes CapabilityRegistry with ShellCapability and GitCapability
  - to: event-sourcing-core
    relation: uses
    description: 'Creates EventStream, SessionManager, PersistentEventStore'
generator:
  version: 1
covers:
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

Interactive command-line interface that wires together all core components: initializes EventStream, SessionManager, CapabilityRegistry, PersistentEventStore (SQLite), ProjectionProtocol, ModelManager, and ToolRegistry into an AgentRuntime for REPL interaction. Provides session analysis and export commands.

## Related

- uses [[capability-framework]] — Initializes CapabilityRegistry with ShellCapability and GitCapability
- uses [[event-sourcing-core]] — Creates EventStream, SessionManager, PersistentEventStore
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
