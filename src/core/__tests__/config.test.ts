/**
 * Tests for configuration management system.
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  validateConfig,
  maskSecrets,
  configToString,
  DEFAULT_CONFIG,
  ConfigWatcher,
  loadConfig,
} from "../config.ts";
import type { AppConfig } from "../config.ts";

Deno.test("validateConfig", async (t) => {
  await t.step("validates correct config", () => {
    const result = validateConfig(DEFAULT_CONFIG);
    assertEquals(result.valid, true);
    if (result.valid) {
      assertEquals(result.config.persistence.dataDir, "./data");
    }
  });

  await t.step("rejects non-object config", () => {
    const result = validateConfig("not an object");
    assertEquals(result.valid, false);
    if (!result.valid) {
      assertEquals(result.errors.length > 0, true);
    }
  });

  await t.step("rejects invalid persistence.dataDir type", () => {
    const result = validateConfig({
      persistence: { dataDir: 123 },
    });
    assertEquals(result.valid, false);
    if (!result.valid) {
      assertEquals(result.errors.some((e) => e.path === "persistence.dataDir"), true);
    }
  });

  await t.step("rejects invalid telemetry.logLevel", () => {
    const result = validateConfig({
      telemetry: { logLevel: "invalid" },
    });
    assertEquals(result.valid, false);
    if (!result.valid) {
      assertEquals(result.errors.some((e) => e.path === "telemetry.logLevel"), true);
    }
  });

  await t.step("accepts valid nested config", () => {
    const result = validateConfig({
      persistence: { dataDir: "/tmp/data" },
      capabilities: {
        shell: { blockedCommands: ["rm"] },
      },
      telemetry: { logLevel: "debug" },
    });
    assertEquals(result.valid, true);
  });

  await t.step("merges with defaults", () => {
    const result = validateConfig({
      persistence: { dataDir: "/custom" },
    });
    assertEquals(result.valid, true);
    if (result.valid) {
      assertEquals(result.config.persistence.dataDir, "/custom");
      assertEquals(result.config.persistence.backupEnabled, false); // from defaults
    }
  });
});

Deno.test("maskSecrets", async (t) => {
  await t.step("masks token fields", () => {
    const config: AppConfig = {
      ...DEFAULT_CONFIG,
      capabilities: {
        ...DEFAULT_CONFIG.capabilities,
        github: { enabled: true, token: "ghp_secret123" },
      },
    };

    const masked = maskSecrets(config);
    assertEquals(masked.capabilities.github.token, "***");
  });

  await t.step("preserves non-secret fields", () => {
    const config: AppConfig = {
      ...DEFAULT_CONFIG,
      persistence: { dataDir: "/data", backupEnabled: true },
    };

    const masked = maskSecrets(config);
    assertEquals(masked.persistence.dataDir, "/data");
    assertEquals(masked.persistence.backupEnabled, true);
  });

  await t.step("does not mutate original", () => {
    const config: AppConfig = {
      ...DEFAULT_CONFIG,
      capabilities: {
        ...DEFAULT_CONFIG.capabilities,
        github: { enabled: true, token: "secret" },
      },
    };

    maskSecrets(config);
    assertEquals(config.capabilities.github.token, "secret");
  });
});

Deno.test("configToString", async (t) => {
  await t.step("returns JSON string with masked secrets", () => {
    const config: AppConfig = {
      ...DEFAULT_CONFIG,
      capabilities: {
        ...DEFAULT_CONFIG.capabilities,
        github: { enabled: true, token: "ghp_secret" },
      },
    };

    const str = configToString(config);
    const parsed = JSON.parse(str);

    assertEquals(parsed.capabilities.github.token, "***");
    assertEquals(parsed.persistence.dataDir, "./data");
  });

  await t.step("returns valid JSON", () => {
    const str = configToString(DEFAULT_CONFIG);
    const parsed = JSON.parse(str);
    assertExists(parsed.persistence);
    assertExists(parsed.capabilities);
  });
});

// ============================================================================
// Hot-Reload Tests
// ============================================================================

Deno.test("ConfigWatcher", async (t) => {
  await t.step("creates watcher with initial config", () => {
    const watcher = new ConfigWatcher("/tmp/test-config", DEFAULT_CONFIG);
    assertEquals(watcher.config, DEFAULT_CONFIG);
    watcher.stop();
  });

  await t.step("notifies listeners on config change", async () => {
    const tmpDir = await Deno.makeTempDir();
    const configPath = `${tmpDir}/config.yaml`;

    // Write initial config
    await Deno.writeTextFile(configPath, `
persistence:
  dataDir: ./test-data
  backupEnabled: false
telemetry:
  enabled: false
  logLevel: info
`);

    const initialConfig = await loadConfig(tmpDir);
    const watcher = new ConfigWatcher(tmpDir, initialConfig);

    const received: AppConfig[] = [];
    const unsub = watcher.onChange((config) => {
      received.push(config);
    });

    // Start watcher in background
    watcher.start();

    // Wait for watcher to be ready
    await new Promise((r) => setTimeout(r, 200)); // real timer: watcher startup

    // Modify config file — trigger reload
    await Deno.writeTextFile(configPath, `
persistence:
  dataDir: ./updated-data
  backupEnabled: true
telemetry:
  enabled: true
  logLevel: debug
`);

    // Wait for debounce + reload
    await new Promise((r) => setTimeout(r, 500)); // real timer: debounce + fs event

    assertEquals(received.length, 1);
    assertEquals(received[0].persistence.dataDir, "./updated-data");
    assertEquals(received[0].persistence.backupEnabled, true);
    assertEquals(received[0].telemetry.enabled, true);
    assertEquals(received[0].telemetry.logLevel, "debug");

    unsub();
    watcher.stop();
    await Deno.remove(tmpDir, { recursive: true });
  });

  await t.step("keeps previous config on validation failure", async () => {
    const tmpDir = await Deno.makeTempDir();
    const configPath = `${tmpDir}/config.yaml`;

    // Write valid config
    await Deno.writeTextFile(configPath, `
persistence:
  dataDir: ./valid-data
  backupEnabled: false
telemetry:
  enabled: false
  logLevel: info
`);

    const initialConfig = await loadConfig(tmpDir);
    const watcher = new ConfigWatcher(tmpDir, initialConfig);

    const received: AppConfig[] = [];
    watcher.onChange((config) => {
      received.push(config);
    });

    watcher.start();
    await new Promise((r) => setTimeout(r, 200)); // real timer: watcher startup

    // Write invalid config (bad telemetry.logLevel)
    await Deno.writeTextFile(configPath, `
persistence:
  dataDir: ./invalid-data
telemetry:
  logLevel: invalid_level
`);

    // Wait for debounce + reload attempt
    await new Promise((r) => setTimeout(r, 500)); // real timer: debounce + fs event

    // Should NOT have received a new config (validation failed, kept previous)
    assertEquals(received.length, 0);
    assertEquals(watcher.config.persistence.dataDir, "./valid-data");

    watcher.stop();
    await Deno.remove(tmpDir, { recursive: true });
  });

  await t.step("unsubscribe stops notifications", async () => {
    const watcher = new ConfigWatcher("/tmp/test-unsub", DEFAULT_CONFIG);

    let callCount = 0;
    const unsub = watcher.onChange(() => { callCount++; });

    watcher.updateConfig(DEFAULT_CONFIG);
    assertEquals(callCount, 1);

    unsub();
    watcher.updateConfig(DEFAULT_CONFIG);
    assertEquals(callCount, 1); // Should not increment after unsub

    watcher.stop();
  });

  await t.step("ignores non-yaml file changes", async () => {
    const tmpDir = await Deno.makeTempDir();

    const initialConfig = await loadConfig(tmpDir);
    const watcher = new ConfigWatcher(tmpDir, initialConfig);

    let called = false;
    watcher.onChange(() => { called = true; });

    watcher.start();
    await new Promise((r) => setTimeout(r, 200)); // real timer: watcher startup

    // Write a non-yaml file
    await Deno.writeTextFile(`${tmpDir}/readme.txt`, "hello");

    await new Promise((r) => setTimeout(r, 500)); // real timer: debounce + fs event

    assertEquals(called, false);

    watcher.stop();
    await Deno.remove(tmpDir, { recursive: true });
  });
});
