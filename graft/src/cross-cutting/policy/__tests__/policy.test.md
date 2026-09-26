# src/cross-cutting/policy/__tests__/policy.test.ts

Test suite verifying the PolicyEngine's core authorization logic including rule evaluation, condition matching, approval workflows, and edge cases.

- allowRule · function · L13-L20 — Helper function that creates an allow-type policy rule with the given resource, action, and optional overrides.
- denyRule · function · L22-L29 — Helper function that creates a deny-type policy rule with the given resource, action, and optional overrides.
