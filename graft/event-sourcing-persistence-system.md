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
