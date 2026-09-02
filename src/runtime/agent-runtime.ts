/**
 * Agent runtime implementation.
 *
 * Core execution loop that processes user input, manages context,
 * invokes models, and executes tools in a continuous cycle.
 */

import { IEventStream } from "../core/event-stream.ts";
import { ISessionManager } from "../core/session-manager.ts";
import { AppendEventInput } from "../types/events.ts";

import {
  ModelManager,
  ModelRequest,
  ModelResponse,
  Message,
  ToolCall,
  StreamDelta,
} from "./model-provider.ts";

import {
  ToolRegistry,
  ToolResult,
} from "./tool-registry.ts";

import { ISelfObservation, ObservationContext } from "./self-observation.ts";

// ============================================================================
// Agent Types
// ============================================================================

/** Agent configuration. */
export interface AgentConfig {
  /** Maximum context messages to keep. */
  max_context_messages?: number;
  /** Default model temperature. */
  temperature?: number;
  /** Maximum tokens for response. */
  max_tokens?: number;
  /** Default tool timeout in ms. */
  tool_timeout_ms?: number;
}

/** Agent loop state. */
export interface AgentState {
  session_id: string;
  context: Message[];
  is_running: boolean;
  last_error?: string;
}

/** Agent loop events. */
export interface AgentEvents {
  onUserInput?: (input: string) => void;
  onModelRequest?: (request: ModelRequest) => void;
  onModelResponse?: (response: ModelResponse) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  onToolResult?: (result: ToolResult) => void;
  onStreamDelta?: (delta: StreamDelta) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Agent Runtime Errors
// ============================================================================

export class AgentError extends Error {
  override readonly cause?: Error;

  constructor(
    message: string,
    cause?: Error,
  ) {
    super(message);
    this.name = "AgentError";
    this.cause = cause;
  }
}

export class AgentNotRunningError extends AgentError {
  constructor() {
    super("Agent is not running");
    this.name = "AgentNotRunningError";
  }
}

// ============================================================================
// Context Manager
// ============================================================================

/**
 * Manages conversation context with accumulation and windowing.
 */
export class ContextManager {
  private messages: Message[] = [];
  private maxMessages: number;

  constructor(maxMessages: number = 100) {
    this.maxMessages = maxMessages;
  }

  /**
   * Add a message to context.
   */
  add(message: Message): void {
    this.messages.push(message);
    this.trim();
  }

  /**
   * Get all messages in context.
   */
  getAll(): Message[] {
    return [...this.messages];
  }

  /**
   * Get message count.
   */
  get length(): number {
    return this.messages.length;
  }

  /**
   * Clear context.
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * Trim context to max messages, preserving system message.
   */
  private trim(): void {
    if (this.messages.length <= this.maxMessages) return;

    // Preserve first system message if present
    const systemMessage = this.messages[0]?.role === "system"
      ? this.messages[0]
      : null;

    if (systemMessage) {
      // Keep system message + most recent messages
      const recent = this.messages.slice(
        -(this.maxMessages - 1),
      );
      this.messages = [systemMessage, ...recent];
    } else {
      // Keep most recent messages
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }
}

// ============================================================================
// Agent Runtime Implementation
// ============================================================================

/**
 * Core agent runtime that orchestrates input processing, model invocation,
 * and tool execution in a continuous loop.
 */
export class AgentRuntime {
  private eventStream: IEventStream;
  private sessionManager: ISessionManager;
  private modelManager: ModelManager;
  private toolRegistry: ToolRegistry;
  private config: AgentConfig;
  private events: AgentEvents;

  private state: AgentState | null = null;
  private contextManager: ContextManager | null = null;
  private selfObservation: ISelfObservation | null = null;

  constructor(
    eventStream: IEventStream,
    sessionManager: ISessionManager,
    modelManager: ModelManager,
    toolRegistry: ToolRegistry,
    config: AgentConfig = {},
    events: AgentEvents = {},
    selfObservation?: ISelfObservation,
  ) {
    this.eventStream = eventStream;
    this.sessionManager = sessionManager;
    this.modelManager = modelManager;
    this.toolRegistry = toolRegistry;
    this.config = config;
    this.events = events;
    this.selfObservation = selfObservation ?? null;
  }

