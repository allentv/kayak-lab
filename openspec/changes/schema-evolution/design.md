## Context

Events are the canonical data format. The `BaseEvent` interface defines `schema_version: string`. The `EventTypes` registry maps event types to their schemas. Currently there's no versioning, migration, or compatibility checking — all events assume the current schema.

## Goals / Non-Goals

**Goals:**
- Enable safe schema evolution without breaking existing event stores
- Provide migration utilities for breaking changes
- Define clear compatibility rules for schema authors

**Non-Goals:**
- Automatic schema inference from data
- Cross-system schema migration (e.g., Avro to JSON)
- Runtime schema validation on every event (performance cost)

## Decisions

### 1. SemVer for schema versions

**Decision:** Use semantic versioning (MAJOR.MINOR.PATCH) for schema versions.

**Rationale:**
- PATCH = backward-compatible fixes, MINOR = additive changes, MAJOR = breaking changes
- Well-understood convention
- Enables automatic compatibility checking

### 2. Migration functions, not configs

**Decision:** Migrations are TypeScript functions `(event: BaseEvent) => BaseEvent`, not declarative configs.

**Rationale:**
- Complex migrations need code (field splitting, conditional transforms)
- TypeScript provides type safety
- Easy to test

### 3. Lazy migration on read

**Decision:** Events are migrated on read, not on write. Storage keeps the original format.

**Rationale:**
- No bulk migration needed on schema changes
- Old events remain in original format (audit trail)
- Migration cost is amortized across reads

## Risks / Trade-offs

### Risk: Migration chain performance

**Impact:** Low — most events will be at current version. Multi-version migration is rare.

**Mitigation:** Cache migration results. Snapshot at migration boundaries.

### Risk: Forgetting to register migration

**Impact:** Medium — breaking change without migration leaves events un-migratable.

**Mitigation:** CI check: if major version bumped, migration function must be registered.
