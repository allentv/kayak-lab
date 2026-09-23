/**
 * Registry for managing agent profiles with inheritance resolution.
 *
 * Follows the same patterns as ToolRegistry and MCPRegistry.
 */

import type { AgentProfile } from "./types.ts";

// ============================================================================
// Profile Registry Errors
// ============================================================================

export class ProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileError";
  }
}

export class ProfileNotFoundError extends ProfileError {
  constructor(name: string) {
    super(`Profile not found: ${name}`);
    this.name = "ProfileNotFoundError";
  }
}

export class ProfileCycleError extends ProfileError {
  constructor(chain: string[]) {
    super(`Circular profile inheritance detected: ${chain.join(" → ")}`);
    this.name = "ProfileCycleError";
  }
}

// ============================================================================
// Profile Registry Implementation
// ============================================================================

/**
 * Runtime registry for agent profiles with inheritance support.
 *
 * Profiles can extend other profiles via the `extends` field.
 * Resolution follows: session defaults → profile defaults → spawn overrides.
 */
export class ProfileRegistry {
  private profiles: Map<string, AgentProfile> = new Map();

  /**
   * Register a profile. Overwrites any existing profile with the same name.
   */
  register(profile: AgentProfile): void {
    this.profiles.set(profile.name, profile);
  }

  /**
   * Unregister a profile by name.
   * @returns true if the profile was removed, false if not found.
   */
  unregister(name: string): boolean {
    return this.profiles.delete(name);
  }

  /**
   * Get a profile by name (raw, without inheritance resolution).
   */
  get(name: string): AgentProfile | undefined {
    return this.profiles.get(name);
  }

  /**
   * List all registered profiles.
   */
  list(): AgentProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Resolve a profile with full inheritance chain.
   *
   * Merges parent fields into child, with child fields taking precedence.
   * Throws on circular `extends` references.
   *
   * @param name - Profile name to resolve
   * @returns Resolved profile with all inherited fields merged
   * @throws ProfileNotFoundError if profile doesn't exist
   * @throws ProfileCycleError if circular inheritance detected
   */
  resolve(name: string): AgentProfile {
    return this.resolveInternal(name, []);
  }

  private resolveInternal(name: string, chain: string[]): AgentProfile {
    const profile = this.profiles.get(name);
    if (!profile) {
      throw new ProfileNotFoundError(name);
    }

    // Check for cycles
    if (chain.includes(name)) {
      throw new ProfileCycleError([...chain, name]);
    }

    // No parent — return as-is
    if (!profile.extends) {
      return { ...profile };
    }

    // Resolve parent first
    const parent = this.resolveInternal(profile.extends, [...chain, name]);

    // Merge: child fields override parent fields
    return {
      ...parent,
      ...profile,
      // Preserve child's name and extends (for debugging)
      name: profile.name,
      extends: profile.extends,
    };
  }
}
