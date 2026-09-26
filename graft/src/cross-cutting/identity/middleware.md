# src/cross-cutting/identity/middleware.ts · [[identity-authorization]]

Provides authentication middleware that extracts Bearer tokens from HTTP requests and attaches user identity to request contexts.

- IdentityMiddleware · class · L26-L104 — Middleware class that authenticates incoming HTTP requests via Bearer tokens and delegates to a configurable identity provider.
- constructor · method · L30-L33 — Initializes the middleware with an identity provider and optional path exclusions for authentication bypass.
- handle · method · L42-L85 — Processes HTTP requests by extracting Bearer tokens, authenticating via the provider, and either returning 401 errors or forwarding authenticated users to downstream handlers.
- attachUserToMetadata · method · L93-L102 — Enriches metadata records with user identity information for downstream consumption by telemetry and logging systems.
