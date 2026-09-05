/**
 * Tool calling types.
 *
 * Structured tool definitions following OpenAI's function calling pattern,
 * with JSON Schema parameter validation and capability/category metadata.
 */

// ============================================================================
// Tool Definition
// ============================================================================

/** JSON Schema for tool parameters. */
export interface ParameterSchema {
  /** JSON Schema type (object, array, string, number, boolean, null). */
  type: string;
  /** Property definitions for object type. */
  properties?: Record<string, ParameterProperty>;
  /** Required parameter names. */
  required?: string[];
  /** Additional JSON Schema fields. */
  [key: string]: unknown;
}

/** A single parameter property in the schema. */
export interface ParameterProperty {
  type: string;
  description?: string;
  enum?: unknown[];
  default?: unknown;
  items?: ParameterProperty;
  properties?: Record<string, ParameterProperty>;
  required?: string[];
  [key: string]: unknown;
}

/** Capability a tool provides (e.g., "file-read", "shell-exec"). */
export interface ToolCapability {
  /** Unique capability identifier. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Capability description. */
  description: string;
}

/** Category grouping for tool discovery. */
export interface ToolCategory {
  /** Unique category identifier. */
  id: string;
  /** Human-readable name. */
  name: string;
}

/**
 * Structured tool definition interface.
 * Follows OpenAI's function calling pattern with added metadata.
 */
export interface IToolDefinition {
  /** Unique tool name. */
  name: string;
  /** Human-readable description of what the tool does. */
  description: string;
  /** JSON Schema for tool parameters. */
  parameters: ParameterSchema;
  /** Capabilities this tool provides. */
  capabilities?: ToolCapability[];
  /** Category this tool belongs to. */
  category?: ToolCategory;
  /** Default timeout in milliseconds. */
  timeout_ms?: number;
  /** Whether this tool can be exposed via MCP. */
  exposable?: boolean;
}

// ============================================================================
// Tool Result
// ============================================================================

/** Structured tool execution result. */
export interface ToolResult {
  /** Unique identifier for this tool call. */
  tool_call_id: string;
  /** Tool name. */
  tool_name: string;
  /** Exit code (0 = success). */
  exit_code: number;
  /** Standard output content. */
  stdout: string;
  /** Standard error content. */
  stderr: string;
  /** Duration in milliseconds. */
  duration_ms: number;
  /** Whether the tool call succeeded. */
  success: boolean;
}

// ============================================================================
// Tool Handler
// ============================================================================

/** Tool execution context passed to handlers. */
export interface ToolHandlerContext {
  /** Current session ID. */
  session_id: string;
  /** Unique tool call ID. */
  tool_call_id: string;
  /** Configured timeout in milliseconds. */
  timeout_ms?: number;
}

/** Tool handler function signature. */
export type ToolHandler<TParams = Record<string, unknown>> = (
  params: TParams,
  context: ToolHandlerContext,
) => Promise<ToolResult> | ToolResult;

// ============================================================================
// Tool Registration
// ============================================================================

/** Complete tool registration with handler and metadata. */
export interface ToolRegistration extends IToolDefinition {
  /** Tool handler function. */
  handler: ToolHandler;
  /** Whether the tool is currently enabled. */
  enabled: boolean;
  /** Timestamp when the tool was registered. */
  registered_at: number;
}
