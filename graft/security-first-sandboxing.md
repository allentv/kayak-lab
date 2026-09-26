---
name: Security-First Sandboxing
slug: security-first-sandboxing
type: concept
sources:
  - path: scripts/sandbox-health-check.sh
    hash: c5e35026e9b5a203b0fc459757144b88fb9ffef2da02dbf6ca9d179ebe44a9e2
  - path: src/capabilities/file.ts
    hash: 0292b8e66e6f62428e731b04d716279127e1f05d4479edb88954bb8b37b6a335
  - path: src/capabilities/sandbox/docker-runtime.ts
    hash: c7944ff2ba4030e97b1af304be3c661657e9cc8dc3830fd35f8831afad5bb7c4
  - path: src/capabilities/sandbox/gvisor-runtime.ts
    hash: 28439a2565865cf40930d91be9f0108608947d94d35aa3431976c8ee75ab5c44
  - path: src/capabilities/shell.ts
    hash: 7dbf1074634f8a2e15f9521a9adffaad2cd97aab2d6914a539140d2e7108b53b
sources_digest: 15bc71976f82661924ac0ca6e0bcc5717278759b11c02e2272a310b5ed0ddc7d
links:
  - to: concrete-capabilities
    relation: configures
    description: Capabilities implement security checks like path traversal prevention
  - to: sandboxed-execution
    relation: implements
    description: Concrete runtimes enforce these security constraints
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Defense-in-depth approach: commands execute in containers with --network=none and --cap-drop=ALL; gVisor adds kernel isolation; FileCapability restricts paths to sandbox root; ShellCapability blocks dangerous commands; SandboxedShellCapability injects restrictive Deno flags. Health checks verify isolation layers.

## Related

- configures [[concrete-capabilities]] — Capabilities implement security checks like path traversal prevention
- implements [[sandboxed-execution]] — Concrete runtimes enforce these security constraints
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
