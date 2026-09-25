---
name: Cross-Cutting Telemetry
slug: cross-cutting-telemetry
type: system
sources:
  - path: src/cross-cutting/telemetry/logger.ts
    hash: 3ad39db92ac2c69cf07f6230498fbcd06305c43b2b73b4950e1f0dd8b1586f74
  - path: src/cross-cutting/telemetry/metrics.ts
    hash: dca4e983f2782a177cf53ebd59ec20ddb8ef00c87c18f47408728094a07b65bd
  - path: src/cross-cutting/telemetry/mod.ts
    hash: 2ff1e54954e8d762b15db008508704b75339604818d418d2dfcf024d2d080987
  - path: src/cross-cutting/telemetry/tracing.ts
    hash: 10f4377bb473257694c202de4f8087cdf0bc1d18595adcd37a488a3df4b90ca9
  - path: src/cross-cutting/telemetry/types.ts
    hash: 7ca7bd532a30c7efee92dcf5702290cc62dfe31ba3b3722c47b43b0142595677
sources_digest: c554afd748e5b8fb20717b7d89eae04aeb0d64dfa93017d61e14e4a2e64d9c99
links:
  - to: event-sourcing-session-lifecycle
    relation: validates
    description: >-
      Telemetry logs and traces capture all event emissions and session state
      transitions.
  - to: identity-authorization
    relation: uses
    description: >-
      Logger and traces can attach user identity from middleware via
      attachUserToMetadata.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Unified observability suite: structured logging (JSON to stderr), metrics (Prometheus format), and distributed tracing (OpenTelemetry-compatible). Logger stores entries in memory for programmatic access; metrics collector handles counters, gauges, histograms with label sorting; trace manager uses in-memory maps. Designed to be lightweight with no external SDKs.

## Related

- validates [[event-sourcing-session-lifecycle]] — Telemetry logs and traces capture all event emissions and session state transitions.
- uses [[identity-authorization]] — Logger and traces can attach user identity from middleware via attachUserToMetadata.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
