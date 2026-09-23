/**
 * Progressive builder pattern for sub-agent spawn configuration.
 *
 * Starts with profile defaults, then applies explicit overrides.
 * Precedence: override > profile > session default.
 */

import type { AgentProfile, SpawnConfig } from "./types.ts";
import type { ProfileRegistry } from "./profile-registry.ts";

// ============================================================================
// Spawn Config Builder
// ============================================================================

/**
 * Fluent builder for SpawnConfig.
 *
 * Usage:
 * ```ts
 * const config = createSpawnConfig(registry)
 *   .fromProfile("reviewer")
 *   .withModel("gpt-4")
 *   .withContext("Focus on auth module")
 *   .build();
 * ```
 */
export class SpawnConfigBuilder {
  private registry: ProfileRegistry;
  private profileName?: string;
  private profile?: AgentProfile;
  private overrides: Partial<AgentProfile> = {};

  constructor(registry: ProfileRegistry) {
    this.registry = registry;
  }

  /** Load defaults from a named profile. */
  fromProfile(name: string): this {
    this.profileName = name;
    this.profile = this.registry.resolve(name);
    return this;
  }

  /** Override model. */
  withModel(model: string): this {
    this.overrides.model = model;
    return this;
  }

  /** Override thinking level. */
  withThinking(level: "off" | "low" | "medium" | "high"): this {
    this.overrides.thinkingLevel = level;
    return this;
  }

  /** Override tool set. */
  withTools(tools: string[]): this {
    this.overrides.tools = tools;
    return this;
  }

  /** Override context. */
  withContext(context: string): this {
    this.overrides.context = context;
    return this;
  }

  /** Override system prompt. */
  withSystemPrompt(prompt: string): this {
    this.overrides.systemPrompt = prompt;
    return this;
  }

  /** Override max context messages. */
  withMaxContextMessages(n: number): this {
    this.overrides.maxContextMessages = n;
    return this;
  }

  /** Override max tokens. */
  withMaxTokens(max: number): this {
    this.overrides.maxTokens = max;
    return this;
  }

  /** Override temperature. */
  withTemperature(temp: number): this {
    this.overrides.temperature = temp;
    return this;
  }

  /** Override streaming. */
  withStreaming(streaming: boolean): this {
    this.overrides.streaming = streaming;
    return this;
  }

  /** Override max iterations. */
  withMaxIterations(n: number): this {
    this.overrides.maxIterations = n;
    return this;
  }

  /** Override tool timeout. */
  withToolTimeout(ms: number): this {
    this.overrides.toolTimeoutMs = ms;
    return this;
  }

  /** Build the final SpawnConfig. */
  build(): SpawnConfig {
    // Merge: profile defaults → overrides
    const base: Partial<AgentProfile> = this.profile ?? {};
    return {
      profile: this.profileName,
      model: this.overrides.model ?? base.model,
      thinkingLevel: this.overrides.thinkingLevel ?? base.thinkingLevel,
      tools: this.overrides.tools ?? base.tools,
      context: this.overrides.context ?? base.context,
      systemPrompt: this.overrides.systemPrompt ?? base.systemPrompt,
      maxContextMessages: this.overrides.maxContextMessages ?? base.maxContextMessages,
      maxTokens: this.overrides.maxTokens ?? base.maxTokens,
      temperature: this.overrides.temperature ?? base.temperature,
      streaming: this.overrides.streaming ?? base.streaming,
      maxIterations: this.overrides.maxIterations ?? base.maxIterations,
      toolTimeoutMs: this.overrides.toolTimeoutMs ?? base.toolTimeoutMs,
      overrides: { ...this.overrides },
    };
  }
}

/**
 * Create a new SpawnConfigBuilder.
 */
export function createSpawnConfig(registry: ProfileRegistry): SpawnConfigBuilder {
  return new SpawnConfigBuilder(registry);
}
