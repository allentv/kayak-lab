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
