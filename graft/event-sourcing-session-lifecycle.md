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
covers:
  - symbol: EventStreamError
    kind: class
    at: 'src/core/event-stream.ts:L20-L29'
  - symbol: constructor
    kind: method
    at: 'src/core/event-stream.ts:L21-L28'
  - symbol: SequenceError
    kind: class
    at: 'src/core/event-stream.ts:L31-L40'
  - symbol: constructor
    kind: method
    at: 'src/core/event-stream.ts:L32-L39'
  - symbol: ValidationError
    kind: class
    at: 'src/core/event-stream.ts:L42-L47'
  - symbol: constructor
    kind: method
    at: 'src/core/event-stream.ts:L43-L46'
  - symbol: SessionNotFoundError
    kind: class
    at: 'src/core/event-stream.ts:L49-L54'
  - symbol: constructor
    kind: method
    at: 'src/core/event-stream.ts:L50-L53'
  - symbol: IEventStream
    kind: interface
    at: 'src/core/event-stream.ts:L63-L106'
  - symbol: EventStream
    kind: class
    at: 'src/core/event-stream.ts:L121-L300'
  - symbol: append
    kind: method
    at: 'src/core/event-stream.ts:L145-L181'
  - symbol: getEvents
    kind: method
    at: 'src/core/event-stream.ts:L184-L190'
  - symbol: getEventsInRange
    kind: method
    at: 'src/core/event-stream.ts:L193-L202'
  - symbol: getLastEvent
    kind: method
    at: 'src/core/event-stream.ts:L205-L208'
  - symbol: getCurrentSequence
    kind: method
    at: 'src/core/event-stream.ts:L211-L213'
  - symbol: hasSession
    kind: method
    at: 'src/core/event-stream.ts:L216-L218'
  - symbol: getSessionIds
    kind: method
    at: 'src/core/event-stream.ts:L221-L223'
  - symbol: onAppend
    kind: method
    at: 'src/core/event-stream.ts:L234-L266'
  - symbol: notifySubscribers
    kind: method
    at: 'src/core/event-stream.ts:L272-L285'
  - symbol: totalEvents
    kind: method
    at: 'src/core/event-stream.ts:L288-L294'
  - symbol: sessionCount
    kind: method
    at: 'src/core/event-stream.ts:L297-L299'
  - symbol: SessionState
    kind: type
    at: 'src/core/session-manager.ts:L20-L25'
  - symbol: Session
    kind: interface
    at: 'src/core/session-manager.ts:L37-L44'
  - symbol: SessionError
    kind: class
    at: 'src/core/session-manager.ts:L50-L55'
  - symbol: constructor
    kind: method
    at: 'src/core/session-manager.ts:L51-L54'
  - symbol: InvalidStateTransitionError
    kind: class
    at: 'src/core/session-manager.ts:L57-L66'
  - symbol: constructor
    kind: method
    at: 'src/core/session-manager.ts:L58-L65'
  - symbol: ISessionManager
    kind: interface
    at: 'src/core/session-manager.ts:L72-L85'
  - symbol: SessionManager
    kind: class
    at: 'src/core/session-manager.ts:L96-L214'
  - symbol: constructor
    kind: method
    at: 'src/core/session-manager.ts:L99-L99'
  - symbol: createSession
    kind: method
    at: 'src/core/session-manager.ts:L101-L134'
  - symbol: pauseSession
    kind: method
    at: 'src/core/session-manager.ts:L136-L138'
  - symbol: resumeSession
    kind: method
    at: 'src/core/session-manager.ts:L140-L142'
  - symbol: completeSession
    kind: method
    at: 'src/core/session-manager.ts:L144-L146'
  - symbol: failSession
    kind: method
    at: 'src/core/session-manager.ts:L148-L152'
  - symbol: cancelSession
    kind: method
    at: 'src/core/session-manager.ts:L154-L156'
  - symbol: getSession
    kind: method
    at: 'src/core/session-manager.ts:L158-L161'
  - symbol: getSessions
    kind: method
    at: 'src/core/session-manager.ts:L163-L165'
  - symbol: cloneSession
    kind: method
    at: 'src/core/session-manager.ts:L170-L172'
  - symbol: transition
    kind: method
    at: 'src/core/session-manager.ts:L174-L213'
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
