/**
 * Provenance-aware context management for the kayak-lab agent system.
 *
 * Extends the base ContextManager with provenance-weighted pruning,
 * tool result compression, and hook-driven context assembly. The primary goal
 * is to reduce token usage by 50-80% while preserving critical context.
 *
 * Classification and scoring logic lives in MessageClassifier.
 * Types and defaults live in provenance-context-types.ts.
 */

import { ContextManager } from "../runtime/agent-runtime.ts";
import { Message } from "../runtime/model-provider.ts";
import {
  ProvenanceGraphData,
  ProvenanceNodeType,
} from "../provenance/types.ts";
import { MemoryRetrieval } from "./retrieval.ts";
import type { AnyMemory } from "./types.ts";
import {
  CompressionResult,
  DEFAULT_CONFIG,
  ProvenanceContextConfig,
  TokenBudget,
  estimateTokens,
} from "./provenance-context-types.ts";
import { MessageClassifier } from "./message-classifier.ts";

// Re-export types for backward compatibility
export {
  DEFAULT_BUDGET,
  DEFAULT_CONFIG,
  MessagePriority,
  OutcomeScore,
  estimateTokens,
} from "./provenance-context-types.ts";
export type {
  CompressionResult,
  ProvenanceContextConfig,
  TokenBudget,
} from "./provenance-context-types.ts";

// ============================================================================
// Provenance Context Manager
// ============================================================================

/**
 * Provenance-aware context manager that extends the base ContextManager with
 * intelligent pruning based on provenance graph data.
 *
 * When provenance graph is available, messages are scored and pruned based on
 * their provenance links and outcomes. When unavailable or insufficient, falls
 * back to positional pruning (identical to base class).
 */
export class ProvenanceContextManager extends ContextManager {
  private provenanceGraph: ProvenanceGraphData | null = null;
  private config: ProvenanceContextConfig;
  private memoryRetrieval: MemoryRetrieval | null = null;
  private classifier = new MessageClassifier();

