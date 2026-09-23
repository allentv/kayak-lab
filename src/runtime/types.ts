/**
 * Agent profile types for configurable sub-agent spawning.
 *
 * Profiles bundle configuration defaults (model, thinking level, tools, context)
 * that can be resolved at runtime via ProfileRegistry and applied via SpawnConfigBuilder.
 */

// ============================================================================
// Agent Profile
// ============================================================================

/** Named agent profile with configurable defaults. */
export interface AgentProfile {
  /** Unique profile name. */
  name: string;
  /** Human-readable description. */
  description?: string;

  // Model configuration
  /** Model identifier (e.g. "anthropic/claude-sonnet"). */
  model?: string;
  /** Thinking/reasoning level. */
  thinkingLevel?: "off" | "low" | "medium" | "high";

  // Tool configuration
  /** Tool names available to this profile. Undefined = session defaults. */
  tools?: string[];

  // Context configuration
  /** Context injected into the sub-agent's system prompt. */
  context?: string;
  /** Full system prompt override. */
  systemPrompt?: string;
  /** Max messages in context window. */
  maxContextMessages?: number;

  // Generation parameters
  /** Max tokens for response. */
  maxTokens?: number;
  /** Sampling temperature. */
  temperature?: number;
  /** Use streaming response. */
  streaming?: boolean;

  // Loop control
  /** Max tool-call iterations (default: 10). */
  maxIterations?: number;
  /** Per-tool timeout in ms. */
  toolTimeoutMs?: number;

  // Inheritance
  /** Name of parent profile to extend. */
  extends?: string;
}

// ============================================================================
// Spawn Configuration
// ============================================================================

/** Resolved spawn configuration for a sub-agent. */
export interface SpawnConfig {
  /** Profile name used for defaults. */
  profile?: string;

  // Model configuration
  model?: string;
  thinkingLevel?: string;

  // Tool configuration
  tools?: string[];

  // Context configuration
  context?: string;
  systemPrompt?: string;
  maxContextMessages?: number;

  // Generation parameters
  maxTokens?: number;
  temperature?: number;
  streaming?: boolean;

  // Loop control
  maxIterations?: number;
  toolTimeoutMs?: number;

  /** Raw overrides merged on top of profile/session defaults. */
  overrides: Partial<AgentProfile>;
}
