/**
 * Identity & Auth types.
 *
 * Defines user, auth, session, and middleware interfaces used across the
 * cross-cutting identity module.
 */

// ============================================================================
// Core Types
// ============================================================================

/** Authenticated user representation. */
export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  metadata?: Record<string, unknown>;
}

/** Result of an authentication attempt. */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/** Identity provider interface. */
export interface IIdentityProvider {
  authenticate(token: string): Promise<AuthResult>;
  getUser(id: string): Promise<User | null>;
  validateToken(token: string): Promise<boolean>;
}

// ============================================================================
// Session Types
// ============================================================================

/** Identity state attached to a request/session. */
export interface SessionIdentity {
  user: User;
  authenticatedAt: number;
  tokenExp?: number;
}

// ============================================================================
// Middleware Types
// ============================================================================

/** Configuration for IdentityMiddleware. */
export interface IdentityMiddlewareOptions {
  provider: IIdentityProvider;
  excludePaths?: string[];
}
