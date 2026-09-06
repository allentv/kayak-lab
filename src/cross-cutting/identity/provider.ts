/**
 * Token-based identity provider.
 *
 * Authenticates requests via HMAC-signed JWT tokens or stored API keys.
 * Includes a simple role-based access control (RBAC) helper.
 */

import type {
  AuthResult,
  IIdentityProvider,
  User,
} from "./types.ts";

// ============================================================================
// Types
// ============================================================================

/** Configuration for TokenAuthProvider. */
export interface TokenAuthProviderConfig {
  /** HMAC secret used to sign / verify JWT tokens. */
  secret: string;
  /** Optional issuer claim to validate against. */
  issuer?: string;
}

// ============================================================================
// JWT Helpers
// ============================================================================

function base64UrlDecode(input: string): Uint8Array {
  // Convert base64url → base64
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSign(
  secret: string,
  data: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64UrlEncode(new Uint8Array(sig));
}

async function hmacVerify(
  secret: string,
  data: string,
  signature: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = base64UrlDecode(signature);
  return crypto.subtle.verify("HMAC", key, sigBytes.buffer as ArrayBuffer, encoder.encode(data));
}

function decodeBase64UrlJson(b64: string): Record<string, unknown> | null {
  try {
    const bytes = base64UrlDecode(b64);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ============================================================================
// TokenAuthProvider
// ============================================================================

/**
 * Token-based identity provider supporting HMAC-signed JWTs and API keys.
 *
 * Tokens are validated using `crypto.subtle` HMAC-SHA256.
 * Users and API keys are stored in memory for simplicity.
 */
export class TokenAuthProvider implements IIdentityProvider {
  private config: TokenAuthProviderConfig;
  private users = new Map<string, User>();
  private apiKeys = new Map<string, string>(); // key → userId

  constructor(config: TokenAuthProviderConfig) {
    this.config = config;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Authenticate using a token (JWT or API key).
   *
   * JWT tokens are expected in the format `header.payload.signature`
   * where payload contains `sub` (user id) and optional `exp` (expiry).
   * API keys are matched directly against stored keys.
   */
  async authenticate(token: string): Promise<AuthResult> {
    if (!token) {
      return { success: false, error: "No token provided" };
    }

    // Try JWT first (has three dot-separated parts)
    if (token.split(".").length === 3) {
      return this.authenticateJwt(token);
    }

    // Fall back to API key
    return this.authenticateApiKey(token);
  }

  /** Retrieve a user by id from the in-memory store. */
  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  /**
   * Validate a token's format and expiry.
   *
   * Returns `true` if the token is structurally valid and not expired.
   * Does NOT verify the signature – use `authenticate` for full validation.
   */
  async validateToken(token: string): Promise<boolean> {
    if (token.split(".").length === 3) {
      return this.validateJwtFormat(token);
    }
    // API keys are valid if present in the store
    return this.apiKeys.has(token);
  }

  /** Add a user to the in-memory store. */
  addUser(user: User): void {
    this.users.set(user.id, user);
  }

  /** Register an API key mapped to a user id. */
  addApiKey(key: string, userId: string): void {
    this.apiKeys.set(key, userId);
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private async authenticateJwt(token: string): Promise<AuthResult> {
    const parts = token.split(".");
    const [headerB64, payloadB64, signature] = parts;

    // Verify header algorithm
    const header = decodeBase64UrlJson(headerB64);
    if (!header || header.alg !== "HS256") {
      return { success: false, error: "Unsupported algorithm" };
    }

    // Verify issuer if configured
    const payload = decodeBase64UrlJson(payloadB64);
    if (!payload) {
      return { success: false, error: "Invalid token payload" };
    }
    if (this.config.issuer && payload.iss !== this.config.issuer) {
      return { success: false, error: "Invalid issuer" };
    }

    // Check expiry
    if (typeof payload.exp === "number" && payload.exp < Date.now() / 1000) {
      return { success: false, error: "Token expired" };
    }

    // Verify HMAC signature
    const data = `${headerB64}.${payloadB64}`;
    const valid = await hmacVerify(this.config.secret, data, signature);
    if (!valid) {
      return { success: false, error: "Invalid signature" };
    }

    // Look up user
    const userId = payload.sub as string | undefined;
    if (!userId) {
      return { success: false, error: "Missing subject" };
    }

    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, user };
  }

  private async authenticateApiKey(key: string): Promise<AuthResult> {
    const userId = this.apiKeys.get(key);
    if (!userId) {
      return { success: false, error: "Invalid API key" };
    }

    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, user };
  }

  private validateJwtFormat(token: string): boolean {
    const payload = decodeBase64UrlJson(token.split(".")[1]);
    if (!payload) return false;

    // Check expiry
    if (typeof payload.exp === "number" && payload.exp < Date.now() / 1000) {
      return false;
    }

    return true;
  }
}

// ============================================================================
// JWT Token Builder (for testing / integration)
// ============================================================================

/**
 * Build an HMAC-signed JWT token.
 *
 * Useful for tests and integrations that need to mint tokens.
 */
export async function buildJwtToken(
  secret: string,
  payload: Record<string, unknown>,
  options?: { issuer?: string; expiresInSec?: number },
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };

  const fullPayload: Record<string, unknown> = { ...payload };
  if (options?.issuer) fullPayload.iss = options.issuer;
  if (options?.expiresInSec) {
    fullPayload.exp = Math.floor(Date.now() / 1000) + options.expiresInSec;
  }

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(fullPayload)));

  const data = `${headerB64}.${payloadB64}`;
  const signature = await hmacSign(secret, data);

  return `${data}.${signature}`;
}

// ============================================================================
// Role-Based Access Control (RBAC)
// ============================================================================

/**
 * Simple role-based access control.
 *
 * Maps capabilities to the roles required to perform actions on them.
 * The special role `"admin"` always grants access.
 */
export class RoleBasedAccessControl {
  private capabilityRoles = new Map<string, string[]>();

  /**
   * Define the roles required for a capability.
   * @param capability - Capability identifier (e.g. `"mcp.tools"`)
   * @param roles - Roles that grant access (e.g. `["admin", "tool-user"]`)
   */
  defineCapability(capability: string, roles: string[]): void {
    this.capabilityRoles.set(capability, roles);
  }

  /**
   * Check whether a user is authorized for an action on a capability.
   *
   * Admins always pass. Otherwise the user must hold at least one of
   * the required roles for the capability.
   */
  authorize(user: User, capability: string, action: string): boolean {
    void action; // reserved for future per-action granularity

    if (user.roles.includes("admin")) return true;

    const required = this.capabilityRoles.get(capability);
    if (!required) return false; // no definition → deny

    return required.some((role) => user.roles.includes(role));
  }
}
