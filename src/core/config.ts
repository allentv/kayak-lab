/**
 * Configuration management system.
 *
 * Loads, validates, and hot-reloads application configuration
 * from YAML files with environment variable overrides.
 */

import * as path from "node:path";

// ============================================================================
// Config Types
// ============================================================================

/** Persistence configuration. */
export interface PersistenceConfig {
  dataDir: string;
  backupEnabled: boolean;
}

/** Capability configuration. */
export interface CapabilityConfig {
  git: { enabled: boolean };
  github: { enabled: boolean; token?: string };
  shell: { enabled: boolean; blockedCommands: string[] };
}

/** Telemetry configuration. */
export interface TelemetryConfig {
  enabled: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

/** Application configuration. */
export interface AppConfig {
  persistence: PersistenceConfig;
  capabilities: CapabilityConfig;
  telemetry: TelemetryConfig;
}

/** Validation error. */
export interface ConfigValidationError {
  path: string;
  message: string;
}

/** Config validation result. */
export type ConfigValidationResult =
  | { valid: true; config: AppConfig }
  | { valid: false; errors: ConfigValidationError[] };

// ============================================================================
// Default Config
// ============================================================================

export const DEFAULT_CONFIG: AppConfig = {
  persistence: {
    dataDir: "./data",
    backupEnabled: false,
  },
  capabilities: {
    git: { enabled: true },
    github: { enabled: true },
    shell: { enabled: true, blockedCommands: ["rm -rf /"] },
  },
  telemetry: {
    enabled: false,
    logLevel: "info",
  },
};

// ============================================================================
// Config Validation
// ============================================================================

/**
 * Validate a raw config object against the schema.
 */
export function validateConfig(raw: unknown): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  if (typeof raw !== "object" || raw === null) {
    return { valid: false, errors: [{ path: "", message: "Config must be an object" }] };
  }

  const obj = raw as Record<string, unknown>;

  // Validate persistence
  if (obj.persistence !== undefined) {
    const p = obj.persistence as Record<string, unknown>;
    if (typeof p !== "object" || p === null) {
      errors.push({ path: "persistence", message: "Must be an object" });
    } else {
      if (p.dataDir !== undefined && typeof p.dataDir !== "string") {
        errors.push({ path: "persistence.dataDir", message: "Must be a string" });
      }
      if (p.backupEnabled !== undefined && typeof p.backupEnabled !== "boolean") {
        errors.push({ path: "persistence.backupEnabled", message: "Must be a boolean" });
      }
    }
  }

  // Validate capabilities
  if (obj.capabilities !== undefined) {
    const c = obj.capabilities as Record<string, unknown>;
    if (typeof c !== "object" || c === null) {
      errors.push({ path: "capabilities", message: "Must be an object" });
    } else {
      if (c.shell !== undefined) {
        const s = c.shell as Record<string, unknown>;
        if (s.blockedCommands !== undefined && !Array.isArray(s.blockedCommands)) {
          errors.push({ path: "capabilities.shell.blockedCommands", message: "Must be an array" });
        }
      }
    }
  }

