# src/cross-cutting/policy/engine.ts · [[identity-authorization]]

Implements a policy engine that evaluates resource+action pairs against rules using deny-overrides-allow semantics with implicit deny.

- PolicyEngine · class · L29-L282 — A rule-based policy engine that evaluates access decisions with deny-overrides-allow semantics and implicit deny.
- constructor · method · L34-L36 — Initializes the policy engine with optional event handlers for monitoring rule matches and approval workflows.
- addRule · method · L43-L45 — Adds or replaces a policy rule in the engine's rule set.
- removeRule · method · L48-L50 — Removes a policy rule from the engine's rule set by its identifier.
- getRules · method · L53-L57 — Returns all policy rules sorted by priority (highest first) for deterministic evaluation.
- evaluate · method · L71-L119 — Evaluates a resource+action pair against the rule set to determine access permission using deny-overrides-allow logic.
- requestApproval · method · L130-L151 — Creates a pending approval request for a resource+action pair that requires manual review.
- approve · method · L154-L170 — Approves a pending approval request, updating its status and recording resolution details.
- deny · method · L173-L189 — Denies a pending approval request, updating its status and recording resolution details.
- getPendingApprovals · method · L192-L196 — Returns all approval requests that are currently pending resolution.
- matchesRule · method · L208-L229 — Determines if a rule matches the given resource, action, and context by checking resource/action equality and evaluating conditions.
- evaluateConditions · method · L235-L249 — Evaluates an array of conditions against a context, requiring all conditions to match (AND semantics).
- evaluateCondition · method · L254-L281 — Evaluates a single condition against a field value using various comparison operators like equality, inequality, and containment.
