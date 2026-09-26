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
