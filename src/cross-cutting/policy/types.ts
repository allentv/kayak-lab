/**
 * Policy Engine types.
 *
 * Defines the rule, condition, decision, and approval types
 * used by the PolicyEngine to evaluate access decisions.
 */

// ============================================================================
// Policy Effect & Action Types
// ============================================================================

/** The effect of a policy rule. */
export type PolicyEffect = "allow" | "deny";

/** An action string (e.g. "read", "write", "deploy"). */
export type PolicyAction = string;

/** A resource string (e.g. "file:/src/**", "api:/users"). */
export type PolicyResource = string;

// ============================================================================
// Policy Condition
// ============================================================================

/** A condition evaluated against context during policy evaluation. */
export interface PolicyCondition {
  /** The type of condition (for future extensibility). */
  type: string;
  /** Comparison operator. */
  operator: "eq" | "neq" | "contains" | "starts_with" | "in";
  /** The value to compare against. */
  value: unknown;
  /** The context field to evaluate (default: "default"). */
  field?: string;
}

// ============================================================================
// Policy Rule
// ============================================================================

/** A single policy rule defining allow/deny for a resource+action pair. */
export interface PolicyRule {
  /** Unique rule identifier. */
  id: string;
  /** Whether this rule allows or denies. */
  effect: PolicyEffect;
  /** Resource pattern this rule applies to. */
  resource: PolicyResource;
  /** Action this rule applies to. */
  action: PolicyAction;
  /** Optional conditions that must all match for the rule to apply. */
  conditions?: PolicyCondition[];
  /** Human-readable description. */
  description?: string;
  /** Higher priority rules are evaluated first (default: 0). */
  priority?: number;
}

// ============================================================================
// Policy Decision
// ============================================================================

/** The result of evaluating a policy decision. */
export interface PolicyDecision {
  /** Whether the action is allowed. */
  allowed: boolean;
  /** Human-readable reason for the decision. */
  reason: string;
  /** Rules that matched during evaluation. */
  matchedRules: PolicyRule[];
  /** Whether this decision requires human approval before execution. */
  requiresApproval?: boolean;
}

// ============================================================================
// Pending Approval
// ============================================================================

/** A pending approval request for a policy decision. */
export interface PendingApproval {
  /** Unique approval request identifier. */
  id: string;
  /** The resource being requested. */
  resource: string;
  /** The action being requested. */
  action: string;
  /** Who requested the approval. */
  requestedBy: string;
  /** Timestamp when the request was made. */
  requestedAt: number;
  /** Current status of the approval. */
  status: "pending" | "approved" | "denied";
  /** Timestamp when the approval was resolved (if resolved). */
  resolvedAt?: number;
  /** Who resolved the approval (if resolved). */
  resolvedBy?: string;
}

// ============================================================================
// Policy Engine Events
// ============================================================================

/** Callback event map for the PolicyEngine. */
export interface PolicyEngineEvents {
  /** Called when a rule matches during evaluation. */
  onRuleMatched?: (ruleId: string, decision: PolicyDecision) => void;
  /** Called when an approval is requested. */
  onApprovalRequested?: (approval: PendingApproval) => void;
  /** Called when an approval is resolved (approved or denied). */
  onApprovalResolved?: (approval: PendingApproval) => void;
}
