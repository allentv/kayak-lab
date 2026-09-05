/**
 * Tool calling engine.
 *
 * Validates parameters against JSON Schema, invokes tools with timeout support,
 * and formats results with exit_code, stdout, stderr, duration_ms.
 */

import type {
  IToolDefinition,
  ToolHandler,
  ToolHandlerContext,
  ToolResult,
} from "./types.ts";
import { ToolDefinition } from "./tool-definition.ts";

// ============================================================================
// Errors
// ============================================================================

export class ToolCallingError extends Error {
  override readonly cause?: Error;

  constructor(
    message: string,
    public readonly toolName: string,
    cause?: Error,
  ) {
    super(message);
    this.name = "ToolCallingError";
    this.cause = cause;
  }
}

export class ToolInvocationTimeoutError extends ToolCallingError {
  constructor(toolName: string, timeoutMs: number) {
    super(`Tool '${toolName}' timed out after ${timeoutMs}ms`, toolName);
    this.name = "ToolInvocationTimeoutError";
  }
}

// ============================================================================
// Tool Calling Engine Interface
// ============================================================================

/**
 * Interface for the tool calling engine.
 */
export interface IToolCallingEngine {
  /**
   * Validate parameters against a tool definition.
   */
  validate(toolDef: IToolDefinition, params: Record<string, unknown>): void;

  /**
   * Invoke a tool with validated parameters and timeout.
   */
  invoke(
    toolDef: IToolDefinition,
    handler: ToolHandler,
    params: Record<string, unknown>,
    context: Omit<ToolHandlerContext, "timeout_ms">,
    timeoutMs?: number,
  ): Promise<ToolResult>;

  /**
   * Format a successful result.
   */
  formatSuccess(
    toolCallId: string,
    toolName: string,
    output: unknown,
    durationMs: number,
  ): ToolResult;

  /**
   * Format an error result.
   */
  formatError(
    toolCallId: string,
    toolName: string,
    error: Error,
    durationMs: number,
  ): ToolResult;
}

// ============================================================================
// Tool Calling Engine Implementation
// ============================================================================

/**
 * Validates parameters, invokes tools with timeout, and formats results.
 */
export class ToolCallingEngine implements IToolCallingEngine {
  validate(toolDef: IToolDefinition, params: Record<string, unknown>): void {
    const definition = ToolDefinition.create(toolDef);
    definition.validateParameters(params);
  }

  async invoke(
    toolDef: IToolDefinition,
    handler: ToolHandler,
    params: Record<string, unknown>,
    context: Omit<ToolHandlerContext, "timeout_ms">,
    timeoutMs?: number,
  ): Promise<ToolResult> {
    // Validate parameters — catch and return error result
    try {
      this.validate(toolDef, params);
    } catch (error) {
      return this.formatError(
        context.tool_call_id,
        toolDef.name,
        error instanceof Error ? error : new Error(String(error)),
        0,
      );
    }

    const startTime = Date.now();
    const effectiveTimeout = timeoutMs ?? toolDef.timeout_ms;

    try {
      const handlerContext: ToolHandlerContext = {
        ...context,
        timeout_ms: effectiveTimeout,
      };

      const result = effectiveTimeout
        ? await this.invokeWithTimeout(
            () => handler(params, handlerContext),
            effectiveTimeout,
            toolDef.name,
          )
        : await handler(params, handlerContext);

      // If handler returns a ToolResult directly, use it
      if (result && typeof result === "object" && "tool_call_id" in result) {
        return result as ToolResult;
      }

      // Otherwise wrap in a success result
      return this.formatSuccess(
        context.tool_call_id,
        toolDef.name,
        result,
        Date.now() - startTime,
      );
    } catch (error) {
      const durationMs = Date.now() - startTime;
      return this.formatError(
        context.tool_call_id,
        toolDef.name,
        error instanceof Error ? error : new Error(String(error)),
        durationMs,
      );
    }
  }

  formatSuccess(
    toolCallId: string,
    toolName: string,
    output: unknown,
    durationMs: number,
  ): ToolResult {
    return {
      tool_call_id: toolCallId,
      tool_name: toolName,
      exit_code: 0,
      stdout: typeof output === "string" ? output : JSON.stringify(output),
      stderr: "",
      duration_ms: durationMs,
      success: true,
    };
  }

  formatError(
    toolCallId: string,
    toolName: string,
    error: Error,
    durationMs: number,
  ): ToolResult {
    return {
      tool_call_id: toolCallId,
      tool_name: toolName,
      exit_code: 1,
      stdout: "",
      stderr: error.message,
      duration_ms: durationMs,
      success: false,
    };
  }

  private invokeWithTimeout(
    fn: () => Promise<unknown> | unknown,
    timeoutMs: number,
    toolName: string,
  ): Promise<unknown> {
    const { promise, resolve, reject } = Promise.withResolvers<unknown>();
    const timer = setTimeout(() => {
      reject(new ToolInvocationTimeoutError(toolName, timeoutMs));
    }, timeoutMs);

    Promise.resolve()
      .then(() => fn())
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });

    return promise;
  }
}
