---
name: Capability Lifecycle Enforcement
slug: capability-lifecycle-enforcement
type: concept
sources:
  - path: src/capabilities/__tests__/capability.test.ts
    hash: 24a61708e780bf6ffe96c9813fb5e9235827c0e0bde6ebfe8526cfb47e5cb9fc
  - path: src/capabilities/capability.ts
    hash: 2ed982a3cb89bbc4e065c0fddda6e25dd6d6777179140f8ee0e9323927996e77
sources_digest: 3d27ff0481fcd6bc221507346462cb00f91b374d7cd15006d8a6ca8f64151029
links:
  - to: capability-framework
    relation: implements
    description: Registry enforces lifecycle via initializeAll/disposeAll methods
  - to: concrete-capabilities
    relation: validates
    description: Tests verify initialization required before method calls
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Strict initialization protocol: capabilities must be registered, then initialized before use, and disposed after. Registry tracks initialization state and throws CapabilityNotInitializedError if used prematurely. This prevents accidental use of unconfigured capabilities (e.g., GitHub without token).

## Related

- implements [[capability-framework]] — Registry enforces lifecycle via initializeAll/disposeAll methods
- validates [[concrete-capabilities]] — Tests verify initialization required before method calls
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
