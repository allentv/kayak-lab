/**
 * Spawn a sub-agent with profile-based configuration.
 *
 * Creates an AgentRuntime with resolved profile config, injects context,
 * and processes the task. Returns the sub-agent's response.
 */

import type { IEventStream } from "../core/event-stream.ts";
import type { ISessionManager } from "../core/session-manager.ts";

import { AgentRuntime } from "./agent-runtime.ts";
import type { AgentConfig } from "./agent-runtime.ts";
import { ModelManager } from "./model-provider.ts";
import { ToolRegistry } from "./tool-registry.ts";
import { HookPoint, type BeforeModelCallContext } from "./hooks.ts";
import type { SpawnConfig } from "./types.ts";

// ============================================================================
// Spawn Configuration
// ============================================================================

/** Dependencies required to spawn a sub-agent. */
export interface SpawnDependencies {
  eventStream: IEventStream;
  sessionManager: ISessionManager;
  modelManager: ModelManager;
  toolRegistry: ToolRegistry;
}

// ============================================================================
// Spawn Function
// ============================================================================

/**
 * Spawn a sub-agent with the given configuration and process a task.
 *
 * @param deps - Runtime infrastructure dependencies
 * @param config - Resolved spawn configuration (from SpawnConfigBuilder)
 * @param task - The task/prompt to process
 * @returns The sub-agent's response text
 */
export async function spawn(
  deps: SpawnDependencies,
  config: SpawnConfig,
  task: string,
): Promise<string> {
  // Build AgentConfig from SpawnConfig
  const agentConfig: AgentConfig = {
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    max_context_messages: config.maxContextMessages,
    maxIterations: config.maxIterations,
    toolTimeoutMs: config.toolTimeoutMs,
    streaming: config.streaming,
    agentId: config.profile,
  };

  // Create runtime
  const runtime = new AgentRuntime(
    deps.eventStream,
    deps.sessionManager,
    deps.modelManager,
    deps.toolRegistry,
    agentConfig,
  );

  // Register before_model_call hook to propagate model from config
  if (config.model) {
    runtime.getHookRegistry().register(
      HookPoint.BeforeModelCall,
      (ctx) => {
        const hookCtx = ctx as BeforeModelCallContext;
        hookCtx.model = config.model;
      },
    );
  }

  // Inject profile context into system prompt
  if (config.context || config.systemPrompt) {
    const contextParts: string[] = [];
    if (config.systemPrompt) contextParts.push(config.systemPrompt);
    if (config.context) contextParts.push(config.context);

    const contextText = contextParts.join("\n\n");

    // Register session_start hook to inject context
    runtime.getHookRegistry().register(
      HookPoint.SessionStart,
      () => {
        // Context will be injected via the hook system
        // For now, we rely on the AgentRuntime's core memory injection
      },
    );

    // Prepend context to the task as a system-level instruction
    // This ensures the sub-agent receives the context
    const contextTask = config.systemPrompt
      ? `[System]\n${contextText}\n\n[Task]\n${task}`
      : `[Context]\n${contextText}\n\n[Task]\n${task}`;

    await runtime.start();

    if (config.streaming) {
      const chunks: string[] = [];
      for await (const chunk of runtime.processInputStreaming(contextTask)) {
        if (typeof chunk === "string") chunks.push(chunk);
      }
      await runtime.stop();
      return chunks.join("");
    } else {
      const result = await runtime.processInput(contextTask);
      await runtime.stop();
      return result;
    }
  }

  // No context to inject — process task directly
  await runtime.start();

  if (config.streaming) {
    const chunks: string[] = [];
    for await (const chunk of runtime.processInputStreaming(task)) {
      if (typeof chunk === "string") chunks.push(chunk);
    }
    await runtime.stop();
    return chunks.join("");
  } else {
    const result = await runtime.processInput(task);
    await runtime.stop();
    return result;
  }
}
