/**
 * Tests for configuration management system.
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  validateConfig,
  maskSecrets,
  configToString,
  DEFAULT_CONFIG,
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
