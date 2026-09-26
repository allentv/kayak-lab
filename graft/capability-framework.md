---
name: Capability Framework
slug: capability-framework
type: system
sources:
  - path: src/capabilities/capability.ts
    hash: 2ed982a3cb89bbc4e065c0fddda6e25dd6d6777179140f8ee0e9323927996e77
  - path: src/capabilities/mod.ts
    hash: b8d77a04ba0974323bdbd7a93744592e3b0d60b5025ce8b1a67ae485fe9d2389
sources_digest: 52d765fb03e6b158491e98157b0c44af0234af5538db06a1b7ed46cc1c363ba7
links:
  - to: concrete-capabilities
    relation: produces
    description: >-
      Defines ICapability interface and registry that all concrete capabilities
      implement
  - to: sandboxed-execution
    relation: uses
    description: >-
      Registry includes sandboxed variants that depend on sandbox runtime
      interfaces
generator:
  version: 1
covers:
  - symbol: RateLimitConfig
    kind: interface
    at: 'src/capabilities/capability.ts:L15-L22'
  - symbol: CapabilityDefinition
    kind: interface
    at: 'src/capabilities/capability.ts:L25-L31'
  - symbol: CapabilityContext
    kind: interface
    at: 'src/capabilities/capability.ts:L34-L38'
  - symbol: CapabilityResult
    kind: interface
    at: 'src/capabilities/capability.ts:L41-L46'
  - symbol: ICapability
    kind: interface
    at: 'src/capabilities/capability.ts:L55-L64'
  - symbol: CapabilityError
    kind: class
    at: 'src/capabilities/capability.ts:L70-L79'
  - symbol: constructor
    kind: method
    at: 'src/capabilities/capability.ts:L71-L78'
  - symbol: CapabilityNotInitializedError
    kind: class
    at: 'src/capabilities/capability.ts:L81-L86'
  - symbol: constructor
    kind: method
    at: 'src/capabilities/capability.ts:L82-L85'
  - symbol: CapabilityExecutionError
    kind: class
    at: 'src/capabilities/capability.ts:L88-L97'
  - symbol: constructor
    kind: method
    at: 'src/capabilities/capability.ts:L89-L96'
  - symbol: CapabilityRegistry
    kind: class
    at: 'src/capabilities/capability.ts:L106-L169'
  - symbol: register
    kind: method
    at: 'src/capabilities/capability.ts:L113-L115'
  - symbol: unregister
    kind: method
    at: 'src/capabilities/capability.ts:L120-L123'
  - symbol: get
    kind: method
    at: 'src/capabilities/capability.ts:L128-L130'
  - symbol: getAll
    kind: method
    at: 'src/capabilities/capability.ts:L135-L137'
  - symbol: initializeAll
    kind: method
    at: 'src/capabilities/capability.ts:L142-L149'
  - symbol: disposeAll
    kind: method
    at: 'src/capabilities/capability.ts:L154-L161'
  - symbol: isInitialized
    kind: method
    at: 'src/capabilities/capability.ts:L166-L168'
---
<!-- context:generated:start -->
## Summary

Core abstraction layer for secure, typed interaction with external systems (Git, GitHub, Kubernetes, shell, filesystem). Provides registration, lifecycle management, and structured error handling via CapabilityRegistry, enforcing initialization and rate limiting.

## Related

- produces [[concrete-capabilities]] — Defines ICapability interface and registry that all concrete capabilities implement
- uses [[sandboxed-execution]] — Registry includes sandboxed variants that depend on sandbox runtime interfaces
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
