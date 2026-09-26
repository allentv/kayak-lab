---
name: Event Analysis & Optimization
slug: event-analysis-optimization
type: concept
sources:
  - path: src/analysis.ts
    hash: 8436c7b51a843d471a49d1fdf5a1954a3c463dda56a01e15712248b28c69c076
sources_digest: 42ccc9fc3793825ab822855dcdf5f16fe3e07bf49805e54a487ef51b3bbf8bf1
links:
  - to: cli-repl
    relation: produces
    description: CLI provides analyze command that runs analysis and formats report
  - to: event-sourcing-core
    relation: depends_on
    description: Queries EventStore to retrieve session events for analysis
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Post-session analysis engine that queries event store to compute command statistics, identify repeated commands, slow executions, and errors. Generates actionable suggestions for optimization based on session duration and command diversity patterns.

## Related

- produces [[cli-repl]] — CLI provides analyze command that runs analysis and formats report
- depends on [[event-sourcing-core]] — Queries EventStore to retrieve session events for analysis
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
