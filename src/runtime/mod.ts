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

// Memory integration (re-export from memory module)
export type {
  AnyMemory,
  CreateMemoryInput,
  UpdateMemoryInput,
  RetrievalOptions,
  SnapshotOptions,
  MemorySnapshot,
} from "../memory/mod.ts";
