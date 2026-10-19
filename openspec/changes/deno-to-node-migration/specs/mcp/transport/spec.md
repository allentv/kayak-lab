## ADDED Requirements

### Requirement: MCP transport uses runtime abstraction

The stdio transport MUST spawn subprocesses via the runtime process abstraction, not directly via `Deno.Command`.

#### Scenario: Stdio transport works unchanged

- **WHEN** the MCP server is spawned via stdio
- **THEN** the transport communicates over stdin/stdout identically

#### Scenario: Identical behavior on both runtimes

- **WHEN** the MCP transport test suite runs on Deno and Node.js
- **THEN** both produce identical results
