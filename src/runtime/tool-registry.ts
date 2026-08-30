/**
 * Tool invocation layer.
 *
 * Abstract interface for tool execution with typed parameters and results.
 * Handles tool registration, invocation, timeouts, and failure handling.
 */

import { ToolCall, ToolDefinition } from "./model-provider.ts";

// ============================================================================
// Tool Types
// ============================================================================

/** Tool execution context. */
export interface ToolContext {
  session_id: string;
  tool_call_id: string;
  timeout_ms?: number;
}

/** Tool execution result. */
export interface ToolResult {
  tool_call_id: string;
  success: boolean;
  result?: unknown;
  error?: string;
  duration_ms: number;
}

/** Tool handler function. */
export type ToolHandler<TParams = unknown, TResult = unknown> = (
  params: TParams,
  context: ToolContext,
) => Promise<TResult> | TResult;

/** Tool registration. */
export interface ToolRegistration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: ToolHandler;
  timeout_ms?: number;
}

// ============================================================================
// Tool Errors
// ============================================================================

export class ToolError extends Error {
  public readonly toolName: string;
  override readonly cause?: Error;

  constructor(
    message: string,
    toolName: string,
    cause?: Error,
  ) {
    super(message);
    this.name = "ToolError";
    this.toolName = toolName;
    this.cause = cause;
  }
}

export class ToolNotFoundError extends ToolError {
  constructor(toolName: string) {
    super(`Tool not found: ${toolName}`, toolName);
    this.name = "ToolNotFoundError";
  }
}

export class ToolTimeoutError extends ToolError {
  constructor(toolName: string, timeoutMs: number) {
    super(`Tool timed out after ${timeoutMs}ms`, toolName);
    this.name = "ToolTimeoutError";
  }
}

// ============================================================================
// Tool Registry Implementation
// ============================================================================

/**
 * Registry for tool handlers with invocation support.
 */
export class ToolRegistry {
  private tools: Map<string, ToolRegistration> = new Map();

  /**
   * Register a tool handler.
   */
  register(registration: ToolRegistration): void {
    this.tools.set(registration.name, registration);
  }

  /**
   * Unregister a tool.
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get tool definition for model invocation.
   */
  getDefinition(name: string): ToolDefinition | undefined {
    const reg = this.tools.get(name);
    if (!reg) return undefined;

    return {
      name: reg.name,
      description: reg.description,
      parameters: reg.parameters,
    };
  }

  /**
   * Get all tool definitions for model invocation.
   */
  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((reg) => ({
      name: reg.name,
      description: reg.description,
      parameters: reg.parameters,
    }));
  }

  /**
   * Check if a tool is registered.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Invoke a tool with timeout handling.
   */
  async invoke(
    toolCall: ToolCall,
    context: Omit<ToolContext, "tool_call_id">,
  ): Promise<ToolResult> {
    const registration = this.tools.get(toolCall.name);
    if (!registration) {
      return {
        tool_call_id: toolCall.id,
        success: false,
        error: `Tool not found: ${toolCall.name}`,
        duration_ms: 0,
      };
    }

    const startTime = Date.now();
    const toolContext: ToolContext = {
      ...context,
      tool_call_id: toolCall.id,
      timeout_ms: registration.timeout_ms,
    };

    try {
      let resultPromise: Promise<unknown>;
      if (registration.timeout_ms) {
        resultPromise = this.invokeWithTimeout(
          registration.handler,
          toolCall.arguments,
          toolContext,
          registration.timeout_ms,
        );
      } else {
        resultPromise = Promise.resolve(
          registration.handler(toolCall.arguments, toolContext),
        );
      }

      const result = await resultPromise;
      const duration_ms = Date.now() - startTime;

      return {
        tool_call_id: toolCall.id,
        success: true,
        result,
        duration_ms,
      };
    } catch (error) {
      const duration_ms = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        tool_call_id: toolCall.id,
        success: false,
        error: errorMessage,
        duration_ms,
      };
    }
  }

  /**
   * Invoke a tool with timeout.
   */
  private invokeWithTimeout(
    handler: ToolHandler,
    params: unknown,
    context: ToolContext,
    timeoutMs: number,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new ToolTimeoutError(context.tool_call_id, timeoutMs));
      }, timeoutMs);

      Promise.resolve()
        .then(() => handler(params, context))
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}
