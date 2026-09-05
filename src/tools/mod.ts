/**
 * Tool calling module.
 *
 * Structured tool calling protocol following OpenAI's function calling pattern,
 * with JSON Schema validation, enable/disable lifecycle, capability discovery,
 * interactive authoring, and self-improvement.
 */

// Types
export type {
  IToolDefinition,
  ParameterSchema,
  ParameterProperty,
  ToolCapability,
  ToolCategory,
  ToolResult,
  ToolHandler,
  ToolHandlerContext,
  ToolRegistration,
} from "./types.ts";

// Tool definition
export {
  ToolDefinition,
  ToolDefinitionError,
  ParameterValidationError,
} from "./tool-definition.ts";

// Tool calling engine
export {
  ToolCallingEngine,
  ToolCallingError,
  ToolInvocationTimeoutError,
} from "./calling-engine.ts";

export type { IToolCallingEngine } from "./calling-engine.ts";

// Tool registry
export {
  ToolRegistry,
  ToolRegistryError,
  ToolNotRegisteredError,
} from "./registry.ts";

export type { IToolRegistry, ToolRegistryEvents } from "./registry.ts";

// Tool authoring
export { ToolAuthoring } from "./authoring.ts";

export type {
  IToolAuthoring,
  ToolAuthoringEvents,
  ToolProposal,
  ProposalContext,
  AuthoringDecision,
} from "./authoring.ts";

// Self-improvement
export { ToolSelfImprovement } from "./self-improvement.ts";

export type {
  IToolSelfImprovement,
  SelfImprovementConfig,
  SelfImprovementEvents,
  ToolSuggestion,
  ToolUsageRecord,
} from "./self-improvement.ts";
