---
name: Event Type Taxonomy
slug: event-type-taxonomy
type: concept
sources:
  - path: src/types/attestations.ts
    hash: afbf1f997b34e216a4c572a0b6812127403b7a0c973f876a55e67aaadc757877
  - path: src/types/events.ts
    hash: 8203e72009eb82a4d84755bf18f9d77c8dbad285bedc1a2113ff46ff9c2f9ea7
sources_digest: 971102630ee372676b65217154b79bfa7891a498a3c07391bbe618fd10ed63c3
links:
  - to: attestation-service
    relation: depends_on
    description: >-
      Consumes MODEL_RESPONSE events with ModelPayload for token usage
      aggregation.
  - to: event-sourcing-persistence-system
    relation: validates
    description: EventStore validates incoming events against EventTypes registry.
  - to: tool-calling-system
    relation: validates
    description: Tool execution events must conform to ToolExecutionPayload interface.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Immutable, centralized event taxonomy defining all agent interaction types (tool execution, model calls, session lifecycle) with strict string literal unions and type guards. Serves as the single source of truth for event payload structures and enables type-safe handling across the system.

## Related

- depends on [[attestation-service]] — Consumes MODEL_RESPONSE events with ModelPayload for token usage aggregation.
- validates [[event-sourcing-persistence-system]] — EventStore validates incoming events against EventTypes registry.
- validates [[tool-calling-system]] — Tool execution events must conform to ToolExecutionPayload interface.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
