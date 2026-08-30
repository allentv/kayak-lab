## 1. Schema Registry

- [ ] 1.1 Implement `SchemaRegistry` class with `register(eventType, version, schema, migration?)` method. Verify: schema registered and retrievable.
- [ ] 1.2 Implement `getSchema(eventType, version)` lookup. Verify: returns correct schema for version.
- [ ] 1.3 Implement `getLatestVersion(eventType)` that returns the highest registered version. Verify: returns correct latest version.
- [ ] 1.4 Implement `checkCompatibility(oldSchema, newSchema)` that checks backward compatibility. Verify: additive = compatible, removal = incompatible.

## 2. Migration Framework

- [ ] 2.1 Define `MigrationFunction` type: `(event: BaseEvent) => BaseEvent`. Verify: type compiles.
- [ ] 2.2 Implement `migrate(event, targetVersion)` that chains migration functions from event's version to target. Verify: event transformed through chain.
- [ ] 2.3 Implement `migrateEvents(events, targetVersion)` for batch migration. Verify: all events migrated correctly.
- [ ] 2.4 Handle missing migration path: return error with gap description. Verify: error reported when path missing.

## 3. Integration

- [ ] 3.1 Integrate schema registry with `EventTypes` — auto-register schemas on event type definition. Verify: schemas registered on type definition.
- [ ] 3.2 Add migration step to `EventStore.getEvents()` — migrate on read if version mismatch. Verify: old-version events returned in current format.
- [ ] 3.3 Add compatibility check to schema registration — warn on breaking changes without migration. Verify: breaking change without migration produces warning.

## 4. Tests

- [ ] 4.1 Write schema registry tests: register, lookup, compatibility check. Verify: all tests pass.
- [ ] 4.2 Write migration tests: single-version, multi-version, missing path. Verify: all tests pass.
- [ ] 4.3 Write integration test: register v1 schema, store events, register v2 with migration, read events — all migrated. Verify: end-to-end migration works.
- [ ] 4.4 Verify existing 112+ tests still pass. Verify: `deno test` passes.
