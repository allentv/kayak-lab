## Why

Cloudflare acquired Deno (October 2026) and core development ends in 2027. kayak-lab is built on Deno 2.x with deep API usage (`Deno.Command`, `Deno.serve`, `Deno.env`, `Deno.watchFs`, JSR packages, Fresh). Migration to Node.js LTS must happen before Deno's EOL to avoid emergency technical debt. The codebase already isolates Deno-specific code behind capability interfaces, which limits migration scope.

## What Changes

- Introduce a runtime abstraction layer (`src/runtime/`) wrapping all Deno-specific APIs behind platform-agnostic interfaces
- Replace direct `Deno.Command` usage in capabilities (shell, git, search, sandbox, kubernetes, mcp) with the abstraction's `ProcessRunner`
- Replace `Deno.env`, `Deno.args`, `Deno.exit` with the abstraction's `RuntimeEnvironment`
- Replace `Deno.serve` with the abstraction's `HttpServer` (Hono on both runtimes)
- Replace `Deno.watchFs` with the abstraction's `FileWatcher`
- Replace `Deno.readTextFile`/`Deno.writeTextFile` with `node:fs/promises` (Node) / `@std/fs` (Deno) behind the abstraction
- Migrate JSR std imports (`@std/path`, `@std/fs`) to `node: equivalents
- Migrate `@db/sqlite` to `better-sqlite3` (Node) or keep `@db/sqlite` via npm compatibility
- Replace Fresh web UI with Hono (runtime-agnostic)
- Replace `deno test` with Vitest; `deno lint`/`deno fmt` with ESLint/Prettier; `deno check` with `tsc`
- Replace `deno.json` tasks with `package.json` scripts
- **BREAKING**: CLI invocation changes from `deno run -A src/main.ts` to `node src/main.ts` (or `tsx` during transition)
- **BREAKING**: Test invocation changes from `deno task test` to `npm test`

## Capabilities

### New Capabilities

- `runtime/process`: Process execution abstraction (spawn, capture output, timeout, kill) replacing `Deno.Command`
- `runtime/environment`: Environment access abstraction (env vars, args, platform info, exit) replacing `Deno.env`, `Deno.args`, `Deno.build`
- `runtime/http`: HTTP server abstraction replacing `Deno.serve`
- `runtime/fs`: File system abstraction (read, write, watch) replacing `Deno.readTextFile`, `Deno.writeTextFile`, `Deno.watchFs`
- `dev-tooling`: Test runner, linter, formatter, type checker migration from Deno built-ins to Node.js ecosystem tools
- `web-ui`: Web monitoring UI migration from Fresh to Hono

### Modified Capabilities

- `capabilities/shell`: Replace `Deno.Command` with `ProcessRunner` abstraction
- `capabilities/git`: Replace `Deno.Command` with `ProcessRunner` abstraction
- `capabilities/search`: Replace `Deno.Command` and `Deno.readTextFile` with abstractions
- `capabilities/sandbox`: Replace `Deno.Command` in Docker/gVisor runtimes with `ProcessRunner`
- `capabilities/kubernetes`: Replace `Deno.readTextFile` with `FileReader`
- `capabilities/file`: Replace `Deno.readTextFile` with `FileReader`
- `core/config`: Replace `Deno.env`, `Deno.readTextFile`, `Deno.watchFs` with abstractions
- `mcp/transport`: Replace `Deno.Command` with `ProcessRunner`
- `persistence`: Replace `@db/sqlite` with Node.js-compatible SQLite driver

## Migration Order (Layered Specs)

The migration proceeds in phases. Each phase produces a working system on both runtimes until the final cutover:

1. **Phase 1 — Runtime abstraction**: Introduce `src/runtime/` interfaces and Deno adapter. All existing code switches to the abstraction. No behavior change.
2. **Phase 2 — Node.js adapter**: Implement Node.js adapter for the abstraction. Both runtimes pass the same test suite.
3. **Phase 3 — Tooling**: Migrate test runner, linter, formatter, type checker to Node.js ecosystem. Deno task scripts remain functional via adapter.
4. **Phase 4 — Web UI**: Replace Fresh with Hono. Both runtimes serve the monitoring dashboard.
5. **Phase 5 — Cutover**: Remove Deno adapter, JSR imports, `deno.json`. Node.js becomes the sole runtime. Update CI, docs, contributor guide.