  // Validate telemetry
  if (obj.telemetry !== undefined) {
    const t = obj.telemetry as Record<string, unknown>;
    if (typeof t !== "object" || t === null) {
      errors.push({ path: "telemetry", message: "Must be an object" });
    } else {
      if (t.logLevel !== undefined) {
        const validLevels = ["debug", "info", "warn", "error"];
        if (!validLevels.includes(t.logLevel as string)) {
          errors.push({
            path: "telemetry.logLevel",
            message: `Must be one of: ${validLevels.join(", ")}`,
          });
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Merge with defaults
  const config = mergeConfig(DEFAULT_CONFIG, raw as Partial<AppConfig>);
  return { valid: true, config };
}

// ============================================================================
// Config Loading
// ============================================================================

/**
 * Deep merge two config objects. Source overrides target.
 */
function mergeConfig(target: AppConfig, source: Partial<AppConfig>): AppConfig {
  const result = { ...target };

  if (source.persistence) {
    result.persistence = { ...target.persistence, ...source.persistence };
  }
  if (source.capabilities) {
    result.capabilities = {
      ...target.capabilities,
      ...source.capabilities,
      git: { ...target.capabilities.git, ...source.capabilities.git },
      github: { ...target.capabilities.github, ...source.capabilities.github },
      shell: { ...target.capabilities.shell, ...source.capabilities.shell },
    };
  }
  if (source.telemetry) {
    result.telemetry = { ...target.telemetry, ...source.telemetry };
  }

  return result;
}

/**
 * Parse env var overrides.
 * Maps KAYAK_MODULE_KEY → config.module.key
 */
function parseEnvOverrides(envPrefix = "KAYAK_"): Record<string, unknown> {
  const overrides: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(Deno.env.toObject())) {
    if (!key.startsWith(envPrefix)) continue;

    const configPath = key.slice(envPrefix.length).toLowerCase().split("_");
    if (configPath.length < 2) continue;

    // Build nested object
    let current: Record<string, unknown> = overrides;
    for (let i = 0; i < configPath.length - 1; i++) {
      if (!current[configPath[i]]) {
        current[configPath[i]] = {};
      }
      current = current[configPath[i]] as Record<string, unknown>;
    }

    // Parse value
    const lastKey = configPath[configPath.length - 1];
    if (value === "true") {
      current[lastKey] = true;
    } else if (value === "false") {
      current[lastKey] = false;
    } else if (value !== "" && !isNaN(Number(value))) {
      current[lastKey] = Number(value);
    } else {
      current[lastKey] = value;
    }
  }

  return overrides;
}

/**
 * Load configuration from a directory.
 *
 * Precedence: env vars > env-specific file > base file > defaults
 */
export async function loadConfig(configDir: string): Promise<AppConfig> {
  let config = { ...DEFAULT_CONFIG };

  // Try to load base config file
  const basePath = path.join(configDir, "config.yaml");
  try {
    const content = await Deno.readTextFile(basePath);
    const parsed = parseYaml(content);
    const validation = validateConfig(parsed);
    if (validation.valid) {
      config = validation.config;
    } else {
      const msgs = validation.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
      throw new Error(`Config validation failed: ${msgs}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Config validation failed")) {
      throw error;
    }
    // File doesn't exist or can't be read — use defaults
  }

  // Apply env var overrides
  const envOverrides = parseEnvOverrides();
  if (Object.keys(envOverrides).length > 0) {
    config = mergeConfig(config, envOverrides as Partial<AppConfig>);
  }

  return config;
}

// ============================================================================
// YAML Parser (minimal)
// ============================================================================

/**
 * Minimal YAML parser for flat/nested key-value configs.
 * Supports: key: value, nested objects, arrays, booleans, numbers.
 */
function parseYaml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = content.split("\n");
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [
    { obj: result, indent: -1 },
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = line.length - line.trimStart().length;
    const colonIdx = trimmed.indexOf(":");

    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();

    // Pop stack to correct indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    if (!value) {
      // Nested object
      parent[key] = {};
      stack.push({ obj: parent[key] as Record<string, unknown>, indent });
    } else if (value.startsWith("[")) {
      // Array
      parent[key] = parseYamlArray(value);
    } else {
      parent[key] = parseYamlValue(value);
    }
  }

  return result;
}

function parseYamlArray(value: string): unknown[] {
  const inner = value.slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(",").map((s) => parseYamlValue(s.trim()));
}

function parseYamlValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (!isNaN(Number(value))) return Number(value);
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

// ============================================================================
// Config Secret Masking
// ============================================================================

/** Fields that should be masked in output. */
const SECRET_FIELDS = new Set([
  "token",
  "secret",
  "password",
  "api_key",
  "apiKey",
]);

/**
 * Mask secret values in a config object for display.
 */
export function maskSecrets(config: AppConfig): AppConfig {
  const masked = JSON.parse(JSON.stringify(config)) as AppConfig;

  function maskObj(obj: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(obj)) {
      if (SECRET_FIELDS.has(key) && typeof value === "string") {
        obj[key] = "***";
      } else if (typeof value === "object" && value !== null) {
        maskObj(value as Record<string, unknown>);
      }
    }
  }

  maskObj(masked as unknown as Record<string, unknown>);
  return masked;
}

/**
 * Create a string representation with secrets masked.
 */
export function configToString(config: AppConfig): string {
  return JSON.stringify(maskSecrets(config), null, 2);
}

// ============================================================================
// Hot-Reload Config Watcher
// ============================================================================

/** Config change listener. */
export type ConfigChangeListener = (config: AppConfig) => void;

/** Timer handle returned by setTimeout. */
type TimerHandle = ReturnType<typeof setTimeout>;

/**
 * Watches a config directory for changes and hot-reloads configuration.
 *
 * On file change: re-reads, validates, merges, and notifies subscribers.
 * On validation failure: keeps previous config and logs error.
 */
export class ConfigWatcher {
  private configDir: string;
  private currentConfig: AppConfig;
  private listeners: ConfigChangeListener[] = [];
  private watcher?: Deno.FsWatcher;
  private debounceTimer?: TimerHandle;
  private reloading = false;

  constructor(configDir: string, initialConfig: AppConfig) {
    this.configDir = configDir;
    this.currentConfig = initialConfig;
  }

  /**
   * Get a shallow copy of the current configuration.
   */
  get config(): AppConfig {
    return { ...this.currentConfig };
  }

  /**
   * Subscribe to config changes.
   * Returns an unsubscribe function.
   */
  onChange(listener: ConfigChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Start watching the config directory for changes.
   */
  async start(): Promise<void> {
    this.watcher = Deno.watchFs(this.configDir);

    for await (const event of this.watcher) {
      // Debounce: batch rapid file changes (e.g., editor save)
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.handleFileChange(event);
      }, 100);
    }
  }

  /**
   * Stop watching and clean up.
   */
  stop(): void {
    clearTimeout(this.debounceTimer);
    this.watcher?.close();
    this.watcher = undefined;
  }

  /**
   * Replace the current config (e.g., after external update).
   */
  updateConfig(config: AppConfig): void {
    this.currentConfig = config;
    this.notifyListeners();
  }

  /**
   * Handle a file system event by reloading config.
   */
  private async handleFileChange(event: Deno.FsEvent): Promise<void> {
    // React to any file-system event on yaml files (reload is idempotent)
    const isYaml = event.paths.some(
      (p) => p.endsWith(".yaml") || p.endsWith(".yml"),
    );
    if (!isYaml) return;

    // Prevent overlapping reloads
    if (this.reloading) return;
    this.reloading = true;

    try {
      const newConfig = await loadConfig(this.configDir);
      this.currentConfig = newConfig;
      this.notifyListeners();
    } catch (error) {
      // Rollback: keep previous config, log error
      console.error(
        `[config] Reload failed, keeping previous config: ${error instanceof Error ? error.message : error}`,
      );
    } finally {
      this.reloading = false;
    }
  }

  /**
   * Notify all listeners of config change.
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentConfig);
      } catch (error) {
        console.error(`[config] Listener error: ${error}`);
      }
    }
  }
}
