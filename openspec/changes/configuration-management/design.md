## Context

Current state: `PersistenceConfig` is passed as a constructor arg. Some env vars are read directly (`Deno.env.get()`). No config files, no validation, no secrets handling. Each module defines its own config inline.

## Goals / Non-Goals

**Goals:**
- Unified typed configuration system
- Environment-specific overrides with clear precedence
- Secure secrets handling (env vars, files, masking)
- Hot-reload without restart

**Non-Goals:**
- Remote configuration (Consul, etcd)
- Encrypted config files
- Configuration UI/dashboard
- Distributed config sync

## Decisions

### 1. YAML config files

**Decision:** Use YAML for config files (base + environment-specific).

**Rationale:**
- Human-readable and editable
- Supports comments (unlike JSON)
- Well-supported in Deno (yaml std lib)
- Environment-specific files: `config.yaml`, `config.production.yaml`

### 2. Typed config with Zod or manual validation

**Decision:** Define config schemas as TypeScript interfaces with runtime validation.

**Rationale:**
- Type safety at compile time
- Runtime validation catches config errors early
- Zod provides schema definition + validation in one

### 3. Secrets in env vars only

**Decision:** Secrets are loaded exclusively from environment variables, not config files.

**Rationale:**
- Config files are committed to repo (or gitignored)
- Env vars are deployment-specific and never committed
- Simplest secrets management for single-server deployment

## Risks / Trade-offs

### Risk: Hot-reload race conditions

**Impact:** Low — config reads are fast, write is atomic (file replacement).

**Mitigation:** Read config under a lock/snapshot. Modules receive new config on next read.

### Risk: YAML parsing vulnerabilities

**Impact:** Low — YAML parsing is well-audited in Deno std lib.

**Mitigation:** Pin yaml library version. Validate parsed config against schema.
