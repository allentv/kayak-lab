import { assertEquals, assertThrows } from "@std/assert";
import { PolicyEngine } from "../engine.ts";
import type {
  PendingApproval,
  PolicyEngineEvents,
  PolicyRule,
} from "../types.ts";

// ============================================================================
// Helpers
// ============================================================================

function allowRule(
  id: string,
  resource: string,
  action: string,
  opts?: Partial<PolicyRule>,
): PolicyRule {
  return { id, effect: "allow", resource, action, ...opts };
}

function denyRule(
  id: string,
  resource: string,
  action: string,
  opts?: Partial<PolicyRule>,
): PolicyRule {
  return { id, effect: "deny", resource, action, ...opts };
}

// ============================================================================
// Tests
// ============================================================================

Deno.test("PolicyEngine - allow rule permits action", () => {
  const engine = new PolicyEngine();
  engine.addRule(allowRule("r1", "file:/src", "read"));

  const decision = engine.evaluate("file:/src", "read");

  assertEquals(decision.allowed, true);
  assertEquals(decision.matchedRules.length, 1);
  assertEquals(decision.matchedRules[0].id, "r1");
});

Deno.test("PolicyEngine - deny rule blocks action", () => {
  const engine = new PolicyEngine();
  engine.addRule(denyRule("r1", "file:/secret", "read"));

  const decision = engine.evaluate("file:/secret", "read");

  assertEquals(decision.allowed, false);
  assertEquals(decision.matchedRules.length, 1);
});

Deno.test("PolicyEngine - deny overrides allow when both match", () => {
  const engine = new PolicyEngine();
  engine.addRule(allowRule("r1", "file:/src", "read"));
  engine.addRule(denyRule("r2", "file:/src", "read"));

  const decision = engine.evaluate("file:/src", "read");

  assertEquals(decision.allowed, false);
  assertEquals(decision.matchedRules.length, 2);
});

Deno.test("PolicyEngine - no matching rules denies by default (implicit deny)", () => {
  const engine = new PolicyEngine();
  engine.addRule(allowRule("r1", "other:/resource", "read"));

  const decision = engine.evaluate("file:/src", "read");

  assertEquals(decision.allowed, false);
  assertEquals(decision.matchedRules.length, 0);
  assertEquals(decision.reason, "No matching rules (implicit deny)");
});

Deno.test("PolicyEngine - condition with matching value applies rule", () => {
  const engine = new PolicyEngine();
  engine.addRule({
    id: "r1",
    effect: "allow",
    resource: "api:/users",
    action: "read",
    conditions: [{ type: "user", operator: "eq", value: "admin", field: "role" }],
  });

  const decision = engine.evaluate("api:/users", "read", { role: "admin" });

  assertEquals(decision.allowed, true);
  assertEquals(decision.matchedRules.length, 1);
});

Deno.test("PolicyEngine - condition with non-matching value does not apply rule", () => {
  const engine = new PolicyEngine();
  engine.addRule({
    id: "r1",
    effect: "allow",
    resource: "api:/users",
    action: "read",
    conditions: [{ type: "user", operator: "eq", value: "admin", field: "role" }],
  });

  const decision = engine.evaluate("api:/users", "read", { role: "viewer" });

  assertEquals(decision.allowed, false);
  assertEquals(decision.matchedRules.length, 0);
});

Deno.test("PolicyEngine - multiple conditions all must match", () => {
  const engine = new PolicyEngine();
  engine.addRule({
    id: "r1",
    effect: "allow",
    resource: "api:/deploy",
    action: "write",
    conditions: [
      { type: "user", operator: "eq", value: "admin", field: "role" },
      { type: "env", operator: "eq", value: "production", field: "environment" },
    ],
  });

  // All conditions match
  const ok = engine.evaluate("api:/deploy", "write", {
    role: "admin",
    environment: "production",
  });
  assertEquals(ok.allowed, true);

  // One condition fails
  const fail = engine.evaluate("api:/deploy", "write", {
    role: "admin",
    environment: "staging",
  });
  assertEquals(fail.allowed, false);
  assertEquals(fail.matchedRules.length, 0);
});

Deno.test("PolicyEngine - condition operators: contains, starts_with, in, neq", () => {
  const engine = new PolicyEngine();

  // contains
  engine.addRule({
    id: "contains",
    effect: "allow",
    resource: "file:/logs",
    action: "read",
    conditions: [{ type: "path", operator: "contains", value: "audit", field: "path" }],
  });
  assertEquals(engine.evaluate("file:/logs", "read", { path: "/var/log/audit/syslog" }).allowed, true);
  assertEquals(engine.evaluate("file:/logs", "read", { path: "/var/log/syslog" }).allowed, false);

  // starts_with
  engine.removeRule("contains");
  engine.addRule({
    id: "startswith",
    effect: "allow",
    resource: "file:/logs",
    action: "read",
    conditions: [{ type: "path", operator: "starts_with", value: "/var", field: "path" }],
  });
  assertEquals(engine.evaluate("file:/logs", "read", { path: "/var/log/syslog" }).allowed, true);
  assertEquals(engine.evaluate("file:/logs", "read", { path: "/etc/log" }).allowed, false);

  // in
  engine.removeRule("startswith");
  engine.addRule({
    id: "in",
    effect: "allow",
    resource: "api:/data",
    action: "read",
    conditions: [{ type: "tier", operator: "in", value: ["free", "pro", "enterprise"] }],
  });
  assertEquals(engine.evaluate("api:/data", "read", { default: "pro" }).allowed, true);
  assertEquals(engine.evaluate("api:/data", "read", { default: "unknown" }).allowed, false);

  // neq
  engine.removeRule("in");
  engine.addRule({
    id: "neq",
    effect: "allow",
    resource: "api:/data",
    action: "write",
    conditions: [{ type: "user", operator: "neq", value: "system", field: "role" }],
  });
  assertEquals(engine.evaluate("api:/data", "write", { role: "admin" }).allowed, true);
  assertEquals(engine.evaluate("api:/data", "write", { role: "system" }).allowed, false);
});

