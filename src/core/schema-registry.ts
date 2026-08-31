/**
 * Schema registry and migration framework for event schema evolution.
 *
 * Supports:
 * - Registering schemas per event type and version
 * - Migration functions that transform events between versions
 * - Backward compatibility checking between schema versions
 * - Lazy migration on read (events migrate when retrieved if version mismatch)
 */

import { BaseEvent, EventType, EventTypes, CURRENT_SCHEMA_VERSION } from "../types/events.ts";

// ============================================================================
// Types
// ============================================================================

/**
 * Migration function that transforms an event from one schema version to the next.
 * Each migration handles exactly one version bump (e.g., v1 -> v2).
 */
export type MigrationFunction = (event: BaseEvent) => BaseEvent;

/**
 * Schema definition stored in the registry.
 */
export interface SchemaEntry {
  /** Schema definition (arbitrary object describing the schema) */
  schema: Record<string, unknown>;
  /** Optional migration from the previous version to this version */
  migration?: MigrationFunction;
}

// ============================================================================
// Errors
// ============================================================================

export class SchemaRegistryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "SchemaRegistryError";
  }
}

export class MigrationError extends SchemaRegistryError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "MIGRATION_ERROR", details);
    this.name = "MigrationError";
  }
}

export class IncompatibleSchemaError extends SchemaRegistryError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "INCOMPATIBLE_SCHEMA", details);
    this.name = "IncompatibleSchemaError";
  }
}

// ============================================================================
// Schema Registry
// ============================================================================

/**
 * Registry for event schemas and their migrations.
 *
 * Schemas are keyed by (eventType, version). Migrations are registered
 * alongside schemas and chained when migrating events across versions.
 */
export class SchemaRegistry {
  /** Map of eventType -> (version -> SchemaEntry) */
  private readonly schemas = new Map<
    EventType,
    Map<number, SchemaEntry>
  >();

  /** Warnings produced during registration (e.g., breaking changes without migration) */
  private readonly warnings: string[] = [];

  /**
   * Register a schema for an event type at a specific version.
   *
   * @param eventType - The event type to register the schema for
   * @param version - The schema version number
   * @param schema - The schema definition
   * @param migration - Optional migration from the previous version to this one
   */
  register(
    eventType: EventType,
    version: number,
    schema: Record<string, unknown>,
    migration?: MigrationFunction,
  ): void {
    let versionMap = this.schemas.get(eventType);
    if (!versionMap) {
      versionMap = new Map();
      this.schemas.set(eventType, versionMap);
    }

    // Check for breaking changes without migration
    const existingVersions = Array.from(versionMap.keys()).sort(
      (a, b) => a - b,
    );
    if (existingVersions.length > 0) {
      const highestExisting = existingVersions[existingVersions.length - 1];
      if (version > highestExisting && !migration) {
        this.warnings.push(
          `Breaking schema change for "${eventType}" from v${highestExisting} to v${version} without migration function. ` +
            `Events at v${highestExisting} will not be auto-migrated.`,
        );
      }
    }

    versionMap.set(version, { schema, migration });
  }

  /**
   * Get the schema for an event type at a specific version.
   *
   * @param eventType - The event type to look up
   * @param version - The schema version number
   * @returns The schema entry, or undefined if not found
   */
  getSchema(
    eventType: EventType,
    version: number,
  ): SchemaEntry | undefined {
    return this.schemas.get(eventType)?.get(version);
  }

  /**
   * Get the latest registered version for an event type.
   *
   * @param eventType - The event type to look up
   * @returns The highest registered version, or undefined if no schemas registered
   */
  getLatestVersion(eventType: EventType): number | undefined {
    const versionMap = this.schemas.get(eventType);
    if (!versionMap || versionMap.size === 0) {
      return undefined;
    }
    let highest = 0;
    for (const v of versionMap.keys()) {
      if (v > highest) {
        highest = v;
      }
    }
    return highest;
  }

