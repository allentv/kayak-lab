/**
 * Message classification and scoring for provenance-aware context management.
 *
 * Classifies messages by role/content heuristics and scores them based on
 * provenance graph outcomes. Extracted from ProvenanceContextManager to
 * make the classification logic independently testable and reviewable.
 */

import { Message } from "../runtime/model-provider.ts";
import {
  ProvenanceGraphData,
  ProvenanceNode,
  ProvenanceNodeType,
} from "../provenance/types.ts";
import {
  MessagePriority,
  OutcomeScore,
} from "./provenance-context-types.ts";

// ============================================================================
// MessageClassifier
// ============================================================================

/**
 * Classifies messages by type and scores them based on provenance outcomes.
 *
 * All methods are pure — no side effects, no I/O. The classifier holds a
 * reference to the provenance graph but does not own it.
 */
export class MessageClassifier {
  private provenanceGraph: ProvenanceGraphData | null = null;

  /** Set the provenance graph for outcome-based scoring. */
  setProvenanceGraph(graph: ProvenanceGraphData): void {
    this.provenanceGraph = graph;
  }

  /** Get the current provenance graph. */
  getProvenanceGraph(): ProvenanceGraphData | null {
    return this.provenanceGraph;
  }

  /**
   * Check if the provenance graph has enough nodes for meaningful scoring.
   * Requires at least 3 nodes to establish causal chains.
   */
  isGraphSufficient(): boolean {
    return this.provenanceGraph !== null && this.provenanceGraph.nodes.length >= 3;
  }

  /**
   * Score a message: base priority + provenance outcome bonus.
   */
  scoreMessage(message: Message): number {
    return this.getBasePriority(message) + this.getOutcomeScore(message);
  }

  // --------------------------------------------------------------------------
  // Base Priority Classification
  // --------------------------------------------------------------------------

  /**
   * Get base priority for a message based on its role and content heuristics.
   */
  getBasePriority(message: Message): number {
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
   * Check if message is a Goal message.
   * Heuristic: user messages starting with goal/task/request prefixes.
   */
  isGoalMessage(message: Message): boolean {
    return message.role === "user" &&
           (message.content.toLowerCase().startsWith("goal:") ||
            message.content.toLowerCase().startsWith("task:") ||
            message.content.toLowerCase().startsWith("request:"));
  }

  /**
   * Check if message is a Commitment message (mutating tool call).
   * Heuristic: tool results with write/edit/create in content.
   */
  isCommitmentMessage(message: Message): boolean {
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
  isVerificationMessage(message: Message): boolean {
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
   * Heuristic: tool results from read-only operations.
   */
  isExplorationMessage(message: Message): boolean {
    if (message.role !== "tool" || !message.tool_call_id) return false;
    const content = message.content.toLowerCase();
    return content.includes("read ") ||
           content.includes("searched ") ||
           content.includes("found ") ||
           content.includes("file content");
  }

  // --------------------------------------------------------------------------
  // Provenance Outcome Scoring
  // --------------------------------------------------------------------------

  /**
   * Get outcome score based on provenance graph links.
   */
  getOutcomeScore(message: Message): number {
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
   * Find provenance node linked to a message.
   * TODO: Implement message-to-node mapping when tool call IDs are available.
   */
  findNodeForMessage(_message: Message): ProvenanceNode | null {
    return null;
  }

  /**
   * Check if node is linked to successful outcomes (exit code 0).
   */
  isSuccessfulOutcome(node: ProvenanceNode): boolean {
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
   * Check if node is linked to failed outcomes (non-zero exit code).
   */
  isFailedOutcome(node: ProvenanceNode): boolean {
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
  isDeadEnd(node: ProvenanceNode): boolean {
    if (!this.provenanceGraph) return false;

    const hasUsefulDescendant = this.hasDescendantOfType(
      node.node_id,
      [ProvenanceNodeType.Commitment, ProvenanceNodeType.Verification],
    );

    return !hasUsefulDescendant;
  }

  // --------------------------------------------------------------------------
  // Graph Traversal Helpers
  // --------------------------------------------------------------------------

  /**
   * Get child nodes from provenance graph edges.
   */
  getChildNodes(nodeId: string): ProvenanceNode[] {
    if (!this.provenanceGraph) return [];

    return this.provenanceGraph.edges
      .filter(e => e.from === nodeId)
      .map(e => this.provenanceGraph!.nodes.find(n => n.node_id === e.to))
      .filter((n): n is ProvenanceNode => n !== undefined);
  }

  /**
   * Check if node has descendants of specified types (BFS).
   */
  hasDescendantOfType(nodeId: string, types: ProvenanceNodeType[]): boolean {
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
}
