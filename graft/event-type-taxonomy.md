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
covers:
  - symbol: ModelMetrics
    kind: interface
    at: 'src/types/attestations.ts:L10-L18'
  - symbol: ProvenanceSummary
    kind: interface
    at: 'src/types/attestations.ts:L21-L27'
  - symbol: AttestationEvent
    kind: interface
    at: 'src/types/attestations.ts:L30-L43'
  - symbol: AttestationFilter
    kind: interface
    at: 'src/types/attestations.ts:L46-L52'
  - symbol: ModelPricing
    kind: interface
    at: 'src/types/attestations.ts:L59-L66'
  - symbol: PricingConfig
    kind: interface
    at: 'src/types/attestations.ts:L69-L71'
  - symbol: EventType
    kind: type
    at: 'src/types/events.ts:L104-L104'
  - symbol: BaseEvent
    kind: interface
    at: 'src/types/events.ts:L113-L140'
  - symbol: EventMetadata
    kind: interface
    at: 'src/types/events.ts:L145-L157'
  - symbol: SessionCreatedPayload
    kind: interface
    at: 'src/types/events.ts:L167-L179'
  - symbol: ToolExecutionPayload
    kind: interface
    at: 'src/types/events.ts:L184-L202'
  - symbol: ModelPayload
    kind: interface
    at: 'src/types/events.ts:L207-L232'
  - symbol: UserInputPayload
    kind: interface
    at: 'src/types/events.ts:L237-L246'
  - symbol: SelfObservedPayload
    kind: interface
    at: 'src/types/events.ts:L251-L263'
  - symbol: PatternDetectedPayload
    kind: interface
    at: 'src/types/events.ts:L268-L283'
  - symbol: ToolInvocationPayload
    kind: interface
    at: 'src/types/events.ts:L288-L297'
  - symbol: ToolResultPayload
    kind: interface
    at: 'src/types/events.ts:L302-L319'
  - symbol: ToolAuthoredPayload
    kind: interface
    at: 'src/types/events.ts:L324-L333'
  - symbol: ToolImprovementPayload
    kind: interface
    at: 'src/types/events.ts:L338-L345'
  - symbol: AttestationEventPayload
    kind: type
    at: 'src/types/events.ts:L351-L354'
  - symbol: AppendEventInput
    kind: type
    at: 'src/types/events.ts:L368-L368'
  - symbol: isValidEventType
    kind: function
    at: 'src/types/events.ts:L377-L379'
  - symbol: isSessionEvent
    kind: function
    at: 'src/types/events.ts:L384-L388'
  - symbol: isToolEvent
    kind: function
    at: 'src/types/events.ts:L393-L397'
  - symbol: isModelEvent
    kind: function
    at: 'src/types/events.ts:L402-L406'
  - symbol: isSelfObservationEvent
    kind: function
    at: 'src/types/events.ts:L411-L415'
  - symbol: isToolCallingEvent
    kind: function
    at: 'src/types/events.ts:L420-L424'
  - symbol: isToolAuthoredEvent
    kind: function
    at: 'src/types/events.ts:L429-L433'
  - symbol: isToolImprovementEvent
    kind: function
    at: 'src/types/events.ts:L438-L442'
  - symbol: isMCPEvent
    kind: function
    at: 'src/types/events.ts:L447-L456'
  - symbol: isMemoryEvent
    kind: function
    at: 'src/types/events.ts:L461-L469'
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
