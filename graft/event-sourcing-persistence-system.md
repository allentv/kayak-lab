---
name: Event Sourcing & Persistence System
slug: event-sourcing-persistence-system
type: system
sources:
  - path: src/store/__tests__/event-store.test.ts
    hash: 6e4f93ae26b3b6d147759aeb15c73bc9a217c006606607470fa06d8da4b9a8c5
  - path: src/store/__tests__/persistence.test.ts
    hash: d1a671424298d928ad86292488b3169da03611779fae19879163a0f6fda7d203
  - path: src/store/__tests__/sqlite-backend.test.ts
    hash: cf13364bb7cfa6d432acb018e0f7fc85d94b5e0951ea1586aed5f4340d4df594
  - path: src/store/__tests__/sqlite-migration.test.ts
    hash: 644f00faffc59513571f1c3e9a08d873a5f9e4441b236e05ae440a321b081168
  - path: src/store/__tests__/sqlite-performance.test.ts
    hash: 769f0cf1818f0ea73dc4b170e7bdca1955891c4bfc719fac15f691f98136123b
  - path: src/store/causal-graph.ts
    hash: 03c7eba68dcda9c936f831e7c71ca9dca2c0993c3e8f6ce6db7974f0ed7959b5
  - path: src/store/event-store.ts
    hash: 6aa77821b76a3ac067c476661afccec01eca77bad4bfc2a1af8e74d1278efcf5
  - path: src/store/persistence.ts
    hash: 6aa453e20f932554105e78b38fcdb5a6ccdb450136ebb577ebfe9944662c8810
  - path: src/store/sqlite-backend.ts
    hash: 3f504e193810e7bc4c78de3e21235c9432c00fc24d96ce5772547f41057f9ee9
sources_digest: e1011f606d23c1a694055578ca1600d433c4b48e20469c0aecdf1a3efca02643
links:
  - to: attestation-service
    relation: produces
    description: >-
      Provides event streams that AttestationService aggregates into cost
      attestations.
  - to: event-type-taxonomy
    relation: depends_on
    description: >-
      Uses BaseEvent, EventTypes, and derived payload interfaces for type-safe
      storage and querying.
  - to: sqlite-query-engine
    relation: produces
    description: Stores events that the SQLiteQueryEngine analyzes via SQL queries.
generator:
  version: 1
