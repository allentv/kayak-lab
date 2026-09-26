---
name: Attestation Service
slug: attestation-service
type: system
sources:
  - path: src/session/__tests__/attestation-service.test.ts
    hash: 25193bc9ecf2df7c5145343072916cd920b1ea8aad33626f2109d975c8561b65
  - path: src/session/attestation-service.ts
    hash: 1e1f670ed650dd96d5d7ae9379496a58ad2dd2256e224d8850ed11333ac9618d
  - path: src/session/mod.ts
    hash: 12fba6676c1a992d11869b35d689db83434d4296e56899a2f18d67b81ec84e40
sources_digest: 00ba2ef7d808e7ba487666808dbccf2165f430ddf6e35257fdc727110a4b98ec
links:
  - to: event-sourcing-persistence-system
    relation: uses
    description: Consumes events from EventStore/EventStream to aggregate session metrics.
  - to: event-type-taxonomy
    relation: depends_on
    description: >-
      Relies on MODEL_RESPONSE events with ModelPayload and AttestationEvent
      type.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Generates cost and usage attestations by aggregating model request/response events from event streams. Calculates token usage and costs using configurable pricing data, emitting SESSION_ATTESTATION events for financial telemetry and performance auditing.

## Related

- uses [[event-sourcing-persistence-system]] — Consumes events from EventStore/EventStream to aggregate session metrics.
- depends on [[event-type-taxonomy]] — Relies on MODEL_RESPONSE events with ModelPayload and AttestationEvent type.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
