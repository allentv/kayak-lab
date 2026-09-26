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
covers:
  - symbol: MigrationFunction
    kind: type
    at: 'src/core/schema-registry.ts:L21-L21'
  - symbol: SchemaEntry
    kind: interface
    at: 'src/core/schema-registry.ts:L26-L31'
  - symbol: SchemaRegistryError
    kind: class
    at: 'src/core/schema-registry.ts:L37-L46'
  - symbol: constructor
    kind: method
    at: 'src/core/schema-registry.ts:L38-L45'
  - symbol: MigrationError
    kind: class
    at: 'src/core/schema-registry.ts:L48-L53'
  - symbol: constructor
    kind: method
    at: 'src/core/schema-registry.ts:L49-L52'
  - symbol: IncompatibleSchemaError
    kind: class
    at: 'src/core/schema-registry.ts:L55-L60'
  - symbol: constructor
    kind: method
    at: 'src/core/schema-registry.ts:L56-L59'
  - symbol: SchemaRegistry
    kind: class
    at: 'src/core/schema-registry.ts:L72-L215'
  - symbol: register
    kind: method
    at: 'src/core/schema-registry.ts:L90-L117'
  - symbol: getSchema
    kind: method
    at: 'src/core/schema-registry.ts:L126-L131'
  - symbol: getLatestVersion
    kind: method
    at: 'src/core/schema-registry.ts:L139-L151'
  - symbol: checkCompatibility
    kind: method
    at: 'src/core/schema-registry.ts:L167-L182'
  - symbol: getRegisteredVersions
    kind: method
    at: 'src/core/schema-registry.ts:L187-L193'
  - symbol: getWarnings
    kind: method
    at: 'src/core/schema-registry.ts:L198-L200'
  - symbol: clearWarnings
    kind: method
    at: 'src/core/schema-registry.ts:L205-L207'
  - symbol: hasSchema
    kind: method
    at: 'src/core/schema-registry.ts:L212-L214'
  - symbol: migrate
    kind: function
    at: 'src/core/schema-registry.ts:L234-L269'
  - symbol: migrateEvents
    kind: function
    at: 'src/core/schema-registry.ts:L283-L289'
  - symbol: createDefaultSchemaRegistry
    kind: function
    at: 'src/core/schema-registry.ts:L303-L310'
---
<!-- context:generated:start -->
## Summary

A registry for event schemas that supports versioning and lazy migration on read. Schemas can be registered with compatibility checks; breaking changes require explicit migrations. The system warns about breaking changes but does not prevent them, allowing flexible evolution. Migration is optional and applied when a SchemaRegistry is provided to the EventStore.

## Related

- configures [[event-sourcing-session-lifecycle]] — SchemaRegistry can be attached to EventStore to migrate events when they are read from storage.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