  /**
   * Start a new agent session.
   */
  async start(sessionId?: string): Promise<string> {
    // Create or resume session
    const session = sessionId
      ? this.sessionManager.resumeSession(sessionId)
      : this.sessionManager.createSession();

    this.state = {
      session_id: session.id,
      context: [],
      is_running: true,
    };

    this.contextManager = new ContextManager(
      this.config.max_context_messages,
    );

    return session.id;
  }

  /**
   * Stop the agent session.
   */
  async stop(): Promise<void> {
    if (!this.state) {
      throw new AgentNotRunningError();
    }

    this.sessionManager.completeSession(this.state.session_id);
    this.state.is_running = false;
    this.state = null;
    this.contextManager = null;
  }

  /**
   * Process user input through the agent loop.
   */
  async processInput(input: string): Promise<string> {
    if (!this.state || !this.contextManager) {
      throw new AgentNotRunningError();
    }

    // Emit user input event
    await this.appendEvent("ui.user.input", {
      input,
      timestamp: Date.now(),
    });

    // Add user message to context
    this.contextManager.add({
      role: "user",
      content: input,
    });

    // Run agent loop
    return await this.runLoop();
  }

  /**
   * Process user input with streaming response.
   */
  async *processInputStreaming(
    input: string,
  ): AsyncIterable<string | StreamDelta> {
    if (!this.state || !this.contextManager) {
      throw new AgentNotRunningError();
    }

    // Emit user input event
    await this.appendEvent("ui.user.input", {
      input,
      timestamp: Date.now(),
    });

    // Add user message to context
    this.contextManager.add({
      role: "user",
      content: input,
    });

    // Run agent loop with streaming
    yield* this.runLoopStreaming();
  }

  /**
   * Get current agent state.
   */
  getState(): AgentState | null {
    return this.state ? { ...this.state } : null;
  }

  /**
   * Get current context messages.
   */
  getContext(): Message[] {
    return this.contextManager?.getAll() ?? [];
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Main agent loop.
   */
  private async runLoop(): Promise<string> {
    let iterations = 0;
    const maxIterations = 10; // Safety limit
    let observationContext: ObservationContext | undefined;

    while (iterations < maxIterations) {
      iterations++;

      // Pre-turn observation
      if (this.selfObservation && this.state) {
        observationContext = await this.selfObservation.preTurn(this.state.session_id);
      }

      // Build model request
      const request = this.buildModelRequest();
      this.events.onModelRequest?.(request);

      // Emit model request event
      await this.appendEvent("model.request", {
        messages: request.messages,
        tools: request.tools,
        model: request.model,
      });

      // Invoke model
      const response = await this.modelManager.invoke(request);
      this.events.onModelResponse?.(response);

      // Emit model response event
      await this.appendEvent("model.response", {
        content: response.content,
        tool_calls: response.tool_calls,
        finish_reason: response.finish_reason,
        usage: response.usage,
      });

      // Post-turn observation
      if (this.selfObservation && this.state && observationContext) {
        await this.selfObservation.postTurn(this.state.session_id, observationContext);
      }

      // Add assistant message to context
      if (response.content) {
        this.contextManager!.add({
          role: "assistant",
          content: response.content,
        });
      }

      // Handle tool calls if present
      if (response.tool_calls.length > 0) {
        const toolResults = await this.executeToolCalls(
          response.tool_calls,
        );

        // Add tool results to context
        for (const result of toolResults) {
          this.contextManager!.add({
            role: "tool",
            content: result.success
              ? JSON.stringify(result.result)
              : `Error: ${result.error}`,
            tool_call_id: result.tool_call_id,
          });
        }

        // Continue loop to process tool results
        continue;
      }

      // No tool calls - return final response
      return response.content || "";
    }

    throw new AgentError("Agent loop exceeded maximum iterations");
  }

  /**
   * Agent loop with streaming.
   */
  private async *runLoopStreaming(): AsyncIterable<string | StreamDelta> {
    let iterations = 0;
    const maxIterations = 10;
    let observationContext: ObservationContext | undefined;

    while (iterations < maxIterations) {
      iterations++;

      // Pre-turn observation
      if (this.selfObservation && this.state) {
        observationContext = await this.selfObservation.preTurn(this.state.session_id);
      }

      // Build model request
      const request = this.buildModelRequest();
      request.stream = true;
      this.events.onModelRequest?.(request);

      // Emit model request event
      await this.appendEvent("model.request", {
        messages: request.messages,
        tools: request.tools,
        model: request.model,
        stream: true,
      });

      let fullContent = "";
      const toolCalls: Map<string, ToolCall> = new Map();
      let finishReason: "stop" | "tool_calls" | "length" = "stop";

      // Stream model response
      for await (const delta of this.modelManager.stream(request)) {
        this.events.onStreamDelta?.(delta);

        // Accumulate content
        if (delta.content) {
          fullContent += delta.content;
          yield delta.content;
        }

        // Accumulate tool calls
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.id) {
              const existing = toolCalls.get(tc.id) || {
                id: tc.id,
                name: "",
                arguments: {},
              };
              if (tc.name) existing.name = tc.name;
              if (tc.arguments) {
                existing.arguments = {
                  ...existing.arguments,
                  ...tc.arguments,
                };
              }
              toolCalls.set(tc.id, existing);
            }
          }
        }

        if (delta.finish_reason) {
          finishReason = delta.finish_reason;
        }
      }

