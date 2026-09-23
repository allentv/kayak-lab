/**
 * Runtime module exports.
 *
 * Agent runtime with model abstraction and tool invocation.
 */

// Model abstraction
export {
  ModelManager,
  ModelError,
  ProviderNotFoundError,
  ModelTimeoutError,
} from "./model-provider.ts";

export type {
  Message,
  MessageRole,
  ToolDefinition,
  ModelRequest,
  ModelResponse,
  ToolCall,
  StreamDelta,
  ModelProviderConfig,
  IModelProvider,
} from "./model-provider.ts";

// Tool registry
export {
  ToolRegistry,
  ToolError,
  ToolNotFoundError,
  ToolTimeoutError,
} from "./tool-registry.ts";

export type {
  ToolContext,
  ToolResult,
  ToolHandler,
  ToolRegistration,
} from "./tool-registry.ts";

// Agent runtime
export {
  AgentRuntime,
  AgentError,
  AgentNotRunningError,
  ContextManager,
} from "./agent-runtime.ts";

export type {
  AgentConfig,
  AgentState,
  AgentEvents,
} from "./agent-runtime.ts";

// Agent profiles
export {
  ProfileRegistry,
  ProfileError,
  ProfileNotFoundError,
  ProfileCycleError,
} from "./profile-registry.ts";

export type { AgentProfile, SpawnConfig } from "./types.ts";

// Spawn configuration builder
export { SpawnConfigBuilder, createSpawnConfig } from "./spawn-config.ts";

// Spawn function
export { spawn } from "./spawn.ts";
export type { SpawnDependencies } from "./spawn.ts";

// Built-in profiles
export {
  builtinProfiles,
  reviewerProfile,
  scoutProfile,
  coderProfile,
  quickProfile,
} from "./profiles.ts";

// Memory integration (re-export from memory module)
export type {
  AnyMemory,
  CreateMemoryInput,
  UpdateMemoryInput,
  RetrievalOptions,
  SnapshotOptions,
  MemorySnapshot,
} from "../memory/mod.ts";
