## ADDED Requirements

### Requirement: Config module uses runtime abstraction

The config module MUST access environment variables, read files, and watch for changes via the runtime abstractions, not directly via `Deno.env`, `Deno.readTextFile`, `Deno.watchFs`.

#### Scenario: Config loading works unchanged

- **WHEN** config is loaded from YAML with environment variable overrides
- **THEN** the same config is produced as before the migration

#### Scenario: Hot-reload works on both runtimes

- **WHEN** the config file changes
- **THEN** the watcher fires and config is reloaded with debounce

#### Scenario: Identical behavior on both runtimes

- **WHEN** the config test suite runs on Deno and Node.js
- **THEN** both produce identical results