      // Emit model response event
      const response: ModelResponse = {
        content: fullContent || null,
        tool_calls: Array.from(toolCalls.values()),
        finish_reason: finishReason,
      };
      this.events.onModelResponse?.(response);

      await this.appendEvent("model.response", {
        content: response.content,
        tool_calls: response.tool_calls,
        finish_reason: response.finish_reason,
      });

      // Post-turn observation
      if (this.selfObservation && this.state && observationContext) {
        await this.selfObservation.postTurn(this.state.session_id, observationContext);
      }

      // Add assistant message to context
      if (fullContent) {
        this.contextManager!.add({
          role: "assistant",
          content: fullContent,
        });
      }

      // Handle tool calls if present
      if (response.tool_calls.length > 0) {
        const toolResults = await this.executeToolCalls(
          response.tool_calls,
        );

        // Add tool results to context
        for (const result of toolResults) {
          this.contextManager!.add({
            role: "tool",
            content: result.success
              ? JSON.stringify(result.result)
              : `Error: ${result.error}`,
            tool_call_id: result.tool_call_id,
          });
        }

        // Continue loop to process tool results
        continue;
      }

      // No tool calls - done
      return;
    }

    throw new AgentError("Agent loop exceeded maximum iterations");
  }

  /**
   * Build model request from current context.
   */
  private buildModelRequest(): ModelRequest {
    const messages = this.contextManager!.getAll();
    const tools = this.toolRegistry.getDefinitions();

    return {
      messages,
      tools: tools.length > 0 ? tools : undefined,
      temperature: this.config.temperature,
      max_tokens: this.config.max_tokens,
    };
  }

  /**
   * Execute tool calls and return results.
   */
  private async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      this.events.onToolCall?.(toolCall);

      // Emit tool execution started event
      await this.appendEvent("tool.execution.started", {
        tool_call_id: toolCall.id,
        tool_name: toolCall.name,
        arguments: toolCall.arguments,
      });

      // Invoke tool
      const result = await this.toolRegistry.invoke(toolCall, {
        session_id: this.state!.session_id,
      });

      this.events.onToolResult?.(result);

      // Emit tool execution completed/failed event
      if (result.success) {
        await this.appendEvent("tool.execution.completed", {
          tool_call_id: toolCall.id,
          tool_name: toolCall.name,
          result: result.result,
          duration_ms: result.duration_ms,
        });
      } else {
        await this.appendEvent("tool.execution.failed", {
          tool_call_id: toolCall.id,
          tool_name: toolCall.name,
          error: result.error,
          duration_ms: result.duration_ms,
        });
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Append event to the event stream.
   */
  private async appendEvent(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const event: AppendEventInput = {
      session_id: this.state!.session_id,
      sequence_number: this.eventStream.getCurrentSequence(this.state!.session_id) + 1,
      event_type: eventType as any,
      payload,
      metadata: {
        source: "agent-runtime",
        timestamp: Date.now(),
      },
    };

    this.eventStream.append(event);
  }
}
