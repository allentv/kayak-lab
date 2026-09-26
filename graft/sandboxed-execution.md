---
name: Sandboxed Execution
slug: sandboxed-execution
type: system
sources:
  - path: src/capabilities/sandbox/docker-runtime.ts
    hash: c7944ff2ba4030e97b1af304be3c661657e9cc8dc3830fd35f8831afad5bb7c4
  - path: src/capabilities/sandbox/gvisor-runtime.ts
    hash: 28439a2565865cf40930d91be9f0108608947d94d35aa3431976c8ee75ab5c44
  - path: src/capabilities/sandbox/mod.ts
    hash: f4a2044c23ad09e37d476e5c8545aa7666fbb04b1c087c920559bde2c255c1b2
  - path: src/capabilities/sandbox/types.ts
    hash: 89466f08fc1cfacbdb6d4cdc04f25628b3b0d065a2d139ec12a5a8c38144255a
  - path: src/capabilities/sandboxed-shell.ts
    hash: 58c7308b7c0a3438b4ff9c6c2ce021665b66a6b1e79eed6677fef761f47ad9a6
sources_digest: e0af93129f541eb9886200feeb6e76099b3a136b9290c06597f1481d650b56f9
links:
  - to: capability-framework
    relation: part_of
    description: Exported via capabilities/mod.ts and used by SandboxedShellCapability
  - to: concrete-capabilities
    relation: produces
    description: >-
      Provides ISandboxRuntime interface that DockerRuntime and GVisorRuntime
      implement
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Multi-layer isolation system for running untrusted code: DockerRuntime provides container isolation with security flags; GVisorRuntime adds kernel-level sandboxing via runsc; SandboxedShellCapability executes commands within these runtimes with automatic Deno permission injection.

## Related

- part of [[capability-framework]] — Exported via capabilities/mod.ts and used by SandboxedShellCapability
- produces [[concrete-capabilities]] — Provides ISandboxRuntime interface that DockerRuntime and GVisorRuntime implement
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
