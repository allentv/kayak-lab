/**
 * Identity & Auth module tests.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { buildJwtToken, RoleBasedAccessControl, TokenAuthProvider } from "../provider.ts";
import { IdentityMiddleware } from "../middleware.ts";
import type { User } from "../types.ts";

// ============================================================================
// Helpers
// ============================================================================

const SECRET = "test-secret-key";
const ISSUER = "kayak-lab";

function makeUser(overrides?: Partial<User>): User {
  return {
    id: "u1",
    name: "Alice",
    email: "alice@example.com",
    roles: ["user"],
    ...overrides,
  };
}

function makeProvider(): TokenAuthProvider {
  const provider = new TokenAuthProvider({ secret: SECRET, issuer: ISSUER });
  provider.addUser(makeUser());
  provider.addUser(makeUser({ id: "u2", name: "Bob", email: "bob@example.com", roles: ["admin"] }));
  return provider;
}

// ============================================================================
// TokenAuthProvider – JWT
// ============================================================================

Deno.test("authenticate: valid JWT returns user", async () => {
  const provider = makeProvider();
  const token = await buildJwtToken(SECRET, { sub: "u1" }, { issuer: ISSUER });

  const result = await provider.authenticate(token);

  assertEquals(result.success, true);
  assertEquals(result.user?.id, "u1");
  assertEquals(result.user?.name, "Alice");
});

Deno.test("authenticate: invalid signature returns error", async () => {
  const provider = makeProvider();
  const token = await buildJwtToken("wrong-secret", { sub: "u1" }, { issuer: ISSUER });

  const result = await provider.authenticate(token);

  assertEquals(result.success, false);
  assertStrictEquals(result.error, "Invalid signature");
});

Deno.test("authenticate: expired token returns error", async () => {
  const provider = makeProvider();
  const token = await buildJwtToken(SECRET, { sub: "u1" }, { issuer: ISSUER, expiresInSec: -10 });

  const result = await provider.authenticate(token);

  assertEquals(result.success, false);
  assertStrictEquals(result.error, "Token expired");
});

Deno.test("authenticate: invalid issuer returns error", async () => {
  const provider = makeProvider();
  const token = await buildJwtToken(SECRET, { sub: "u1" }, { issuer: "other-issuer" });

  const result = await provider.authenticate(token);

  assertEquals(result.success, false);
  assertStrictEquals(result.error, "Invalid issuer");
});

Deno.test("authenticate: missing sub returns error", async () => {
  const provider = makeProvider();
  const token = await buildJwtToken(SECRET, {}, { issuer: ISSUER });

  const result = await provider.authenticate(token);

  assertEquals(result.success, false);
  assertStrictEquals(result.error, "Missing subject");
});

Deno.test("authenticate: unknown user returns error", async () => {
  const provider = makeProvider();
  const token = await buildJwtToken(SECRET, { sub: "unknown" }, { issuer: ISSUER });

  const result = await provider.authenticate(token);

  assertEquals(result.success, false);
  assertStrictEquals(result.error, "User not found");
});

// ============================================================================
// TokenAuthProvider – API Key
// ============================================================================

Deno.test("authenticate: valid API key returns user", async () => {
  const provider = makeProvider();
  provider.addApiKey("sk-test-123", "u1");

  const result = await provider.authenticate("sk-test-123");

  assertEquals(result.success, true);
  assertEquals(result.user?.id, "u1");
});

Deno.test("authenticate: invalid API key returns error", async () => {
  const provider = makeProvider();

  const result = await provider.authenticate("sk-invalid");

  assertEquals(result.success, false);
  assertStrictEquals(result.error, "Invalid API key");
});

// ============================================================================
// TokenAuthProvider – edge cases
// ============================================================================

Deno.test("authenticate: empty token returns error", async () => {
  const provider = makeProvider();

  const result = await provider.authenticate("");

  assertEquals(result.success, false);
  assertStrictEquals(result.error, "No token provided");
});

Deno.test("getUser: returns user by id", async () => {
  const provider = makeProvider();

  const user = await provider.getUser("u1");

  assertEquals(user?.id, "u1");
  assertEquals(user?.name, "Alice");
});

Deno.test("getUser: returns null for unknown id", async () => {
  const provider = makeProvider();

  const user = await provider.getUser("no-such-user");

  assertStrictEquals(user, null);
});

Deno.test("validateToken: valid JWT returns true", async () => {
  const provider = makeProvider();
  const token = await buildJwtToken(SECRET, { sub: "u1" });

  const valid = await provider.validateToken(token);

  assertEquals(valid, true);
});

Deno.test("validateToken: expired JWT returns false", async () => {
  const provider = makeProvider();
  const token = await buildJwtToken(SECRET, { sub: "u1" }, { expiresInSec: -10 });

  const valid = await provider.validateToken(token);

  assertEquals(valid, false);
});

Deno.test("validateToken: valid API key returns true", async () => {
  const provider = makeProvider();
  provider.addApiKey("sk-test-123", "u1");

  const valid = await provider.validateToken("sk-test-123");

  assertEquals(valid, true);
});

// ============================================================================
// RoleBasedAccessControl
// ============================================================================

Deno.test("RBAC: admin can access everything", () => {
  const rbac = new RoleBasedAccessControl();
  rbac.defineCapability("mcp.tools", ["tool-user"]);

  const admin = makeUser({ id: "a1", roles: ["admin"] });

  assertEquals(rbac.authorize(admin, "mcp.tools", "execute"), true);
  assertEquals(rbac.authorize(admin, "unknown.capability", "read"), true);
});

Deno.test("RBAC: user with required role is authorized", () => {
  const rbac = new RoleBasedAccessControl();
  rbac.defineCapability("mcp.tools", ["tool-user"]);

  const toolUser = makeUser({ roles: ["tool-user"] });

  assertEquals(rbac.authorize(toolUser, "mcp.tools", "execute"), true);
});

Deno.test("RBAC: user without required role is rejected", () => {
  const rbac = new RoleBasedAccessControl();
  rbac.defineCapability("mcp.tools", ["tool-user"]);

  const viewer = makeUser({ roles: ["viewer"] });

  assertEquals(rbac.authorize(viewer, "mcp.tools", "execute"), false);
});

Deno.test("RBAC: undefined capability is rejected", () => {
  const rbac = new RoleBasedAccessControl();
  const user = makeUser({ roles: ["tool-user"] });

  assertEquals(rbac.authorize(user, "nonexistent.cap", "read"), false);
});

// ============================================================================
// IdentityMiddleware
// ============================================================================

Deno.test("middleware: extracts Bearer token and attaches user", async () => {
  const provider = makeProvider();
  const middleware = new IdentityMiddleware({ provider });
  const token = await buildJwtToken(SECRET, { sub: "u1" }, { issuer: ISSUER });

  const request = new Request("https://example.com/api/data", {
    headers: { Authorization: `Bearer ${token}` },
  });

  let capturedUser: User | undefined;
  const response = await middleware.handle(request, async (ctx) => {
    capturedUser = ctx.user;
    return new Response("ok");
  });

  assertEquals(response.status, 200);
  assertEquals(capturedUser?.id, "u1");
});

Deno.test("middleware: missing token returns 401", async () => {
  const provider = makeProvider();
  const middleware = new IdentityMiddleware({ provider });

  const request = new Request("https://example.com/api/data");

  const response = await middleware.handle(request, async () => new Response("ok"));

  assertEquals(response.status, 401);
  const body = await response.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});

Deno.test("middleware: invalid token returns 401", async () => {
  const provider = makeProvider();
  const middleware = new IdentityMiddleware({ provider });

  const request = new Request("https://example.com/api/data", {
    headers: { Authorization: "Bearer bad-token-value" },
  });

  const response = await middleware.handle(request, async () => new Response("ok"));

  assertEquals(response.status, 401);
});

Deno.test("middleware: excluded path skips auth", async () => {
  const provider = makeProvider();
  const middleware = new IdentityMiddleware({
    provider,
    excludePaths: ["/health"],
  });

  const request = new Request("https://example.com/health");

  let capturedUser: User | undefined;
  const response = await middleware.handle(request, async (ctx) => {
    capturedUser = ctx.user;
    return new Response("ok");
  });

  assertEquals(response.status, 200);
  assertEquals(capturedUser?.id, "anonymous");
});

Deno.test("middleware: attachUserToMetadata adds user info", () => {
  const provider = makeProvider();
  const middleware = new IdentityMiddleware({ provider });
  const user = makeUser({ roles: ["admin", "tool-user"] });

  const metadata = middleware.attachUserToMetadata(user, { trace_id: "abc" });

  assertEquals(metadata.user_id, "u1");
  assertEquals(metadata.user_roles, ["admin", "tool-user"]);
  assertEquals(metadata.trace_id, "abc");
});
