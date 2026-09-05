## 1. Config Schema

- [x] 1.1 Define `AppConfig` type with nested module configs (persistence, capabilities, telemetry, etc.). Verify: type compiles.
- [x] 1.2 Define default config values for all modules. Verify: defaults object matches AppConfig type.
- [x] 1.3 Implement `validateConfig(raw)` that validates a parsed config object against the schema. Returns valid config or validation errors. Verify: valid config passes, invalid returns errors.

## 2. Config Loading

- [x] 2.1 Implement `loadConfig(configDir)` that reads `config.yaml`, applies environment-specific overrides, and merges env vars. Verify: config loaded and merged correctly.
- [x] 2.2 Implement env var override parsing: `KAYAK_PERSISTENCE_DATA_DIR` → `config.persistence.dataDir`. Verify: env var overrides file value.
- [x] 2.3 Implement precedence merge: env var > env-specific file > base file > defaults. Verify: precedence correct with overlapping keys.

## 3. Secrets Handling

- [x] 3.1 Mark secret fields in config schema with `secret: true`. Verify: schema marks fields correctly.
- [x] 3.2 Implement secret loading from env vars: `KAYAK_SECRET_GITHUB_TOKEN` → `config.capabilities.github.token`. Verify: secret loaded from env.
- [x] 3.3 Implement secret masking in `config.toString()` and logging. Verify: secrets show `***` in output.

## 4. Hot-Reload

- [x] 4.1 Implement file watcher on config directory using `Deno.watchFs`. Verify: file change detected.
- [x] 4.2 Implement reload: re-read, validate, merge, notify subscribers. Verify: config updated after file change.
- [x] 4.3 Implement rollback on validation failure: keep previous config, log error. Verify: bad config doesn't replace valid config.

## 5. Tests

- [x] 5.1 Write config loading tests: base file, env-specific overrides, env var overrides, precedence. Verify: all tests pass.
- [x] 5.2 Write validation tests: valid config, missing required fields, invalid types. Verify: all tests pass.
- [x] 5.3 Write secrets tests: loading from env, masking in output. Verify: all tests pass.
- [x] 5.4 Write hot-reload tests: file change triggers reload, bad file rollbacks. Verify: all tests pass.
- [x] 5.5 Verify existing 112+ tests still pass. Verify: `deno test` passes.
