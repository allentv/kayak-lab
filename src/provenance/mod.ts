/**
 * Provenance tracking module.
 *
 * Provides a typed, serializable DAG for tracking agent action causality —
 * goals, tool calls, code changes, and verification results.
 */

export {
  ProvenanceNodeType,
  type ProvenanceEdge,
  type ProvenanceGraphData,
  type ProvenanceNode,
  type AnyProvenanceNode,
  type GoalNode,
  type ExplorationNode,
  type CommitmentNode,
  type VerificationNode,
  type PatchProposalNode,
} from "./types.ts";

export { ProvenanceGraph } from "./graph.ts";
export { classifyToolCall, RULES } from "./classifier.ts";
export type { ClassifierRule } from "./classifier.ts";