covers:
  - symbol: createTestEvent
    kind: function
    at: 'src/store/__tests__/event-store.test.ts:L8-L23'
  - symbol: createTestEvent
    kind: function
    at: 'src/store/__tests__/persistence.test.ts:L14-L25'
  - symbol: createTempDir
    kind: function
    at: 'src/store/__tests__/persistence.test.ts:L27-L29'
  - symbol: createTestEvent
    kind: function
    at: 'src/store/__tests__/sqlite-backend.test.ts:L13-L24'
  - symbol: createTestSnapshot
    kind: function
    at: 'src/store/__tests__/sqlite-backend.test.ts:L26-L33'
  - symbol: createTestEvent
    kind: function
    at: 'src/store/__tests__/sqlite-migration.test.ts:L14-L25'
  - symbol: createTestEvent
    kind: function
    at: 'src/store/__tests__/sqlite-performance.test.ts:L13-L24'
  - symbol: CausalGraphNode
    kind: interface
    at: 'src/store/causal-graph.ts:L15-L18'
  - symbol: buildCausalGraph
    kind: function
    at: 'src/store/causal-graph.ts:L28-L50'
  - symbol: findDownstream
    kind: function
    at: 'src/store/causal-graph.ts:L60-L89'
  - symbol: findIndependentChains
    kind: function
    at: 'src/store/causal-graph.ts:L95-L140'
  - symbol: getCausalParents
    kind: function
    at: 'src/store/causal-graph.ts:L150-L154'
  - symbol: Snapshot
    kind: interface
    at: 'src/store/event-store.ts:L23-L28'
  - symbol: IEventStore
    kind: interface
    at: 'src/store/event-store.ts:L34-L66'
  - symbol: EventStore
    kind: class
    at: 'src/store/event-store.ts:L72-L200'
  - symbol: constructor
    kind: method
    at: 'src/store/event-store.ts:L77-L79'
  - symbol: store
    kind: method
    at: 'src/store/event-store.ts:L81-L85'
  - symbol: migrateIfNeeded
    kind: method
    at: 'src/store/event-store.ts:L87-L97'
  - symbol: getEvents
    kind: method
    at: 'src/store/event-store.ts:L99-L102'
  - symbol: getEventsInRange
    kind: method
    at: 'src/store/event-store.ts:L104-L112'
  - symbol: getLastEvent
    kind: method
    at: 'src/store/event-store.ts:L114-L117'
  - symbol: hasSession
    kind: method
    at: 'src/store/event-store.ts:L119-L121'
  - symbol: getSessionIds
    kind: method
    at: 'src/store/event-store.ts:L123-L125'
  - symbol: createSnapshot
    kind: method
    at: 'src/store/event-store.ts:L127-L146'
  - symbol: getLatestSnapshot
    kind: method
    at: 'src/store/event-store.ts:L148-L151'
  - symbol: getEventsAfterSnapshot
    kind: method
    at: 'src/store/event-store.ts:L153-L161'
  - symbol: flush
    kind: method
    at: 'src/store/event-store.ts:L163-L165'
  - symbol: buildCausalGraph
    kind: method
    at: 'src/store/event-store.ts:L167-L172'
  - symbol: findDownstream
    kind: method
    at: 'src/store/event-store.ts:L174-L182'
  - symbol: findIndependentChains
    kind: method
    at: 'src/store/event-store.ts:L184-L187'
  - symbol: totalEvents
    kind: method
    at: 'src/store/event-store.ts:L189-L195'
  - symbol: sessionCount
    kind: method
    at: 'src/store/event-store.ts:L197-L199'
  - symbol: EventStoreBridge
    kind: class
    at: 'src/store/event-store.ts:L214-L267'
  - symbol: constructor
    kind: method
    at: 'src/store/event-store.ts:L218-L229'
  - symbol: connect
    kind: method
    at: 'src/store/event-store.ts:L237-L259'
  - symbol: storeEvent
    kind: method
    at: 'src/store/event-store.ts:L264-L266'
  - symbol: IPersistenceBackend
    kind: interface
    at: 'src/store/persistence.ts:L24-L65'
  - symbol: PersistenceConfig
    kind: interface
    at: 'src/store/persistence.ts:L74-L80'
  - symbol: FilePersistenceBackend
    kind: class
    at: 'src/store/persistence.ts:L89-L167'
  - symbol: constructor
    kind: method
    at: 'src/store/persistence.ts:L92-L94'
  - symbol: write
    kind: method
    at: 'src/store/persistence.ts:L96-L106'
  - symbol: readLines
    kind: method
    at: 'src/store/persistence.ts:L108-L116'
  - symbol: writeSnapshot
    kind: method
    at: 'src/store/persistence.ts:L118-L128'
  - symbol: readSnapshot
    kind: method
    at: 'src/store/persistence.ts:L130-L138'
  - symbol: listSessions
    kind: method
    at: 'src/store/persistence.ts:L140-L157'
  - symbol: exists
    kind: method
    at: 'src/store/persistence.ts:L159-L166'
  - symbol: PersistentEventStore
    kind: class
    at: 'src/store/persistence.ts:L177-L309'
  - symbol: constructor
    kind: method
    at: 'src/store/persistence.ts:L182-L185'
  - symbol: store
    kind: method
    at: 'src/store/persistence.ts:L187-L195'
  - symbol: getEvents
    kind: method
    at: 'src/store/persistence.ts:L197-L200'
  - symbol: getEventsInRange
    kind: method
    at: 'src/store/persistence.ts:L202-L206'
  - symbol: getLastEvent
    kind: method
    at: 'src/store/persistence.ts:L208-L211'
  - symbol: hasSession
    kind: method
    at: 'src/store/persistence.ts:L213-L215'
  - symbol: getSessionIds
    kind: method
    at: 'src/store/persistence.ts:L217-L219'
  - symbol: createSnapshot
    kind: method
    at: 'src/store/persistence.ts:L221-L236'
  - symbol: getLatestSnapshot
    kind: method
    at: 'src/store/persistence.ts:L238-L240'
  - symbol: getEventsAfterSnapshot
    kind: method
    at: 'src/store/persistence.ts:L242-L247'
  - symbol: flush
    kind: method
    at: 'src/store/persistence.ts:L249-L251'
  - symbol: buildCausalGraph
    kind: method
    at: 'src/store/persistence.ts:L253-L258'
  - symbol: findDownstream
    kind: method
    at: 'src/store/persistence.ts:L260-L267'
  - symbol: findIndependentChains
    kind: method
    at: 'src/store/persistence.ts:L269-L272'
  - symbol: recover
    kind: method
    at: 'src/store/persistence.ts:L274-L308'
  - symbol: SQLiteConfig
    kind: interface
    at: 'src/store/sqlite-backend.ts:L22-L25'
  - symbol: SQLitePersistenceBackend
    kind: class
    at: 'src/store/sqlite-backend.ts:L35-L432'
  - symbol: constructor
    kind: method
    at: 'src/store/sqlite-backend.ts:L40-L45'
  - symbol: initSchema
    kind: method
    at: 'src/store/sqlite-backend.ts:L51-L93'
  - symbol: write
    kind: method
    at: 'src/store/sqlite-backend.ts:L99-L114'
  - symbol: readLines
    kind: method
    at: 'src/store/sqlite-backend.ts:L116-L122'
  - symbol: writeSnapshot
    kind: method
    at: 'src/store/sqlite-backend.ts:L124-L134'
  - symbol: readSnapshot
    kind: method
    at: 'src/store/sqlite-backend.ts:L136-L144'
  - symbol: listSessions
    kind: method
    at: 'src/store/sqlite-backend.ts:L146-L152'
  - symbol: exists
    kind: method
    at: 'src/store/sqlite-backend.ts:L154-L161'
  - symbol: store
    kind: method
    at: 'src/store/sqlite-backend.ts:L167-L180'
  - symbol: retrieve
    kind: method
    at: 'src/store/sqlite-backend.ts:L182-L198'
  - symbol: delete
    kind: method
    at: 'src/store/sqlite-backend.ts:L200-L210'
  - symbol: list
    kind: method
    at: 'src/store/sqlite-backend.ts:L212-L242'
  - symbol: isAvailable
    kind: method
    at: 'src/store/sqlite-backend.ts:L244-L246'
  - symbol: writeScenario
    kind: method
    at: 'src/store/sqlite-backend.ts:L252-L283'
  - symbol: readScenario
    kind: method
    at: 'src/store/sqlite-backend.ts:L285-L307'
  - symbol: listScenarios
    kind: method
    at: 'src/store/sqlite-backend.ts:L309-L335'
  - symbol: deleteScenario
    kind: method
    at: 'src/store/sqlite-backend.ts:L337-L349'
  - symbol: countScenarios
    kind: method
    at: 'src/store/sqlite-backend.ts:L351-L358'
  - symbol: readCore
    kind: method
    at: 'src/store/sqlite-backend.ts:L364-L385'
  - symbol: writeCore
    kind: method
    at: 'src/store/sqlite-backend.ts:L387-L417'
  - symbol: getDatabase
    kind: method
    at: 'src/store/sqlite-backend.ts:L423-L425'
  - symbol: close
    kind: method
    at: 'src/store/sqlite-backend.ts:L427-L431'
---
<!-- context:generated:start -->
## Summary

Core event-sourcing infrastructure for storing, querying, and analyzing agent interaction events with support for snapshots, causal graphs, and multiple persistence backends (JSONL files, SQLite). Provides the foundation for session replay, crash recovery, and analytics.

## Related

- produces [[attestation-service]] — Provides event streams that AttestationService aggregates into cost attestations.
- depends on [[event-type-taxonomy]] — Uses BaseEvent, EventTypes, and derived payload interfaces for type-safe storage and querying.
- produces [[sqlite-query-engine]] — Stores events that the SQLiteQueryEngine analyzes via SQL queries.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
