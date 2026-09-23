/**
 * Built-in agent profiles for common use cases.
 *
 * These profiles are registered at startup and available for
 * orchestrator-driven profile selection.
 */

import type { AgentProfile } from "./types.ts";

// ============================================================================
// Built-in Profiles
// ============================================================================

/** Code review profile — structured output, read-only tools. */
export const reviewerProfile: AgentProfile = {
  name: "reviewer",
  description: "Code review with structured output and read-only tools",
  tools: ["read", "grep", "glob", "find"],
  context: "You are a code reviewer. Analyze code for quality, security, and correctness. Provide structured feedback.",
  maxIterations: 5,
  temperature: 0.3,
};

/** Scout profile — fast read-only exploration. */
export const scoutProfile: AgentProfile = {
  name: "scout",
  description: "Fast read-only exploration and research",
  tools: ["read", "grep", "glob", "find"],
  context: "You are a research scout. Explore the codebase quickly and return concise findings.",
  maxIterations: 3,
  temperature: 0.2,
  streaming: true,
};

/** Coder profile — full tool access for implementation. */
export const coderProfile: AgentProfile = {
  name: "coder",
  description: "Full tool access for implementation tasks",
  tools: ["read", "grep", "glob", "find", "edit", "write", "bash"],
  context: "You are a software engineer. Implement features, fix bugs, and write clean code.",
  maxIterations: 15,
  temperature: 0.4,
};

/** Quick profile — fast model, minimal context for simple tasks. */
export const quickProfile: AgentProfile = {
  name: "quick",
  description: "Fast model, minimal context for simple tasks",
  extends: "reviewer",
  maxIterations: 3,
  streaming: true,
  temperature: 0.5,
};

/** All built-in profiles. */
export const builtinProfiles: AgentProfile[] = [
  reviewerProfile,
  scoutProfile,
  coderProfile,
  quickProfile,
];
