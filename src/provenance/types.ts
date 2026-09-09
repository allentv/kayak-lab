/**
 * Provenance tracking types for the kayak-lab agent system.
 *
 * Models the causal graph of agent actions — goals, tool calls,
 * code changes, and verification results — as a typed, serializable DAG.
 */

// ============================================================================
// Node Type Enum
// ============================================================================

/** Categories of nodes in the provenance graph. */
export enum ProvenanceNodeType {
  Goal = "goal",
  Exploration = "exploration",
  Commitment = "commitment",
  Verification = "verification",
  PatchProposal = "patch_proposal",
}

// ============================================================================
// Base Node
// ============================================================================

/**
 * Base interface shared by all provenance graph nodes.
 */
export interface ProvenanceNode {
  /** Unique identifier for this node. */
  node_id: string;
  /** Discriminator for the node variant. */
  node_type: ProvenanceNodeType;
  /** Session this node belongs to. */
  session_id: string;
  /** ISO-8601 timestamp of when the node was created. */
  timestamp: string;
  /** node_ids of nodes that causally precede this one. */
  causal_parents: string[];
  /** Arbitrary key-value metadata. */
  metadata: Record<string, unknown>;
}

// ============================================================================
// Type-Specific Nodes
// ============================================================================

/** A user goal or request that initiates work. */
export interface GoalNode extends ProvenanceNode {
  node_type: ProvenanceNodeType.Goal;
  /** The raw user request text. */
  request_text: string;
}

/** A read-only exploration (tool call that did not modify state). */
export interface ExplorationNode extends ProvenanceNode {
  node_type: ProvenanceNodeType.Exploration;
  /** Name of the tool that was invoked. */
  tool_name: string;
  /** Parameters passed to the tool. */
  tool_parameters: Record<string, unknown>;
  /** Identifier for the tool call invocation. */
  tool_call_id: string;
}

/** A mutating action (tool call that modified files or state). */
export interface CommitmentNode extends ProvenanceNode {
  node_type: ProvenanceNodeType.Commitment;
  /** Name of the tool that was invoked. */
  tool_name: string;
  /** Paths of files modified by this action. */
  files_modified: string[];
  /** Identifier for the tool call invocation. */
  tool_call_id: string;
}

/** A verification step (command execution with exit code). */
export interface VerificationNode extends ProvenanceNode {
  node_type: ProvenanceNodeType.Verification;
  /** Command that was executed. */
  command: string;
  /** Exit code of the command (0 = success). */
  exit_code: number;
  /** Identifier for the tool call invocation. */
  tool_call_id: string;
}

/** A summary of work completed in a single patch/turn. */
export interface PatchProposalNode extends ProvenanceNode {
  node_type: ProvenanceNodeType.PatchProposal;
  /** Total number of files changed. */
  files_changed: number;
  /** Total number of tool calls made. */
  tool_calls_made: number;
  /** The turn number within the session. */
  turn_number: number;
  /** Human-readable summary of the patch. */
  summary: string;
}

// ============================================================================
// Union
// ============================================================================

/** Any provenance graph node. */
export type AnyProvenanceNode =
  | GoalNode
  | ExplorationNode
  | CommitmentNode
  | VerificationNode
  | PatchProposalNode;

// ============================================================================
// Edge
// ============================================================================

/** An edge in the provenance graph connecting two nodes. */
export interface ProvenanceEdge {
  /** node_id of the source node. */
  from: string;
  /** node_id of the target node. */
  to: string;
  /** Relationship type between the two nodes. */
  type: "causal" | "temporal";
}

// ============================================================================
// Graph Serialization
// ============================================================================

/** Serializable representation of an entire provenance graph. */
export interface ProvenanceGraphData {
  /** All nodes in the graph. */
  nodes: ProvenanceNode[];
  /** All edges in the graph. */
  edges: ProvenanceEdge[];
  /** The session this graph belongs to. */
  session_id: string;
}
