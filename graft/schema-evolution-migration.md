---
name: Schema Evolution & Migration
slug: schema-evolution-migration
type: concept
sources:
  - path: src/core/schema-registry.ts
    hash: 720248f30abfcd4a657067ea32118c3c92577fbedba6cecd2bcfa00ce0c1d9ed
sources_digest: ffc3aeb8ff8f4c25b2caabaa787c3e9780c2038f8cf10261ac0d4a23fe268c29
links:
  - to: event-sourcing-session-lifecycle
    relation: configures
    description: >-
      SchemaRegistry can be attached to EventStore to migrate events when they
      are read from storage.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

A registry for event schemas that supports versioning and lazy migration on read. Schemas can be registered with compatibility checks; breaking changes require explicit migrations. The system warns about breaking changes but does not prevent them, allowing flexible evolution. Migration is optional and applied when a SchemaRegistry is provided to the EventStore.

## Related

- configures [[event-sourcing-session-lifecycle]] — SchemaRegistry can be attached to EventStore to migrate events when they are read from storage.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
