---
name: Concrete Capabilities
slug: concrete-capabilities
type: system
sources:
  - path: src/capabilities/file.ts
    hash: 0292b8e66e6f62428e731b04d716279127e1f05d4479edb88954bb8b37b6a335
  - path: src/capabilities/git.ts
    hash: a8a891abceab607e16e618f245c3853e8056a6d188afe5ac8259585f3e3cd37c
  - path: src/capabilities/github.ts
    hash: afc029aff2f6b9bcede2ddd7db2fd12b6a10e03378f2800e427d89b127db41f4
  - path: src/capabilities/kubernetes.ts
    hash: 3cc196b2c5f55b21caa8782c0e554c6e3bad3e0147d8cac26eb2893747b47136
  - path: src/capabilities/search.ts
    hash: cb266f3e0d35260bafeda011df1667b5ba4f3be663b12dee4e010a659436be22
  - path: src/capabilities/shell.ts
    hash: 7dbf1074634f8a2e15f9521a9adffaad2cd97aab2d6914a539140d2e7108b53b
sources_digest: e1b1019d4e0d3adf2dfac274147824ebd526694002ac5071a3353e2bc37919b4
links:
  - to: capability-framework
    relation: implements
    description: Each implements ICapability interface and registers via CapabilityRegistry
  - to: sandboxed-execution
    relation: depends_on
    description: >-
      SandboxedShellCapability uses ISandboxRuntime; FileCapability enforces
      sandbox root constraints
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Implementations of specific external system interactions: Git (executing real git commands), GitHub (REST API with rate limiting), Kubernetes (cluster operations), Shell (secure command execution with dangerous command blocking), File (sandboxed filesystem ops), and Search (grep/glob with external tool fallback).

## Related

- implements [[capability-framework]] — Each implements ICapability interface and registers via CapabilityRegistry
- depends on [[sandboxed-execution]] — SandboxedShellCapability uses ISandboxRuntime; FileCapability enforces sandbox root constraints
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
