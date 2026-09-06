/**
 * Policy Engine implementation.
 *
 * Evaluates resource+action pairs against a set of rules using
 * deny-overrides-allow semantics with implicit deny.
 */

import type {
  PendingApproval,
  PolicyCondition,
  PolicyDecision,
  PolicyEngineEvents,
  PolicyRule,
} from "./types.ts";

// ============================================================================
// Policy Engine
// ============================================================================

/**
 * A rule-based policy engine that evaluates access decisions.
 *
 * - Deny-overrides-allow: any matching deny rule → denied.
 * - Only allow rules match → allowed.
 * - No rules match → denied (implicit deny).
 *
 * Rules are sorted by priority (highest first) for deterministic matching.
 */
export class PolicyEngine {
  private rules: Map<string, PolicyRule> = new Map();
  private pendingApprovals: Map<string, PendingApproval> = new Map();
  private events: PolicyEngineEvents;

  constructor(events?: PolicyEngineEvents) {
    this.events = events ?? {};
  }

  // -------------------------------------------------------------------------
  // Rule management
  // -------------------------------------------------------------------------

  /** Add or replace a rule. */
  addRule(rule: PolicyRule): void {
    this.rules.set(rule.id, rule);
  }

  /** Remove a rule by id. */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /** Return all rules sorted by priority (highest first). */
  getRules(): PolicyRule[] {
    return [...this.rules.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
  }

  // -------------------------------------------------------------------------
  // Evaluation
  // -------------------------------------------------------------------------

  /**
   * Evaluate a resource+action pair against the current rule set.
   *
   * @param resource - The resource being accessed.
   * @param action - The action being performed.
   * @param context - Optional context for condition evaluation.
   * @returns A PolicyDecision describing the outcome.
   */
  evaluate(
    resource: string,
    action: string,
    context?: Record<string, unknown>,
  ): PolicyDecision {
    const sortedRules = this.getRules();
    const matchedRules: PolicyRule[] = [];
    let denyMatched = false;

    for (const rule of sortedRules) {
      if (this.matchesRule(rule, resource, action, context)) {
        matchedRules.push(rule);
        if (rule.effect === "deny") {
          denyMatched = true;
        }

        if (this.events.onRuleMatched) {
          const provisionalDecision: PolicyDecision = {
            allowed: false,
            reason: "",
            matchedRules: [...matchedRules],
          };
          this.events.onRuleMatched(rule.id, provisionalDecision);
        }
      }
    }

    if (denyMatched) {
      return {
        allowed: false,
        reason: `Denied by rule(s): ${matchedRules.filter((r) => r.effect === "deny").map((r) => r.id).join(", ")}`,
        matchedRules,
      };
    }

    if (matchedRules.length > 0) {
      return {
        allowed: true,
        reason: `Allowed by rule(s): ${matchedRules.map((r) => r.id).join(", ")}`,
        matchedRules,
      };
    }

    return {
      allowed: false,
      reason: "No matching rules (implicit deny)",
      matchedRules: [],
    };
  }

  // -------------------------------------------------------------------------
  // Approval workflow
  // -------------------------------------------------------------------------

  /**
   * Request approval for a resource+action pair.
   *
   * @returns The created PendingApproval in "pending" status.
   */
  requestApproval(
    resource: string,
    action: string,
    requestedBy: string,
  ): PendingApproval {
    const approval: PendingApproval = {
      id: crypto.randomUUID(),
      resource,
      action,
      requestedBy,
      requestedAt: Date.now(),
      status: "pending",
    };

    this.pendingApprovals.set(approval.id, approval);

    if (this.events.onApprovalRequested) {
      this.events.onApprovalRequested({ ...approval });
    }

    return approval;
  }

  /** Approve a pending approval request. */
  approve(approvalId: string, resolvedBy: string): void {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      throw new Error(`Approval not found: ${approvalId}`);
    }
    if (approval.status !== "pending") {
      throw new Error(`Approval already resolved: ${approvalId}`);
    }

    approval.status = "approved";
    approval.resolvedAt = Date.now();
    approval.resolvedBy = resolvedBy;

    if (this.events.onApprovalResolved) {
      this.events.onApprovalResolved({ ...approval });
    }
  }

  /** Deny a pending approval request. */
  deny(approvalId: string, resolvedBy: string): void {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      throw new Error(`Approval not found: ${approvalId}`);
    }
    if (approval.status !== "pending") {
      throw new Error(`Approval already resolved: ${approvalId}`);
    }

    approval.status = "denied";
    approval.resolvedAt = Date.now();
    approval.resolvedBy = resolvedBy;

    if (this.events.onApprovalResolved) {
      this.events.onApprovalResolved({ ...approval });
    }
  }

  /** Return all pending approvals. */
  getPendingApprovals(): PendingApproval[] {
    return [...this.pendingApprovals.values()].filter(
      (a) => a.status === "pending",
    );
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Check whether a rule matches the given resource, action, and context.
   *
   * Resource and action matching uses simple equality.
   * A wildcard `*` resource matches everything.
   */
  private matchesRule(
    rule: PolicyRule,
    resource: string,
    action: string,
    context?: Record<string, unknown>,
  ): boolean {
    // Resource match: exact or wildcard
    const resourceMatch =
      rule.resource === "*" || rule.resource === resource;
    if (!resourceMatch) return false;

    // Action match
    const actionMatch = rule.action === action;
    if (!actionMatch) return false;

    // Conditions: all must match
    if (rule.conditions && rule.conditions.length > 0) {
      return this.evaluateConditions(rule.conditions, context ?? {});
    }

    return true;
  }

  /**
   * Evaluate an array of conditions against a context.
   * All conditions must match (AND semantics).
   */
  private evaluateConditions(
    conditions: PolicyCondition[],
    context: Record<string, unknown>,
  ): boolean {
    for (const condition of conditions) {
      const fieldValue = condition.field
        ? context[condition.field]
        : context["default"];

      if (!this.evaluateCondition(condition, fieldValue)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate a single condition against a field value.
   */
  private evaluateCondition(
    condition: PolicyCondition,
    fieldValue: unknown,
  ): boolean {
    switch (condition.operator) {
      case "eq":
        return fieldValue === condition.value;
      case "neq":
        return fieldValue !== condition.value;
      case "contains":
        if (typeof fieldValue === "string" && typeof condition.value === "string") {
          return fieldValue.includes(condition.value);
        }
        return false;
      case "starts_with":
        if (typeof fieldValue === "string" && typeof condition.value === "string") {
          return fieldValue.startsWith(condition.value);
        }
        return false;
      case "in":
        if (Array.isArray(condition.value)) {
          return condition.value.includes(fieldValue);
        }
        return false;
      default:
        return false;
    }
  }
}
