/**
 * Identity middleware for request authentication.
 *
 * Extracts Bearer tokens from the Authorization header, authenticates
 * the caller via an IIdentityProvider, and attaches the resolved user
 * to a request handler context.
 */

import type {
  IdentityMiddlewareOptions,
  User,
} from "./types.ts";

// ============================================================================
// IdentityMiddleware
// ============================================================================

/**
 * Middleware that authenticates incoming requests by extracting a Bearer
 * token from the `Authorization` header and delegating to the configured
 * identity provider.
 *
 * On success the resolved {@link User} is forwarded to the downstream
 * handler via a `ctx.user` property. On failure a 401 response is returned.
 */
export class IdentityMiddleware {
  private provider: IdentityMiddlewareOptions["provider"];
  private excludePaths: Set<string>;

  constructor(options: IdentityMiddlewareOptions) {
    this.provider = options.provider;
    this.excludePaths = new Set(options.excludePaths ?? []);
  }

  /**
   * Authenticate an incoming request and invoke the handler.
   *
   * @param request  - The incoming HTTP request.
   * @param handler  - Downstream handler that receives an authenticated context.
   * @returns        - The handler response, or a 401 on auth failure.
   */
  async handle(
    request: Request,
    handler: (ctx: { user: User }) => Promise<Response>,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Skip authentication for excluded paths
    if (this.excludePaths.has(url.pathname)) {
      // No user context for excluded paths – caller is responsible
      // for providing a fallback or handling the missing user.
      return handler({ user: { id: "anonymous", name: "Anonymous", email: "", roles: [] } });
    }

    // Extract Bearer token
    const authHeader = request.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Authenticate via provider
    const result = await this.provider.authenticate(token);

    if (!result.success || !result.user) {
      return new Response(
        JSON.stringify({ error: result.error ?? "Authentication failed" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return handler({ user: result.user });
  }

  /**
   * Attach user identity information to a metadata record.
   *
   * Adds `user_id` and `user_roles` keys that downstream consumers
   * (e.g. telemetry, logging) can read.
   */
  attachUserToMetadata(
    user: User,
    metadata: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...metadata,
      user_id: user.id,
      user_roles: user.roles,
    };
  }

}
