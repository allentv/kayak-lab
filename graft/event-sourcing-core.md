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
