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
covers:
  - symbol: DirectoryEntry
    kind: interface
    at: 'src/capabilities/file.ts:L24-L27'
  - symbol: FileReadData
    kind: type
    at: 'src/capabilities/file.ts:L30-L33'
  - symbol: FileReadOptions
    kind: interface
    at: 'src/capabilities/file.ts:L36-L39'
  - symbol: FileEditOptions
    kind: interface
    at: 'src/capabilities/file.ts:L42-L44'
  - symbol: FileWriteData
    kind: interface
    at: 'src/capabilities/file.ts:L47-L50'
  - symbol: FileEditData
    kind: interface
    at: 'src/capabilities/file.ts:L52-L55'
  - symbol: IFileCapability
    kind: interface
    at: 'src/capabilities/file.ts:L64-L79'
  - symbol: toBase64
    kind: function
    at: 'src/capabilities/file.ts:L112-L120'
  - symbol: looksBinary
    kind: function
    at: 'src/capabilities/file.ts:L123-L128'
  - symbol: mimeTypeFor
    kind: function
    at: 'src/capabilities/file.ts:L130-L133'
  - symbol: FileCapability
    kind: class
    at: 'src/capabilities/file.ts:L138-L382'
  - symbol: initialize
    kind: method
    at: 'src/capabilities/file.ts:L148-L151'
  - symbol: dispose
    kind: method
    at: 'src/capabilities/file.ts:L153-L156'
  - symbol: read
    kind: method
    at: 'src/capabilities/file.ts:L158-L229'
  - symbol: write
    kind: method
    at: 'src/capabilities/file.ts:L231-L263'
  - symbol: edit
    kind: method
    at: 'src/capabilities/file.ts:L265-L322'
  - symbol: resolveWithinRoot
    kind: method
    at: 'src/capabilities/file.ts:L329-L334'
  - symbol: assertRealPathInsideRoot
    kind: method
    at: 'src/capabilities/file.ts:L340-L353'
  - symbol: getRealRoot
    kind: method
    at: 'src/capabilities/file.ts:L355-L365'
  - symbol: assertInside
    kind: method
    at: 'src/capabilities/file.ts:L367-L375'
  - symbol: ensureInitialized
    kind: method
    at: 'src/capabilities/file.ts:L377-L381'
  - symbol: selectLines
    kind: function
    at: 'src/capabilities/file.ts:L392-L408'
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
  - symbol: ShellExecOptions
    kind: interface
    at: 'src/capabilities/shell.ts:L20-L31'
  - symbol: ShellExecResult
    kind: interface
    at: 'src/capabilities/shell.ts:L34-L45'
  - symbol: ShellEnvironment
    kind: interface
    at: 'src/capabilities/shell.ts:L48-L54'
  - symbol: IShellCapability
    kind: interface
    at: 'src/capabilities/shell.ts:L63-L81'
  - symbol: ShellCapability
    kind: class
    at: 'src/capabilities/shell.ts:L120-L335'
  - symbol: initialize
    kind: method
    at: 'src/capabilities/shell.ts:L131-L134'
  - symbol: dispose
    kind: method
    at: 'src/capabilities/shell.ts:L136-L138'
  - symbol: exec
    kind: method
    at: 'src/capabilities/shell.ts:L140-L237'
  - symbol: getEnvironment
    kind: method
    at: 'src/capabilities/shell.ts:L239-L258'
  - symbol: commandExists
    kind: method
    at: 'src/capabilities/shell.ts:L260-L278'
  - symbol: getWorkingDirectory
    kind: method
    at: 'src/capabilities/shell.ts:L280-L283'
  - symbol: setWorkingDirectory
    kind: method
    at: 'src/capabilities/shell.ts:L285-L308'
  - symbol: checkBlocked
    kind: method
    at: 'src/capabilities/shell.ts:L310-L318'
  - symbol: checkDangerous
    kind: method
    at: 'src/capabilities/shell.ts:L320-L328'
  - symbol: ensureInitialized
    kind: method
    at: 'src/capabilities/shell.ts:L330-L334'
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
