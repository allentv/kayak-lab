---
name: Event Sourcing & Session Lifecycle
slug: event-sourcing-session-lifecycle
type: system
sources:
  - path: src/core/event-stream.ts
    hash: 6f644ba24e0ca3a8f26ebf0ef883b723bbfc985aef35e63ca9ebb7723ebbc5fb
  - path: src/core/session-manager.ts
    hash: 54128b33d517550228051ec5a092b32c0c09e7171682a1fc3b6bf3a6c49d5345
sources_digest: 272fae130954191e973497a74f6e3fe46f481bd42a187c666286d782380cca23
links:
  - to: cross-cutting-telemetry
    relation: produces
    description: >-
      All session lifecycle events and state transitions are emitted as
      structured events for observability.
  - to: schema-evolution-migration
    relation: uses
    description: >-
      EventStore can optionally use a SchemaRegistry to migrate events on read,
      ensuring backward compatibility.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Manages immutable, ordered event streams per session, with strict state transitions enforced by SessionManager. Events are append-only, automatically assigned UUIDs and timestamps, and support both global and session-scoped subscriptions. The SessionManager emits events (SESSION_CREATED, etc.) via the EventStream and throws InvalidStateTransitionError for illegal state changes.

## Related

- produces [[cross-cutting-telemetry]] — All session lifecycle events and state transitions are emitted as structured events for observability.
- uses [[schema-evolution-migration]] — EventStore can optionally use a SchemaRegistry to migrate events on read, ensuring backward compatibility.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
