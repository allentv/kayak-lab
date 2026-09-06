/**
 * Identity & Auth module.
 *
 * Public API surface for the cross-cutting identity module.
 */

// Types
export type {
  AuthResult,
  IIdentityProvider,
  IdentityMiddlewareOptions,
  SessionIdentity,
  User,
} from "./types.ts";

// Provider
export {
  RoleBasedAccessControl,
  TokenAuthProvider,
  buildJwtToken,
} from "./provider.ts";
export type { TokenAuthProviderConfig } from "./provider.ts";

// Middleware
export { IdentityMiddleware } from "./middleware.ts";