  constructor(config: ProvenanceContextConfig = {}) {
    super(config.maxMessages ?? DEFAULT_CONFIG.maxMessages);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Set the provenance graph for context scoring. */
  setProvenanceGraph(graph: ProvenanceGraphData): void {
    this.provenanceGraph = graph;
    this.classifier.setProvenanceGraph(graph);
  }

  /** Get the current provenance graph. */
  getProvenanceGraph(): ProvenanceGraphData | null {
    return this.provenanceGraph;
  }

  /** Set the memory retrieval module for provenance-aware scoring. */
  setMemoryRetrieval(retrieval: MemoryRetrieval): void {
    this.memoryRetrieval = retrieval;
  }

  /**
   * Override add to use provenance-weighted pruning when graph is available.
   */
  override add(message: Message): void {
    super.add(message);

    if (this.classifier.isGraphSufficient()) {
      const messages = this.getAll();
      const scored = messages.map(msg => ({
        message: msg,
        score: this.classifier.scoreMessage(msg),
      }));

      scored.sort((a, b) => b.score - a.score);

      const maxMessages = this.config.maxMessages ?? DEFAULT_CONFIG.maxMessages!;
      const kept = scored.slice(0, maxMessages);
      kept.sort((a, b) => a.score - b.score);

      this.clear();
      for (const item of kept) {
        super.add(item.message);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Tool Result Compression
  // --------------------------------------------------------------------------

  /**
   * Compress tool result based on provenance references.
   */
  compressToolResult(
    result: string,
    toolCallId: string,
    eventId: string,
  ): CompressionResult {
    const originalTokens = estimateTokens(result);

    if (originalTokens <= (this.config.compressionThreshold ?? DEFAULT_CONFIG.compressionThreshold!)) {
      return {
        compressed: result,
        fullReference: eventId,
        originalTokens,
        compressedTokens: originalTokens,
      };
    }

    const referencedLines = this.getReferencedLines(toolCallId);
    if (referencedLines.length === 0) {
      return {
        compressed: result,
        fullReference: eventId,
        originalTokens,
        compressedTokens: originalTokens,
      };
    }

    const lines = result.split("\n");
    const compressed = referencedLines
      .filter(line => line > 0 && line <= lines.length)
      .map(line => lines[line - 1])
      .join("\n");

    const compressedTokens = estimateTokens(compressed);

    return {
      compressed,
      fullReference: eventId,
      originalTokens,
      compressedTokens,
    };
  }

  /**
   * Get referenced lines from provenance for a tool call.
   */
  private getReferencedLines(toolCallId: string): number[] {
    if (!this.provenanceGraph) return [];

    const commitments = this.provenanceGraph.nodes.filter(
      n => n.node_type === ProvenanceNodeType.Commitment &&
           "tool_call_id" in n && n.tool_call_id === toolCallId,
    );

    const lines = new Set<number>();
    for (const commitment of commitments) {
      const referenced = commitment.metadata.referenced_lines as number[] | undefined;
      if (referenced) {
        referenced.forEach(l => lines.add(l));
      }
    }

    return Array.from(lines).sort((a, b) => a - b);
  }

  // --------------------------------------------------------------------------
  // Context Assembly
  // --------------------------------------------------------------------------

  /**
   * Assemble context with provenance-aware memory retrieval.
   */
  assembleContext(
    systemPrompt: string,
    goalMessage: Message | null,
    previousTurns: Message[],
    currentInput: Message,
    _maxTokens: number,
  ): Message[] {
    const budget = this.calculateBudget(_maxTokens);

    const assembled: Message[] = [];

    // 1. System prompt (fixed)
    assembled.push({
      role: "system",
      content: systemPrompt,
    });

    // 2. Goal context (if available)
    if (goalMessage) {
      assembled.push(goalMessage);
    }

    // 3. Provenance summary (compressed previous turns)
    if (previousTurns.length > 0) {
      const summary = this.compressTurnsToSummary(previousTurns);
      assembled.push({
        role: "assistant",
        content: summary,
      });
    }

    // 4. Current input
    assembled.push(currentInput);

    return this.enforceBudget(assembled, budget, _maxTokens);
  }

  private calculateBudget(_maxTokens: number): TokenBudget {
    const config = this.config.budget ?? DEFAULT_CONFIG.budget!;
    return {
      system: config.system,
      goalPercent: config.goalPercent,
      summaryPercent: config.summaryPercent,
      historyPercent: config.historyPercent,
      memoriesPercent: config.memoriesPercent,
    };
  }

  private compressTurnsToSummary(turns: Message[]): string {
    const keyPoints: string[] = [];

    for (const turn of turns) {
      if (turn.role === "assistant") {
        const firstSentence = turn.content.split("\n")[0];
        if (firstSentence && firstSentence.length > 0) {
          keyPoints.push(firstSentence);
        }
      }
    }

    return keyPoints.length > 0
      ? `Previous context summary:\n${keyPoints.join("\n")}`
      : "";
  }

  private async retrieveProvenanceScoredMemories(query: string): Promise<Array<{
    memory: AnyMemory;
    score: number;
  }>> {
    if (!this.memoryRetrieval) return [];

    const baseResults = await this.memoryRetrieval.retrieve({ query, max_results: 10 });

    return baseResults.map(result => ({
      memory: result.memory,
      score: result.final_score,
    })).sort((a, b) => b.score - a.score).slice(0, 5);
  }

  private enforceBudget(
    messages: Message[],
    budget: TokenBudget,
    maxTokens: number,
  ): Message[] {
    const systemMessages = messages.filter(m => m.role === "system");
    const otherMessages = messages.filter(m => m.role !== "system");

    const systemTokens = systemMessages.reduce(
      (sum, m) => sum + estimateTokens(m.content), 0,
    );

    const remainingBudget = maxTokens - systemTokens;
    if (remainingBudget <= 0) {
      return systemMessages;
    }

    const goalBudget = Math.floor(remainingBudget * (budget.goalPercent / 100));
    const summaryBudget = Math.floor(remainingBudget * (budget.summaryPercent / 100));

    const result: Message[] = [...systemMessages];
    let currentTokens = systemTokens;

    // First pass: goal messages (high priority)
    for (const msg of otherMessages) {
      if (msg.role === "user" && this.classifier.isGoalMessage(msg)) {
        const msgTokens = estimateTokens(msg.content);
        if (currentTokens + msgTokens <= systemTokens + goalBudget) {
          result.push(msg);
          currentTokens += msgTokens;
        }
      }
    }

    // Second pass: summary messages (assistant summaries)
    for (const msg of otherMessages) {
      if (msg.role === "assistant" && !result.includes(msg)) {
        const msgTokens = estimateTokens(msg.content);
        if (currentTokens + msgTokens <= systemTokens + goalBudget + summaryBudget) {
          result.push(msg);
          currentTokens += msgTokens;
        }
      }
    }

    // Third pass: history messages (remaining within budget)
    for (const msg of otherMessages) {
      if (!result.includes(msg)) {
        const msgTokens = estimateTokens(msg.content);
        if (currentTokens + msgTokens <= maxTokens) {
          result.push(msg);
          currentTokens += msgTokens;
        }
      }
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // Hook Creation
  // --------------------------------------------------------------------------

  /**
   * Create a before_model_call hook handler for context assembly.
   */
  createBeforeModelCallHook(): (context: { sessionId: string; messages: Message[] }) => Promise<void> {
    return async (context: { sessionId: string; messages: Message[] }) => {
      if (!this.provenanceGraph) return;

      const goalMessage = context.messages.find(m =>
        m.role === "user" && this.classifier.isGoalMessage(m),
      );

      const previousTurns = context.messages.slice(0, -1);

      const assembled = this.assembleContext(
        context.messages[0]?.content ?? "",
        goalMessage ?? null,
        previousTurns,
        context.messages[context.messages.length - 1]!,
        this.config.maxTokens ?? DEFAULT_CONFIG.maxTokens!,
      );

      if (this.memoryRetrieval && goalMessage) {
        const memories = await this.retrieveProvenanceScoredMemories(goalMessage.content);
        if (memories.length > 0) {
          const memoryContent = memories
            .map(m => `[${m.memory.type}] ${m.memory.content}`)
            .join("\n");
          const insertIndex = assembled.findIndex(m => m === context.messages[context.messages.length - 1]);
          assembled.splice(insertIndex, 0, {
            role: "system",
            content: `Relevant memories:\n${memoryContent}`,
          });
        }
      }

      context.messages.length = 0;
      context.messages.push(...assembled);
    };
  }
}