  /**
   * Check backward compatibility between two schemas.
   *
   * A schema change is compatible if:
   * - New fields are added (additive) — compatible
   * - Existing fields are removed — incompatible
   *
   * This is a simple structural check; complex semantic checks are left to
   * the migration author.
   *
   * @param oldSchema - The existing schema
   * @param newSchema - The proposed new schema
   * @returns true if compatible, false if incompatible
   */
  checkCompatibility(
    oldSchema: Record<string, unknown>,
    newSchema: Record<string, unknown>,
  ): boolean {
    const oldKeys = Object.keys(oldSchema);
    const newKeys = new Set(Object.keys(newSchema));

    // Check if any old keys are removed
    for (const key of oldKeys) {
      if (!newKeys.has(key)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all registered versions for an event type, sorted ascending.
   */
  getRegisteredVersions(eventType: EventType): number[] {
    const versionMap = this.schemas.get(eventType);
    if (!versionMap) {
      return [];
    }
    return Array.from(versionMap.keys()).sort((a, b) => a - b);
  }

  /**
   * Get all warnings accumulated during registration.
   */
  getWarnings(): readonly string[] {
    return [...this.warnings];
  }

  /**
   * Clear accumulated warnings.
   */
  clearWarnings(): void {
    this.warnings.length = 0;
  }

  /**
   * Check if a schema is registered for an event type and version.
   */
  hasSchema(eventType: EventType, version: number): boolean {
    return this.schemas.get(eventType)?.has(version) ?? false;
  }
}

// ============================================================================
// Migration Utilities
// ============================================================================

/**
 * Migrate a single event from its current version to the target version.
 *
 * Chains migration functions registered in the schema registry. Each migration
 * handles one version step. Migrations are applied sequentially from
 * (currentVersion + 1) to targetVersion.
 *
 * @param registry - The schema registry containing migrations
 * @param event - The event to migrate
 * @param targetVersion - The target schema version
 * @returns The migrated event with updated schema_version
 * @throws MigrationError if any migration function is missing in the chain
 */
export function migrate(
  registry: SchemaRegistry,
  event: BaseEvent,
  targetVersion: number,
): BaseEvent {
  const currentVersion = event.schema_version;

  if (currentVersion === targetVersion) {
    return event;
  }

  if (currentVersion > targetVersion) {
    throw new MigrationError(
      `Cannot migrate event from v${currentVersion} to v${targetVersion}: ` +
        `target version is older than current version`,
      { eventType: event.event_type, currentVersion, targetVersion },
    );
  }

  let migrated = event;

  for (let v = currentVersion + 1; v <= targetVersion; v++) {
    const entry = registry.getSchema(event.event_type as EventType, v);
    if (!entry?.migration) {
      throw new MigrationError(
        `No migration function registered for "${event.event_type}" from v${v - 1} to v${v}. ` +
          `Cannot migrate event from v${currentVersion} to v${targetVersion}.`,
        { eventType: event.event_type, fromVersion: v - 1, toVersion: v },
      );
    }
    migrated = entry.migration(migrated);
  }

  // Ensure final schema_version is set
  return { ...migrated, schema_version: targetVersion };
}

/**
 * Migrate a batch of events to the target version.
 *
 * Events already at the target version are returned unchanged. Events that
 * need migration are transformed in-place (new objects, original untouched).
 *
 * @param registry - The schema registry containing migrations
 * @param events - The events to migrate
 * @param targetVersion - The target schema version
 * @returns Array of migrated events
 * @throws MigrationError if any event cannot be migrated
 */
export function migrateEvents(
  registry: SchemaRegistry,
  events: readonly BaseEvent[],
  targetVersion: number,
): BaseEvent[] {
  return events.map((event) => migrate(registry, event, targetVersion));
}

// ============================================================================
// Default Registry with EventTypes
// ============================================================================

/**
 * Creates a pre-configured SchemaRegistry with all known EventTypes registered.
 *
 * Each event type is registered at the current schema version (CURRENT_SCHEMA_VERSION)
 * with an empty schema. Callers can add versioned schemas and migrations as needed.
 *
 * @returns A SchemaRegistry pre-populated with EventTypes
 */
export function createDefaultSchemaRegistry(): SchemaRegistry {
  const registry = new SchemaRegistry();
  const eventTypes: EventType[] = Object.values(EventTypes) as EventType[];
  for (const eventType of eventTypes) {
    registry.register(eventType, CURRENT_SCHEMA_VERSION, {});
  }
  return registry;
}
