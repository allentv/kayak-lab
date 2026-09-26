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
covers:
  - symbol: IdentityMiddleware
    kind: class
    at: 'src/cross-cutting/identity/middleware.ts:L26-L104'
  - symbol: constructor
    kind: method
    at: 'src/cross-cutting/identity/middleware.ts:L30-L33'
  - symbol: handle
    kind: method
    at: 'src/cross-cutting/identity/middleware.ts:L42-L85'
  - symbol: attachUserToMetadata
    kind: method
    at: 'src/cross-cutting/identity/middleware.ts:L93-L102'
  - symbol: TokenAuthProviderConfig
    kind: interface
    at: 'src/cross-cutting/identity/provider.ts:L19-L24'
  - symbol: base64UrlDecode
    kind: function
    at: 'src/cross-cutting/identity/provider.ts:L30-L38'
  - symbol: base64UrlEncode
    kind: function
    at: 'src/cross-cutting/identity/provider.ts:L40-L44'
  - symbol: hmacSign
    kind: function
    at: 'src/cross-cutting/identity/provider.ts:L46-L60'
  - symbol: hmacVerify
    kind: function
    at: 'src/cross-cutting/identity/provider.ts:L62-L77'
  - symbol: decodeBase64UrlJson
    kind: function
    at: 'src/cross-cutting/identity/provider.ts:L79-L87'
  - symbol: TokenAuthProvider
    kind: class
    at: 'src/cross-cutting/identity/provider.ts:L99-L232'
  - symbol: constructor
    kind: method
    at: 'src/cross-cutting/identity/provider.ts:L104-L106'
  - symbol: authenticate
    kind: method
    at: 'src/cross-cutting/identity/provider.ts:L117-L129'
  - symbol: getUser
    kind: method
    at: 'src/cross-cutting/identity/provider.ts:L132-L134'
  - symbol: validateToken
    kind: method
    at: 'src/cross-cutting/identity/provider.ts:L142-L148'
  - symbol: addUser
    kind: method
    at: 'src/cross-cutting/identity/provider.ts:L151-L153'
  - symbol: addApiKey
    kind: method
    at: 'src/cross-cutting/identity/provider.ts:L156-L158'
  - symbol: authenticateJwt
    kind: method
    at: 'src/cross-cutting/identity/provider.ts:L162-L205'
  - symbol: authenticateApiKey
    kind: method
    at: 'src/cross-cutting/identity/provider.ts:L207-L219'
  - symbol: validateJwtFormat
    kind: method
    at: 'src/cross-cutting/identity/provider.ts:L221-L231'
  - symbol: buildJwtToken
    kind: function
    at: 'src/cross-cutting/identity/provider.ts:L243-L264'
  - symbol: RoleBasedAccessControl
    kind: class
    at: 'src/cross-cutting/identity/provider.ts:L276-L304'
  - symbol: defineCapability
    kind: method
    at: 'src/cross-cutting/identity/provider.ts:L284-L286'
  - symbol: authorize
    kind: method
    at: 'src/cross-cutting/identity/provider.ts:L294-L303'
  - symbol: User
    kind: interface
    at: 'src/cross-cutting/identity/types.ts:L13-L19'
  - symbol: AuthResult
    kind: interface
    at: 'src/cross-cutting/identity/types.ts:L22-L26'
  - symbol: IIdentityProvider
    kind: interface
    at: 'src/cross-cutting/identity/types.ts:L29-L33'
  - symbol: SessionIdentity
    kind: interface
    at: 'src/cross-cutting/identity/types.ts:L40-L44'
  - symbol: IdentityMiddlewareOptions
    kind: interface
    at: 'src/cross-cutting/identity/types.ts:L51-L54'
  - symbol: PolicyEngine
    kind: class
    at: 'src/cross-cutting/policy/engine.ts:L29-L282'
  - symbol: constructor
    kind: method
    at: 'src/cross-cutting/policy/engine.ts:L34-L36'
  - symbol: addRule
    kind: method
    at: 'src/cross-cutting/policy/engine.ts:L43-L45'
  - symbol: removeRule
    kind: method
    at: 'src/cross-cutting/policy/engine.ts:L48-L50'
  - symbol: getRules
    kind: method
    at: 'src/cross-cutting/policy/engine.ts:L53-L57'
  - symbol: evaluate
    kind: method
    at: 'src/cross-cutting/policy/engine.ts:L71-L119'
  - symbol: requestApproval
    kind: method
    at: 'src/cross-cutting/policy/engine.ts:L130-L151'
  - symbol: approve
    kind: method
    at: 'src/cross-cutting/policy/engine.ts:L154-L170'
  - symbol: deny
    kind: method
    at: 'src/cross-cutting/policy/engine.ts:L173-L189'
  - symbol: getPendingApprovals
    kind: method
    at: 'src/cross-cutting/policy/engine.ts:L192-L196'
  - symbol: matchesRule
    kind: method
    at: 'src/cross-cutting/policy/engine.ts:L208-L229'
  - symbol: evaluateConditions
    kind: method
    at: 'src/cross-cutting/policy/engine.ts:L235-L249'
  - symbol: evaluateCondition
    kind: method
    at: 'src/cross-cutting/policy/engine.ts:L254-L281'
  - symbol: PolicyEffect
    kind: type
    at: 'src/cross-cutting/policy/types.ts:L13-L13'
  - symbol: PolicyAction
    kind: type
    at: 'src/cross-cutting/policy/types.ts:L16-L16'
  - symbol: PolicyResource
    kind: type
    at: 'src/cross-cutting/policy/types.ts:L19-L19'
  - symbol: PolicyCondition
    kind: interface
    at: 'src/cross-cutting/policy/types.ts:L26-L35'
  - symbol: PolicyRule
    kind: interface
    at: 'src/cross-cutting/policy/types.ts:L42-L57'
  - symbol: PolicyDecision
    kind: interface
    at: 'src/cross-cutting/policy/types.ts:L64-L73'
  - symbol: PendingApproval
    kind: interface
    at: 'src/cross-cutting/policy/types.ts:L80-L97'
  - symbol: PolicyEngineEvents
    kind: interface
    at: 'src/cross-cutting/policy/types.ts:L104-L111'
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
