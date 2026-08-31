/**
 * Fixture loader for test data.
 *
 * Manages loading and saving JSON fixture files.
 */

import { existsSync } from "node:fs";
import * as path from "node:path";
import type { BaseEvent } from "../../types/events.ts";

const FIXTURES_DIR = path.join(Deno.cwd(), "fixtures");

/**
 * Loads a JSON fixture file.
 *
 * @param name - Fixture name (e.g., "sessions/basic")
 * @returns Parsed fixture data
 *
 * @example
 * ```ts
 * const session = await loadFixture("sessions/basic");
 * ```
 */
export async function loadFixture<T = unknown>(name: string): Promise<T> {
  const filePath = path.join(FIXTURES_DIR, `${name}.json`);
  const content = await Deno.readTextFile(filePath);
  return JSON.parse(content) as T;
}

/**
 * Saves data to a JSON fixture file.
 *
 * @param name - Fixture name (e.g., "sessions/basic")
 * @param data - Data to save
 */
export async function saveFixture<T>(
  name: string,
  data: T,
): Promise<void> {
  const filePath = path.join(FIXTURES_DIR, `${name}.json`);
  const dir = path.dirname(filePath);

  // Ensure directory exists
  if (!existsSync(dir)) {
    await Deno.mkdir(dir, { recursive: true });
  }

  await Deno.writeTextFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Checks if a fixture exists.
 */
export function fixtureExists(name: string): boolean {
  const filePath = path.join(FIXTURES_DIR, `${name}.json`);
  return existsSync(filePath);
}

// ============================================================================
// Typed fixture interfaces
// ============================================================================

export interface SessionFixture {
  id: string;
  description?: string;
  events: BaseEvent[];
}

export interface MultiSessionFixture {
  sessions: SessionFixture[];
}
