## Purpose

Typed configuration management for the agent platform, supporting config files, environment variable overrides, per-environment configurations, and secure secrets handling.

## ADDED Requirements

### Requirement: Configuration schema

The system MUST define typed configuration schemas with defaults and validation.

#### Scenario: Config definition
- **WHEN** a module defines its configuration
- **THEN** it specifies types, defaults, and validation rules for each field

#### Scenario: Config loading
- **WHEN** the system starts
- **THEN** configuration is loaded from files and environment variables, merged in precedence order, and validated

#### Scenario: Invalid config
- **WHEN** configuration fails validation
- **THEN** the system logs the specific validation errors and uses defaults where possible, or fails to start if required config is missing

### Requirement: Environment overrides

Configuration MUST support per-environment overrides.

#### Scenario: Environment-specific file
- **WHEN** a `config.<environment>.yaml` file exists (e.g., `config.production.yaml`)
- **THEN** its values override the base `config.yaml`

#### Scenario: Environment variable override
- **WHEN** an environment variable `KAYAK_<MODULE>_<KEY>` is set
- **THEN** it overrides the corresponding config file value

#### Scenario: Precedence order
- **WHEN** the same key is defined in multiple sources
- **THEN** precedence is: environment variable > environment-specific file > base file > defaults

### Requirement: Secrets handling

The system MUST handle secrets securely.

#### Scenario: Secret loading
- **WHEN** a config field is marked as `secret: true`
- **THEN** its value is loaded from environment variables or a secrets file, never from plain config files

#### Scenario: Secret masking
- **WHEN** configuration is logged or displayed
- **THEN** secret fields are masked (show `***` instead of the actual value)

#### Scenario: Secret rotation
- **WHEN** a secret value changes at runtime (env var updated)
- **THEN** the system can reload the secret without full restart

### Requirement: Config hot-reload

The system MUST support reloading configuration without restart.

#### Scenario: File change detection
- **WHEN** a config file is modified on disk
- **THEN** the system detects the change and reloads the configuration

#### Scenario: Reload notification
- **WHEN** config is reloaded
- **THEN** modules that depend on the changed config are notified and update their behavior

#### Scenario: Reload failure
- **WHEN** a config reload fails validation
- **THEN** the previous valid configuration is retained and an error is logged