Deno.test("PolicyEngine - approval workflow: request then approve", () => {
  const events: PolicyEngineEvents = {
    onApprovalRequested: () => {},
    onApprovalResolved: () => {},
  };
  let requestedCalled = false;
  let resolvedCalled = false;
  let resolvedStatus: string | undefined;

  events.onApprovalRequested = () => { requestedCalled = true; };
  events.onApprovalResolved = (a: PendingApproval) => {
    resolvedCalled = true;
    resolvedStatus = a.status;
  };

  const engine = new PolicyEngine(events);
  const approval = engine.requestApproval("file:/deploy", "write", "alice");

  assertEquals(approval.status, "pending");
  assertEquals(approval.resource, "file:/deploy");
  assertEquals(approval.action, "write");
  assertEquals(approval.requestedBy, "alice");
  assertEquals(requestedCalled, true);

  engine.approve(approval.id, "bob");

  const pending = engine.getPendingApprovals();
  assertEquals(pending.length, 0);
  assertEquals(resolvedCalled, true);
  assertEquals(resolvedStatus, "approved");
});

Deno.test("PolicyEngine - approval workflow: request then deny", () => {
  let resolvedStatus: string | undefined;
  const engine = new PolicyEngine({
    onApprovalResolved: (a: PendingApproval) => { resolvedStatus = a.status; },
  });

  const approval = engine.requestApproval("api:/secrets", "read", "alice");
  engine.deny(approval.id, "bob");

  assertEquals(resolvedStatus, "denied");
  assertEquals(engine.getPendingApprovals().length, 0);
});

Deno.test("PolicyEngine - list rules and remove rules", () => {
  const engine = new PolicyEngine();
  engine.addRule(allowRule("r1", "a", "x"));
  engine.addRule(denyRule("r2", "b", "y"));
  engine.addRule(allowRule("r3", "c", "z"));

  assertEquals(engine.getRules().length, 3);

  engine.removeRule("r2");
  assertEquals(engine.getRules().length, 2);
  assertEquals(engine.getRules().find((r) => r.id === "r2"), undefined);
});

Deno.test("PolicyEngine - priority ordering: higher priority wins", () => {
  const engine = new PolicyEngine();
  engine.addRule(denyRule("low", "file:/src", "read", { priority: 1 }));
  engine.addRule(allowRule("high", "file:/src", "read", { priority: 10 }));

  const decision = engine.evaluate("file:/src", "read");

  // Deny-overrides-allow still applies: both match, so denied
  assertEquals(decision.allowed, false);
  // But matchedRules are ordered by priority (high first)
  assertEquals(decision.matchedRules[0].id, "high");
  assertEquals(decision.matchedRules[1].id, "low");
});

Deno.test("PolicyEngine - wildcard resource matches any resource", () => {
  const engine = new PolicyEngine();
  engine.addRule(allowRule("wild", "*", "read"));

  assertEquals(engine.evaluate("any:/resource", "read").allowed, true);
  assertEquals(engine.evaluate("file:/something", "read").allowed, true);
});

Deno.test("PolicyEngine - onRuleMatched event fires for each matched rule", () => {
  const matchedRuleIds: string[] = [];
  const engine = new PolicyEngine({
    onRuleMatched: (ruleId: string) => { matchedRuleIds.push(ruleId); },
  });

  engine.addRule(allowRule("r1", "file:/src", "read"));
  engine.addRule(denyRule("r2", "file:/src", "read"));
  engine.addRule(allowRule("r3", "other:/resource", "write"));

  engine.evaluate("file:/src", "read");

  assertEquals(matchedRuleIds, ["r1", "r2"]);
});

Deno.test("PolicyEngine - approve throws for unknown approval id", () => {
  const engine = new PolicyEngine();
  assertThrows(() => engine.approve("nonexistent", "bob"), Error, "Approval not found");
});

Deno.test("PolicyEngine - approve throws for already resolved approval", () => {
  const engine = new PolicyEngine();
  const approval = engine.requestApproval("a", "b", "c");
  engine.approve(approval.id, "d");
  assertThrows(() => engine.approve(approval.id, "e"), Error, "Approval already resolved");
});

Deno.test("PolicyEngine - deny throws for already resolved approval", () => {
  const engine = new PolicyEngine();
  const approval = engine.requestApproval("a", "b", "c");
  engine.deny(approval.id, "d");
  assertThrows(() => engine.deny(approval.id, "e"), Error, "Approval already resolved");
});
