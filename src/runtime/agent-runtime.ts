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

import type { IToolRegistry as INewToolRegistry } from "../tools/registry.ts";
import type { ToolResult as NewToolResult } from "../tools/types.ts";
import type { IMemoryProvider, IMemoryRetrieval, IMemoryUpdate, ISharedMemory } from "../memory/mod.ts";
import type { AnyMemory, CreateMemoryInput, UpdateMemoryInput } from "../memory/mod.ts";
import type { RetrievalOptions } from "../memory/mod.ts";
import type { SnapshotOptions, MemorySnapshot } from "../memory/mod.ts";

import { ProvenanceGraph } from "../provenance/graph.ts";
import { classifyToolCall } from "../provenance/classifier.ts";
import { ProvenanceNodeType } from "../provenance/types.ts";

import {
  HookRegistry,
  HookPoint,
  BeforeModelCallContext,
  AfterToolExecutionContext,
  TurnEndContext,
  SessionStartContext,
  SessionEndContext,
} from "./hooks.ts";

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
  private newToolRegistry: INewToolRegistry | null;
  private config: AgentConfig;
  private events: AgentEvents;

  private state: AgentState | null = null;
  private contextManager: ContextManager | null = null;
  private selfObservation: ISelfObservation | null = null;

  // Memory subsystem (optional)
  private memoryProvider: IMemoryProvider | null = null;
  private memoryRetrieval: IMemoryRetrieval | null = null;
  private memoryUpdate: IMemoryUpdate | null = null;
  private sharedMemory: ISharedMemory | null = null;

  // Provenance tracking (optional)
  private provenanceGraph: ProvenanceGraph | null = null;
  private dataDir: string | null = null;
  private turnNumber = 0;

  // Hook system
  private hookRegistry: HookRegistry;
  private sessionStartTime: number = 0;

  constructor(
    eventStream: IEventStream,
    sessionManager: ISessionManager,
    modelManager: ModelManager,
    toolRegistry: ToolRegistry,
    config: AgentConfig = {},
    events: AgentEvents = {},
    selfObservation?: ISelfObservation,
    newToolRegistry?: INewToolRegistry,
    memoryComponents?: {
      provider?: IMemoryProvider;
      retrieval?: IMemoryRetrieval;
      update?: IMemoryUpdate;
      shared?: ISharedMemory;
    },
    provenanceOptions?: {
      dataDir?: string;
    },
    hookRegistry?: HookRegistry,
  ) {
    this.eventStream = eventStream;
    this.sessionManager = sessionManager;
    this.modelManager = modelManager;
    this.toolRegistry = toolRegistry;
    this.newToolRegistry = newToolRegistry ?? null;
    this.config = config;
    this.events = events;
    this.selfObservation = selfObservation ?? null;
    this.hookRegistry = hookRegistry ?? new HookRegistry();
    if (memoryComponents) {
      this.memoryProvider = memoryComponents.provider ?? null;
      this.memoryRetrieval = memoryComponents.retrieval ?? null;
      this.memoryUpdate = memoryComponents.update ?? null;
      this.sharedMemory = memoryComponents.shared ?? null;
    }
    if (provenanceOptions?.dataDir) {
      this.dataDir = provenanceOptions.dataDir;
    }
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

    // Initialize provenance graph
    this.provenanceGraph = new ProvenanceGraph(session.id);
    this.turnNumber = 0;
    this.sessionStartTime = Date.now();

    // Try to load existing provenance graph from disk
    if (this.dataDir) {
      const loaded = await ProvenanceGraph.loadFromDisk(this.dataDir, session.id);
      if (loaded) {
        this.provenanceGraph = loaded;
      }
    }

    // Dispatch session_start hooks
    const startContext: SessionStartContext = {
      sessionId: session.id,
      config: this.config as Record<string, unknown>,
    };
    await this.hookRegistry.dispatch(HookPoint.SessionStart, startContext, session.id);

    return session.id;
  }

  /**
   * Stop the agent session.
   */
  async stop(): Promise<void> {
    if (!this.state) {
      throw new AgentNotRunningError();
    }

    // Dispatch session_end hooks
    const durationMs = Date.now() - this.sessionStartTime;
    const endContext: SessionEndContext = {
      sessionId: this.state.session_id,
      state: "completed",
      durationMs,
    };
    await this.hookRegistry.dispatch(HookPoint.SessionEnd, endContext, this.state.session_id);

    // Persist provenance graph before stopping
    if (this.provenanceGraph && this.dataDir) {
      await this.provenanceGraph.writeToDisk(this.dataDir);
    }

    this.sessionManager.completeSession(this.state.session_id);
    this.state.is_running = false;
    this.state = null;
    this.contextManager = null;
    this.provenanceGraph = null;
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

    // Create Goal node in provenance graph
    let goalNodeId: string | undefined;
    if (this.provenanceGraph) {
      this.turnNumber++;
      const goalNode = this.provenanceGraph.addNode({
        node_type: ProvenanceNodeType.Goal,
        session_id: this.state.session_id,
        causal_parents: [],
        metadata: { request_text: input },
      });
      goalNodeId = goalNode.node_id;
    }

    // Add user message to context
    this.contextManager.add({
      role: "user",
      content: input,
    });

    // Run agent loop
    return await this.runLoop(goalNodeId);
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

    // Create Goal node in provenance graph
    let goalNodeId: string | undefined;
    if (this.provenanceGraph) {
      this.turnNumber++;
      const goalNode = this.provenanceGraph.addNode({
        node_type: ProvenanceNodeType.Goal,
        session_id: this.state.session_id,
        causal_parents: [],
        metadata: { request_text: input },
      });
      goalNodeId = goalNode.node_id;
    }

    // Add user message to context
    this.contextManager.add({
      role: "user",
      content: input,
    });

    // Run agent loop with streaming
    yield* this.runLoopStreaming(goalNodeId);
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

  /**
   * Get the hook registry for registering lifecycle hooks.
   */
  getHookRegistry(): HookRegistry {
    return this.hookRegistry;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Main agent loop.
   */
  private async runLoop(goalNodeId?: string): Promise<string> {
    let iterations = 0;
    const maxIterations = 10; // Safety limit
    let observationContext: ObservationContext | undefined;
    let lastGoalOrCommitmentId = goalNodeId;

    while (iterations < maxIterations) {
      iterations++;

      // Pre-turn observation
      if (this.selfObservation && this.state) {
        observationContext = await this.selfObservation.preTurn(this.state.session_id);
      }

      // Build model request
      const request = this.buildModelRequest();
      this.events.onModelRequest?.(request);

      // Dispatch before_model_call hooks with mutable context
      const beforeModelContext: BeforeModelCallContext = {
        sessionId: this.state!.session_id,
        messages: [...request.messages],
        model: request.model,
        tools: request.tools,
      };
      await this.hookRegistry.dispatch(HookPoint.BeforeModelCall, beforeModelContext, this.state!.session_id);

      // Use potentially modified context from hooks
      request.messages = beforeModelContext.messages as Message[];

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

        // Create provenance nodes for each tool call
        const turnCommitmentIds: string[] = [];
        if (this.provenanceGraph) {
          for (let i = 0; i < response.tool_calls.length; i++) {
            const toolCall = response.tool_calls[i];
            const classification = classifyToolCall(toolCall.name, toolCall.arguments);

            const parentId = lastGoalOrCommitmentId ?? goalNodeId;
            const node = this.provenanceGraph.addNode({
              node_type: classification,
              session_id: this.state!.session_id,
              causal_parents: parentId ? [parentId] : [],
              metadata: {
                tool_name: toolCall.name,
                tool_parameters: toolCall.arguments,
                tool_call_id: toolCall.id,
              },
            });

            if (parentId) {
              this.provenanceGraph.addEdge(parentId, node.node_id);
            }

            if (classification === ProvenanceNodeType.Commitment || classification === ProvenanceNodeType.Verification) {
              turnCommitmentIds.push(node.node_id);
              lastGoalOrCommitmentId = node.node_id;
            }
          }

          // Create PatchProposal at turn end (when we have commitments/verifications)
          if (turnCommitmentIds.length > 0) {
            const patchNode = this.provenanceGraph.addNode({
              node_type: ProvenanceNodeType.PatchProposal,
              session_id: this.state!.session_id,
              causal_parents: turnCommitmentIds,
              metadata: {
                files_changed: turnCommitmentIds.length,
                tool_calls_made: response.tool_calls.length,
                turn_number: this.turnNumber,
              },
            });

            for (const commitId of turnCommitmentIds) {
              this.provenanceGraph.addEdge(commitId, patchNode.node_id);
            }

            lastGoalOrCommitmentId = patchNode.node_id;
          }
        }

        // Add tool results to context and dispatch after_tool_execution hooks
        for (let i = 0; i < toolResults.length; i++) {
          const result = toolResults[i];
          this.contextManager!.add({
            role: "tool",
            content: result.success
              ? JSON.stringify(result.result)
              : `Error: ${result.error}`,
            tool_call_id: result.tool_call_id,
          });

          // Dispatch after_tool_execution hook
          const toolCall = response.tool_calls[i];
          const afterToolContext: AfterToolExecutionContext = {
            sessionId: this.state!.session_id,
            toolName: toolCall.name,
            toolParams: toolCall.arguments,
            result: result.result,
            success: result.success,
            error: result.error,
          };
          await this.hookRegistry.dispatch(HookPoint.AfterToolExecution, afterToolContext, this.state!.session_id);
        }

        // Dispatch turn_end hook
        const turnEndContext: TurnEndContext = {
          sessionId: this.state!.session_id,
          turnNumber: this.turnNumber,
          response: response.content || "",
          provenanceNodes: turnCommitmentIds,
        };
        await this.hookRegistry.dispatch(HookPoint.TurnEnd, turnEndContext, this.state!.session_id);

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
  private async *runLoopStreaming(goalNodeId?: string): AsyncIterable<string | StreamDelta> {
    let iterations = 0;
    const maxIterations = 10;
    let observationContext: ObservationContext | undefined;
    let lastGoalOrCommitmentId = goalNodeId;

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

      // Dispatch before_model_call hooks with mutable context
      const beforeModelContext: BeforeModelCallContext = {
        sessionId: this.state!.session_id,
        messages: [...request.messages],
        model: request.model,
        tools: request.tools,
      };
      await this.hookRegistry.dispatch(HookPoint.BeforeModelCall, beforeModelContext, this.state!.session_id);

      // Use potentially modified context from hooks
      request.messages = beforeModelContext.messages as Message[];

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

        // Create provenance nodes for each tool call
        const turnCommitmentIds: string[] = [];
        if (this.provenanceGraph) {
          for (let i = 0; i < response.tool_calls.length; i++) {
            const toolCall = response.tool_calls[i];
            const classification = classifyToolCall(toolCall.name, toolCall.arguments);

            const parentId = lastGoalOrCommitmentId ?? goalNodeId;
            const node = this.provenanceGraph.addNode({
              node_type: classification,
              session_id: this.state!.session_id,
              causal_parents: parentId ? [parentId] : [],
              metadata: {
                tool_name: toolCall.name,
                tool_parameters: toolCall.arguments,
                tool_call_id: toolCall.id,
              },
            });

            if (parentId) {
              this.provenanceGraph.addEdge(parentId, node.node_id);
            }

            if (classification === ProvenanceNodeType.Commitment || classification === ProvenanceNodeType.Verification) {
              turnCommitmentIds.push(node.node_id);
              lastGoalOrCommitmentId = node.node_id;
            }
          }

          // Create PatchProposal at turn end (when we have commitments/verifications)
          if (turnCommitmentIds.length > 0) {
            const patchNode = this.provenanceGraph.addNode({
              node_type: ProvenanceNodeType.PatchProposal,
              session_id: this.state!.session_id,
              causal_parents: turnCommitmentIds,
              metadata: {
                files_changed: turnCommitmentIds.length,
                tool_calls_made: response.tool_calls.length,
                turn_number: this.turnNumber,
              },
            });

            for (const commitId of turnCommitmentIds) {
              this.provenanceGraph.addEdge(commitId, patchNode.node_id);
            }

            lastGoalOrCommitmentId = patchNode.node_id;
          }
        }

        // Add tool results to context and dispatch after_tool_execution hooks
        for (let i = 0; i < toolResults.length; i++) {
          const result = toolResults[i];
          this.contextManager!.add({
            role: "tool",
            content: result.success
              ? JSON.stringify(result.result)
              : `Error: ${result.error}`,
            tool_call_id: result.tool_call_id,
          });

          // Dispatch after_tool_execution hook
          const toolCall = response.tool_calls[i];
          const afterToolContext: AfterToolExecutionContext = {
            sessionId: this.state!.session_id,
            toolName: toolCall.name,
            toolParams: toolCall.arguments,
            result: result.result,
            success: result.success,
            error: result.error,
          };
          await this.hookRegistry.dispatch(HookPoint.AfterToolExecution, afterToolContext, this.state!.session_id);
        }

        // Dispatch turn_end hook
        const turnEndContext: TurnEndContext = {
          sessionId: this.state!.session_id,
          turnNumber: this.turnNumber,
          response: response.content || "",
          provenanceNodes: turnCommitmentIds,
        };
        await this.hookRegistry.dispatch(HookPoint.TurnEnd, turnEndContext, this.state!.session_id);

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
   * Uses the new tool calling protocol if a new registry is available,
   * otherwise falls back to the legacy tool registry.
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

      let result: ToolResult;

      if (this.newToolRegistry && this.newToolRegistry.has(toolCall.name)) {
        // New protocol path
        await this.appendEvent("tool.call.invocation", {
          tool_call_id: toolCall.id,
          tool_name: toolCall.name,
          parameters: toolCall.arguments,
        });

        const newResult: NewToolResult = await this.newToolRegistry.invoke(
          toolCall.id,
          toolCall.name,
          toolCall.arguments,
          { session_id: this.state!.session_id },
        );

        await this.appendEvent("tool.call.result", {
          tool_call_id: newResult.tool_call_id,
          tool_name: newResult.tool_name,
          exit_code: newResult.exit_code,
          stdout: newResult.stdout,
          stderr: newResult.stderr,
          duration_ms: newResult.duration_ms,
          success: newResult.success,
        });

        // Adapt new result to legacy format
        result = {
          tool_call_id: newResult.tool_call_id,
          success: newResult.success,
          result: newResult.stdout,
          error: newResult.stderr || undefined,
          duration_ms: newResult.duration_ms,
        };
      } else {
        // Legacy protocol path
        result = await this.toolRegistry.invoke(toolCall, {
          session_id: this.state!.session_id,
        });
      }

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

  // ==========================================================================
  // Memory Methods
  // ==========================================================================

  /**
   * Retrieve memories on-demand (not automatic context injection).
   * Agents explicitly request memories, preserving context window space.
   */
  async retrieveMemory(options?: RetrievalOptions): Promise<AnyMemory[]> {
    if (!this.memoryRetrieval) {
      return [];
    }
    return await this.memoryRetrieval.retrieve(options);
  }

  /**
   * Store a memory (manual, user-initiated).
   */
  async storeMemory(input: CreateMemoryInput): Promise<AnyMemory | null> {
    if (!this.memoryUpdate) {
      return null;
    }
    return await this.memoryUpdate.manualStore(input);
  }

  /**
   * Automatically store a memory from agent interaction context.
   */
  async autoStoreMemory(input: CreateMemoryInput): Promise<AnyMemory | null> {
    if (!this.memoryUpdate) {
      return null;
    }
    return await this.memoryUpdate.autoStore(input);
  }

  /**
   * Update an existing memory.
   */
  async updateMemory(id: string, input: UpdateMemoryInput): Promise<AnyMemory | null> {
    if (!this.memoryUpdate) {
      return null;
    }
    return await this.memoryUpdate.update(id, input);
  }

  /**
   * Get a snapshot of shared memory for the current session.
   */
  async getMemorySnapshot(options?: SnapshotOptions): Promise<MemorySnapshot | null> {
    if (!this.sharedMemory || !this.state) {
      return null;
    }
    return await this.sharedMemory.getSnapshot(this.state.session_id, options);
  }

  /**
   * Reference a specific memory by ID from shared memory.
   */
  async referenceMemory(memoryId: string): Promise<AnyMemory | null> {
    if (!this.sharedMemory || !this.state) {
      return null;
    }
    return await this.sharedMemory.reference(this.state.session_id, memoryId);
  }

  /**
   * Check if any memory component is available.
   */
  hasMemory(): boolean {
    return this.memoryProvider !== null ||
      this.memoryRetrieval !== null ||
      this.memoryUpdate !== null ||
      this.sharedMemory !== null;
  }

  /**
   * Attach memory components after construction.
   */
  setMemoryComponents(components: {
    provider?: IMemoryProvider;
    retrieval?: IMemoryRetrieval;
    update?: IMemoryUpdate;
    shared?: ISharedMemory;
  }): void {
    if (components.provider) this.memoryProvider = components.provider;
    if (components.retrieval) this.memoryRetrieval = components.retrieval;
    if (components.update) this.memoryUpdate = components.update;
    if (components.shared) this.sharedMemory = components.shared;
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
