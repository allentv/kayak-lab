## Why

The design doc flags event schema evolution as a high-risk area — breaking changes to event schema can invalidate existing event stores. Without formal versioning and migration rules, schema changes will break replay and recovery.

## What Changes

- **Schema versioning**: Every event carries a `schema_version`; the system tracks which versions are supported
- **Backward compatibility rules**: Define what constitutes a breaking vs. non-breaking change (adding optional fields = safe; removing/renaming fields = breaking)
- **Migration utilities**: Tools to migrate events from older schema versions to current
- **Schema registry**: Central registry of all event schemas and their versions

### New Capabilities

- `core/schema-evolution`: Schema versioning, compatibility rules, and migration
