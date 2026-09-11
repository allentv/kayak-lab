/**
 * Provenance-aware context management for the kayak-lab agent system.
 *
 * Extends the base ContextManager with provenance-weighted pruning,
 * tool result compression, and hook-driven context assembly. The primary goal
 * is to reduce token usage by 50-80% while preserving critical context.
 */

import { ContextManager } from "../runtime/agent-runtime.ts";
import { Message } from "../runtime/model-provider.ts";
import {
  ProvenanceGraphData,
  ProvenanceNode,
  ProvenanceNodeType,
} from "../provenance/types.ts";
import { MemoryRetrieval } from "./retrieval.ts";
import type { AnyMemory } from "./types.ts";

// ============================================================================
// Types
// ============================================================================

/** Message priority levels for provenance-weighted scoring. */
export enum MessagePriority {
  SYSTEM = 1000,
  GOAL = 900,
  COMMITMENT = 800,
  VERIFICATION = 700,
  EXPLORATION = 500,
  OTHER = 300,
}

/** Outcome scores for provenance links. */
export enum OutcomeScore {
  SUCCESS = 200,
  FAILURE = -100,
  DEAD_END = -200,
  NO_LINK = 0,
}

/** Token budget allocation for context sections. */
export interface TokenBudget {
  /** Fixed allocation for system prompt. */
  system: number;
  /** Percentage of remaining budget for goal context. */
  goalPercent: number;
  /** Percentage of remaining budget for provenance summary. */
  summaryPercent: number;
  /** Percentage of remaining budget for compressed history. */
  historyPercent: number;
  /** Percentage of remaining budget for retrieved memories. */
  memoriesPercent: number;
}

/** Compression result for tool outputs. */
export interface CompressionResult {
  /** Compressed content (referenced lines only). */
  compressed: string;
  /** Reference to full original for audit. */
  fullReference: string;
  /** Original token count. */
  originalTokens: number;
  /** Compressed token count. */
  compressedTokens: number;
}

/** Configuration for ProvenanceContextManager. */
export interface ProvenanceContextConfig {
  /** Maximum number of messages in context. */
  maxMessages?: number;
  /** Maximum tokens for assembled context. */
  maxTokens?: number;
  /** Token threshold for tool result compression. */
  compressionThreshold?: number;
  /** Weight for provenance score in memory ranking (0-1). */
  provenanceWeight?: number;
  /** Token budget allocation. */
  budget?: TokenBudget;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_BUDGET: TokenBudget = {
  system: 0,
  goalPercent: 25,
  summaryPercent: 15,
  historyPercent: 40,
  memoriesPercent: 20,
};

const DEFAULT_CONFIG: ProvenanceContextConfig = {
  maxMessages: 100,
  maxTokens: 8000,
  compressionThreshold: 2000,
  provenanceWeight: 0.3,
  budget: DEFAULT_BUDGET,
};

// ============================================================================
// Helper: Token Estimation
// ============================================================================

/** Estimate token count (simple heuristic: ~4 chars per token). */
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

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

