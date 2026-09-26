# src/cross-cutting/policy/types.ts · [[identity-authorization]]

- PolicyEffect · type · L13-L13 — Specifies whether a policy rule permits or blocks an action, determining the fundamental allow/deny outcome.
- PolicyAction · type · L16-L16 — Represents the operation being performed (like read or write) that needs authorization.
- PolicyResource · type · L19-L19 — Identifies the target entity or pattern (like a file path or API endpoint) that an action applies to.
- PolicyCondition · interface · L26-L35 — Defines a runtime check that must be satisfied for a policy rule to apply, enabling context‑aware decisions.
- PolicyRule · interface · L42-L57 — Encodes a single allow/deny directive for a specific resource‑action pair, optionally guarded by conditions.
- PolicyDecision · interface · L64-L73 — Captures the outcome of policy evaluation, including whether access is granted and which rules matched.
- PendingApproval · interface · L80-L97 — Tracks a request for manual review before a sensitive action can proceed, recording its lifecycle.
- PolicyEngineEvents · interface · L104-L111 — Provides hooks for monitoring rule matches and approval‑request events during policy execution.
