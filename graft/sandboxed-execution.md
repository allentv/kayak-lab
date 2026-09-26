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
covers:
  - symbol: DockerRuntimeConfig
    kind: interface
    at: 'src/capabilities/sandbox/docker-runtime.ts:L34-L41'
  - symbol: DockerRuntime
    kind: class
    at: 'src/capabilities/sandbox/docker-runtime.ts:L46-L374'
  - symbol: constructor
    kind: method
    at: 'src/capabilities/sandbox/docker-runtime.ts:L50-L53'
  - symbol: execute
    kind: method
    at: 'src/capabilities/sandbox/docker-runtime.ts:L55-L130'
  - symbol: healthCheck
    kind: method
    at: 'src/capabilities/sandbox/docker-runtime.ts:L132-L271'
  - symbol: setup
    kind: method
    at: 'src/capabilities/sandbox/docker-runtime.ts:L273-L282'
  - symbol: buildDockerArgs
    kind: method
    at: 'src/capabilities/sandbox/docker-runtime.ts:L287-L348'
  - symbol: extractOutput
    kind: method
    at: 'src/capabilities/sandbox/docker-runtime.ts:L353-L373'
  - symbol: GVisorRuntimeConfig
    kind: interface
    at: 'src/capabilities/sandbox/gvisor-runtime.ts:L11-L16'
  - symbol: GVisorRuntime
    kind: class
    at: 'src/capabilities/sandbox/gvisor-runtime.ts:L21-L72'
  - symbol: constructor
    kind: method
    at: 'src/capabilities/sandbox/gvisor-runtime.ts:L22-L27'
  - symbol: healthCheck
    kind: method
    at: 'src/capabilities/sandbox/gvisor-runtime.ts:L29-L71'
  - symbol: SandboxResourceLimits
    kind: interface
    at: 'src/capabilities/sandbox/types.ts:L13-L22'
  - symbol: SandboxMount
    kind: interface
    at: 'src/capabilities/sandbox/types.ts:L25-L32'
  - symbol: SandboxExecConfig
    kind: interface
    at: 'src/capabilities/sandbox/types.ts:L35-L54'
  - symbol: SandboxExecResult
    kind: interface
    at: 'src/capabilities/sandbox/types.ts:L61-L74'
  - symbol: HealthCheckResult
    kind: interface
    at: 'src/capabilities/sandbox/types.ts:L81-L88'
  - symbol: HealthStatus
    kind: interface
    at: 'src/capabilities/sandbox/types.ts:L91-L96'
  - symbol: ISandboxRuntime
    kind: interface
    at: 'src/capabilities/sandbox/types.ts:L108-L120'
  - symbol: SandboxedShellExecOptions
    kind: interface
    at: 'src/capabilities/sandboxed-shell.ts:L29-L38'
  - symbol: SandboxedShellCapability
    kind: class
    at: 'src/capabilities/sandboxed-shell.ts:L51-L202'
  - symbol: constructor
    kind: method
    at: 'src/capabilities/sandboxed-shell.ts:L62-L64'
  - symbol: initialize
    kind: method
    at: 'src/capabilities/sandboxed-shell.ts:L66-L69'
  - symbol: dispose
    kind: method
    at: 'src/capabilities/sandboxed-shell.ts:L71-L74'
  - symbol: exec
    kind: method
    at: 'src/capabilities/sandboxed-shell.ts:L76-L135'
  - symbol: getEnvironment
    kind: method
    at: 'src/capabilities/sandboxed-shell.ts:L137-L148'
  - symbol: commandExists
    kind: method
    at: 'src/capabilities/sandboxed-shell.ts:L150-L156'
  - symbol: getWorkingDirectory
    kind: method
    at: 'src/capabilities/sandboxed-shell.ts:L158-L163'
  - symbol: setWorkingDirectory
    kind: method
    at: 'src/capabilities/sandboxed-shell.ts:L165-L170'
  - symbol: injectDenoPermissions
    kind: method
    at: 'src/capabilities/sandboxed-shell.ts:L178-L201'
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
