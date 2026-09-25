---
name: Identity & Authorization
slug: identity-authorization
type: system
sources:
  - path: src/cross-cutting/identity/middleware.ts
    hash: cdec616689e4d752bccb408515886a948d2602a01968c2305f29cd90167b298e
  - path: src/cross-cutting/identity/mod.ts
    hash: 3316a8d5cf12d0e688e6711af97144af45764fbea31d9a89717089f9be1bc472
  - path: src/cross-cutting/identity/provider.ts
    hash: 997a1723c5faeb957333116c4f48520faa5f8fb967c7ae43ad91b004b6687742
  - path: src/cross-cutting/identity/types.ts
    hash: ac3a6550f13dd3388e9f52ce5bd7c976d6e1df100ec13e12f7f41ee131c75c9b
  - path: src/cross-cutting/policy/engine.ts
    hash: 62c6e84130cc42056d081c2d0a7072ffe0aa2f9e8e173d1437ab3a0678f8a0a9
  - path: src/cross-cutting/policy/mod.ts
    hash: 1485d3fa8165dd57f193f6a7f2f4eb4512193ec824786a93387b4439372ddcaf
  - path: src/cross-cutting/policy/types.ts
    hash: f2117eb3cfc76eb85794e859455d9dc7eb72d849966b120a6a9edea49fcea2bf
sources_digest: d2b976d8395749f119d37b01b1a786adf9acbbc3e002acc441ed6bfca7c426f0
links:
  - to: cross-cutting-telemetry
    relation: produces
    description: >-
      Authentication results and policy decisions are logged and traced for
      audit.
  - to: event-sourcing-session-lifecycle
    relation: depends_on
    description: Authorization decisions may be based on session identity and user roles.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Authentication (JWT/API key) and role-based authorization (RBAC) with middleware that extracts Bearer tokens and attaches User objects to request context. TokenAuthProvider uses in-memory stores for users/keys, making it unsuitable for distributed deployments. PolicyEngine implements deny-overrides-allow rule evaluation with optional approval workflows and event hooks.

## Related

- produces [[cross-cutting-telemetry]] — Authentication results and policy decisions are logged and traced for audit.
- depends on [[event-sourcing-session-lifecycle]] — Authorization decisions may be based on session identity and user roles.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