  constructor(config: ProvenanceContextConfig = {}) {
    super(config.maxMessages ?? DEFAULT_CONFIG.maxMessages);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Set the provenance graph for context scoring. */
  setProvenanceGraph(graph: ProvenanceGraphData): void {
    this.provenanceGraph = graph;
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
   * Score a message based on its provenance links and outcomes.
   */
  private scoreMessage(message: Message): number {
    return this.getBasePriority(message) + this.getOutcomeScore(message);
  }

  /**
   * Get base priority for a message based on its role and content.
   */
  private getBasePriority(message: Message): number {
    if (message.role === "system") {
      return MessagePriority.SYSTEM;
    }

    if (this.isGoalMessage(message)) {
      return MessagePriority.GOAL;
    }

    if (this.isCommitmentMessage(message)) {
      return MessagePriority.COMMITMENT;
    }

    if (this.isVerificationMessage(message)) {
      return MessagePriority.VERIFICATION;
    }

    if (this.isExplorationMessage(message)) {
      return MessagePriority.EXPLORATION;
    }

    return MessagePriority.OTHER;
  }

  /**
   * Get outcome score based on provenance links.
   */
  private getOutcomeScore(message: Message): number {
    if (!this.provenanceGraph) {
      return OutcomeScore.NO_LINK;
    }

    const node = this.findNodeForMessage(message);
    if (!node) {
      return OutcomeScore.NO_LINK;
    }

    if (this.isSuccessfulOutcome(node)) {
      return OutcomeScore.SUCCESS;
    }

    if (this.isFailedOutcome(node)) {
      return OutcomeScore.FAILURE;
    }

    if (this.isDeadEnd(node)) {
      return OutcomeScore.DEAD_END;
    }

    return OutcomeScore.NO_LINK;
  }

  /**
   * Check if provenance graph is sufficient for scoring.
   */
  private isGraphSufficient(): boolean {
    return this.provenanceGraph !== null && this.provenanceGraph.nodes.length >= 3;
  }

  /**
   * Override add to use provenance-weighted pruning when graph is available.
   */
  override add(message: Message): void {
    super.add(message);

    // If provenance graph is available and sufficient, use provenance scoring
    if (this.isGraphSufficient()) {
      const messages = this.getAll();
      const scored = messages.map(msg => ({
        message: msg,
        score: this.scoreMessage(msg),
      }));

      scored.sort((a, b) => b.score - a.score);

      const maxMessages = this.config.maxMessages ?? DEFAULT_CONFIG.maxMessages!;
      const kept = scored.slice(0, maxMessages);
      kept.sort((a, b) => a.score - b.score);

      // Replace messages
      this.clear();
      for (const item of kept) {
        super.add(item.message);
      }
    }
  }

  /**
   * Check if message is a Goal message.
   */
  private isGoalMessage(message: Message): boolean {
    return message.role === "user" &&
           (message.content.toLowerCase().startsWith("goal:") ||
            message.content.toLowerCase().startsWith("task:") ||
            message.content.toLowerCase().startsWith("request:"));
  }

  /**
   * Check if message is a Commitment message (mutating tool call).
   * Heuristic: tool results with write/edit/create in content or known mutating tools.
   */
  private isCommitmentMessage(message: Message): boolean {
    if (message.role !== "tool" || !message.tool_call_id) return false;
    const content = message.content.toLowerCase();
    return content.includes("wrote") ||
           content.includes("created") ||
           content.includes("modified") ||
           content.includes("deleted") ||
           content.includes("applied");
  }

  /**
   * Check if message is a Verification message.
   * Heuristic: tool results with exit code, test output, or verification keywords.
   */
  private isVerificationMessage(message: Message): boolean {
    if (message.role !== "tool" || !message.tool_call_id) return false;
    const content = message.content.toLowerCase();
    return content.includes("exit code") ||
           content.includes("passed") ||
           content.includes("failed") ||
           content.includes("error:") ||
           content.includes("test result");
  }

  /**
   * Check if message is an Exploration message (read-only).
   * Heuristic: tool results that are read-only operations.
   */
  private isExplorationMessage(message: Message): boolean {
    if (message.role !== "tool" || !message.tool_call_id) return false;
    const content = message.content.toLowerCase();
    return content.includes("read ") ||
           content.includes("searched ") ||
           content.includes("found ") ||
           content.includes("file content");
  }

  /**
   * Find provenance node linked to a message.
   */
  private findNodeForMessage(_message: Message): ProvenanceNode | null {
    // TODO: Implement message-to-node mapping when tool call IDs are available
    return null;
  }

  /**
   * Check if node is linked to successful outcomes.
   */
  private isSuccessfulOutcome(node: ProvenanceNode): boolean {
    if (!this.provenanceGraph) return false;

    const children = this.getChildNodes(node.node_id);
    for (const child of children) {
      if (child.node_type === ProvenanceNodeType.Verification) {
        const exitCode = child.metadata.exit_code;
        if (exitCode === 0) return true;
      }
    }

    return false;
  }

  /**
   * Check if node is linked to failed outcomes.
   */
  private isFailedOutcome(node: ProvenanceNode): boolean {
    if (!this.provenanceGraph) return false;

    const children = this.getChildNodes(node.node_id);
    for (const child of children) {
      if (child.node_type === ProvenanceNodeType.Verification) {
        const exitCode = child.metadata.exit_code;
        if (exitCode !== 0) return true;
      }
    }

    return false;
  }

  /**
   * Check if node is a dead end (no subsequent commitments/verifications).
   */
  private isDeadEnd(node: ProvenanceNode): boolean {
    if (!this.provenanceGraph) return false;

    const hasUsefulDescendant = this.hasDescendantOfType(
      node.node_id,
      [ProvenanceNodeType.Commitment, ProvenanceNodeType.Verification]
    );

    return !hasUsefulDescendant;
  }

  /**
   * Get child nodes from provenance graph edges.
   */
  private getChildNodes(nodeId: string): ProvenanceNode[] {
    if (!this.provenanceGraph) return [];

    return this.provenanceGraph.edges
      .filter(e => e.from === nodeId)
      .map(e => this.provenanceGraph!.nodes.find(n => n.node_id === e.to))
      .filter((n): n is ProvenanceNode => n !== undefined);
  }

  /**
   * Check if node has descendants of specified types.
   */
  private hasDescendantOfType(nodeId: string, types: ProvenanceNodeType[]): boolean {
    if (!this.provenanceGraph) return false;

    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = this.provenanceGraph.nodes.find(n => n.node_id === current);
      if (node && types.includes(node.node_type)) {
        return true;
      }

      const children = this.provenanceGraph.edges
        .filter(e => e.from === current)
        .map(e => e.to);
      queue.push(...children);
    }

    return false;
  }

  /**
   * Compress tool result based on provenance references.
   */
  compressToolResult(
    result: string,
    toolCallId: string,
    eventId: string,
  ): CompressionResult {
    const originalTokens = estimateTokens(result);

    // Check if compression is needed
    if (originalTokens <= (this.config.compressionThreshold ?? DEFAULT_CONFIG.compressionThreshold!)) {
      return {
        compressed: result,
        fullReference: eventId,
        originalTokens,
        compressedTokens: originalTokens,
      };
    }

    // Get referenced lines from provenance
    const referencedLines = this.getReferencedLines(toolCallId);
    if (referencedLines.length === 0) {
      return {
        compressed: result,
        fullReference: eventId,
        originalTokens,
        compressedTokens: originalTokens,
      };
    }

    // Compress to referenced content
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

    // Find Commitment nodes that reference this tool call
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

    // 4. Retrieved memories (if memory retrieval is configured)
    // Note: memories are retrieved synchronously here since assembleContext is sync
    // The hook handler calls this and manages async retrieval separately

    // 5. Current input
    assembled.push(currentInput);

    // Enforce token budget
    return this.enforceBudget(assembled, budget, _maxTokens);
  }

  /**
   * Calculate token budget allocation.
   */
  private calculateBudget(_maxTokens: number): TokenBudget {
    const config = this.config.budget ?? DEFAULT_BUDGET;
    return {
      system: config.system,
      goalPercent: config.goalPercent,
      summaryPercent: config.summaryPercent,
      historyPercent: config.historyPercent,
      memoriesPercent: config.memoriesPercent,
    };
  }

  /**
   * Compress previous turns to summary.
   */
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

  /**
   * Retrieve memories with provenance-aware scoring.
   */
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

  /**
   * Enforce token budget on assembled context.
   * Uses budget percentages to allocate space across sections.
   */
  private enforceBudget(
    messages: Message[],
    budget: TokenBudget,
    maxTokens: number,
  ): Message[] {
    // Calculate tokens for each section
    const systemMessages = messages.filter(m => m.role === "system");
    const otherMessages = messages.filter(m => m.role !== "system");

    const systemTokens = systemMessages.reduce(
      (sum, m) => sum + estimateTokens(m.content), 0,
    );

    // Remaining budget after system messages
    const remainingBudget = maxTokens - systemTokens;
    if (remainingBudget <= 0) {
      return systemMessages;
    }

    // Calculate per-section budgets using percentages
    const goalBudget = Math.floor(remainingBudget * (budget.goalPercent / 100));
    const summaryBudget = Math.floor(remainingBudget * (budget.summaryPercent / 100));

    // Classify messages into sections
    const result: Message[] = [...systemMessages];
    let currentTokens = systemTokens;

    // First pass: add goal messages (high priority)
    for (const msg of otherMessages) {
      if (msg.role === "user" && this.isGoalMessage(msg)) {
        const msgTokens = estimateTokens(msg.content);
        if (currentTokens + msgTokens <= systemTokens + goalBudget) {
          result.push(msg);
          currentTokens += msgTokens;
        }
      }
    }

    // Second pass: add summary messages (assistant summaries)
    for (const msg of otherMessages) {
      if (msg.role === "assistant" && !result.includes(msg)) {
        const msgTokens = estimateTokens(msg.content);
        if (currentTokens + msgTokens <= systemTokens + goalBudget + summaryBudget) {
          result.push(msg);
          currentTokens += msgTokens;
        }
      }
    }

    // Third pass: add history messages (remaining within budget)
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

  /**
   * Create a before_model_call hook handler for context assembly.
   * This hook queries the provenance graph, retrieves relevant memories,
   * and assembles context sections before each model call.
   */
  createBeforeModelCallHook(): (context: { sessionId: string; messages: Message[] }) => Promise<void> {
    return async (context: { sessionId: string; messages: Message[] }) => {
      if (!this.provenanceGraph) return;

      // Find current Goal message
      const goalMessage = context.messages.find(m =>
        m.role === "user" && this.isGoalMessage(m),
      );

      // Compress previous turns
      const previousTurns = context.messages.slice(0, -1);

      // Assemble context with provenance awareness
      const assembled = this.assembleContext(
        context.messages[0]?.content ?? "",
        goalMessage ?? null,
        previousTurns,
        context.messages[context.messages.length - 1]!,
        this.config.maxTokens ?? DEFAULT_CONFIG.maxTokens!,
      );

      // Retrieve and insert memories asynchronously if retrieval is configured
      if (this.memoryRetrieval && goalMessage) {
        const memories = await this.retrieveProvenanceScoredMemories(goalMessage.content);
        if (memories.length > 0) {
          const memoryContent = memories
            .map(m => `[${m.memory.type}] ${m.memory.content}`)
            .join("\n");
          // Insert memories after goal context but before current input
          const insertIndex = assembled.findIndex(m => m === context.messages[context.messages.length - 1]);
          assembled.splice(insertIndex, 0, {
            role: "system",
            content: `Relevant memories:\n${memoryContent}`,
          });
        }
      }

      // Replace context messages with assembled context
      context.messages.length = 0;
      context.messages.push(...assembled);
    };
  }
}