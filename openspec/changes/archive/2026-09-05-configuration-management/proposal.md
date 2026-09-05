## Why

Configuration is currently ad-hoc — some values are hardcoded, some read from env vars, some passed as constructor args. There's no unified config system, no environment overrides, and no secrets handling. For production deployment, configuration must be formalized.

## What Changes

- **Configuration schema**: Typed config objects with validation and defaults
- **Environment overrides**: Config files with per-environment (dev/staging/prod) overrides
- **Secrets handling**: Secure loading of secrets from env vars or files, never logged
- **Config hot-reload**: Watch config files for changes and update runtime config

### New Capabilities

- `core/configuration`: Typed configuration management with environment overrides and secrets
