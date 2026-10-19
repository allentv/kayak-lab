## 1. Runtime Abstraction Interfaces (Phase 1)

- [ ] 1.1 Create `src/runtime/types.ts` with `ProcessRunner`, `FileSystem`, `Environment`, `HttpServer` interfaces covering existing call sites (run, spawn, readTextFile, writeTextFile, watch, get, set, toObject, args, exit, platform, listen). Verify: `deno check src/runtime/types.ts` passes.
- [ ] 1.2 Create `src/runtime/deno/process.ts` implementing `ProcessRunner` via `Deno.Command`. Verify: unit test spawns `echo hello` and captures stdout.
- [ ] 1.3 Create `src/runtime/deno/environment.ts` implementing `Environment` via `Deno.env`, `Deno.args`, `Deno.build`, `Deno.exit`. Verify: unit test reads env var, reads args, reads platform.
- [ ] 1.4 Create `src/runtime/deno/fs.ts` implementing `FileSystem` via `Deno.readTextFile`, `Deno.writeTextFile`, `Deno.watchFs`. Verify: unit test reads/writes a temp file, watcher fires on change.
- [ ] 1.5 Create `src/runtime/deno/http.ts` implementing `HttpServer` via `Deno.serve` with WebSocket upgrade support. Verify: unit test starts server, makes HTTP request, upgrades WebSocket.
- [ ] 1.6 Create `src/runtime/index.ts` exporting a `createRuntime()` factory that returns the Deno adapter (runtime detection is a TODO for Phase 2). Verify: `deno check src/runtime/index.ts` passes.
- [ ] 1.7 Extend `CapabilityContext` in `src/capabilities/capability.ts` with a `runtime` field holding the adapter. Verify: `deno check src/capabilities/capability.ts` passes.

## 2. Migrate Capabilities to Abstraction (Phase 1)

- [ ] 2.1 Migrate `src/capabilities/shell.ts`: replace `Deno.Command` with `context.runtime.process.run()`, replace `Deno.env`/`Deno.build` with `context.runtime.environment`. Verify: `deno task test -- shell` passes.
- [ ] 2.2 Migrate `src/capabilities/git.ts`: replace `Deno.Command` with `context.runtime.process.run()`. Verify: `deno task test -- git` passes.
- [ ] 2.3 Migrate `src/capabilities/search.ts`: replace `Deno.Command` with `context.runtime.process.run()`, replace `Deno.readTextFile` with `context.runtime.fs.readTextFile()`. Verify: `deno task test -- search` passes.
- [ ] 2.4 Migrate `src/capabilities/file.ts`: replace `Deno.readTextFile` with `context.runtime.fs.readTextFile()`. Verify: `deno task test -- file` passes.
- [ ] 2.5 Migrate `src/capabilities/kubernetes.ts`: replace `Deno.readTextFile` with `context.runtime.fs.readTextFile()`. Verify: `deno task test -- kubernetes` passes.
- [ ] 2.6 Migrate `src/capabilities/sandbox/docker-runtime.ts` and `gvisor-runtime.ts`: replace `Deno.Command` with the runtime process runner (passed via constructor or context). Verify: `deno task test -- sandbox` passes.
- [ ] 2.7 Migrate `src/capabilities/shell.ts` blocked-commands list to use the abstraction's environment for `SHELL`/`HOME` lookups. Verify: `deno task test -- shell` passes.

## 3. Migrate Core Modules to Abstraction (Phase 1)

- [ ] 3.1 Migrate `src/core/config.ts`: replace `Deno.env.toObject()` with `environment.toObject()`, `Deno.readTextFile` with `fs.readTextFile()`, `Deno.watchFs` with `fs.watch()`. Verify: `deno task test -- config` passes.
- [ ] 3.2 Migrate `src/mcp/transport.ts`: replace `Deno.Command` with the runtime process runner. Verify: `deno task test -- mcp` passes.
- [ ] 3.3 Migrate `src/main.ts`: replace `Deno.env.get()` with `environment.get()`, `Deno.env.set()` with `environment.set()`, `Deno.args` with `environment.args()`, `Deno.exit()` with `environment.exit()`, `Deno.serve()` with `http.listen()`. Verify: `deno task check` passes and `deno run -A src/main.ts --port 9999` starts successfully.
- [ ] 3.4 Migrate `src/cli.ts`: replace `Deno.env`, `Deno.args`, `Deno.exit`, `Deno.readTextFile` with the abstraction. Verify: `deno task check` passes.
- [ ] 3.5 Migrate test helpers (`src/__test-utils__/fixtures/loader.ts`, `src/__tests__/_helpers/harness-process.ts`): replace `Deno.Command`, `Deno.readTextFile`, `Deno.writeTextFile`, `Deno.listen` with the abstraction. Verify: `deno task test` passes.
- [ ] 3.6 Migrate test setup code in `src/capabilities/__tests__/git.test.ts`, `search.test.ts`, `sandbox-docker.test.ts`, `src/__tests__/integration-coding-harness.test.ts` to use the abstraction for `Deno.Command`, `Deno.writeTextFile`, `Deno.serve`, `Deno.makeTempDir`. Verify: `deno task test` passes with zero direct `Deno.` references in test files.
- [ ] 3.7 Run full test suite and verify zero `Deno.Command`, `Deno.env`, `Deno.serve`, `Deno.readTextFile`, `Deno.writeTextFile`, `Deno.watchFs`, `Deno.listen` references remain in `src/` (grep clean). Verify: `grep -r "Deno\.\(Command\|env\|serve\|readTextFile\|writeTextFile\|watchFs\|listen\)" src/ --include="*.ts" | grep -v "src/runtime/"` returns empty.

## 4. Node.js Adapter (Phase 2)

- [ ] 4.1 Add `package.json` with dependencies (`hono`, `better-sqlite3` or `@db/sqlite`, dev deps: `typescript`, `vitest`, `@types/node`). Verify: `npm install` succeeds.
- [ ] 4.2 Create `tsconfig.json` with strict mode matching existing `deno.json` compilerOptions, `module: "node16"`, `target: "es2022"`. Verify: `npx tsc --noEmit` runs (expect errors from unmigrated Deno imports — acceptable at this stage).
- [ ] 4.3 Create `src/runtime/node/process.ts` implementing `ProcessRunner` via `node:child_process` (`execFile` for captured, `spawn` for background). Verify: unit test spawns `echo hello` and captures stdout, timeout kills process.
- [ ] 4.4 Create `src/runtime/node/environment.ts` implementing `Environment` via `process.env`, `process.argv`, `process.platform`, `process.exit`. Verify: unit test reads env var, reads args, reads platform.
- [ ] 4.5 Create `src/runtime/node/fs.ts` implementing `FileSystem` via `node:fs/promises` and `fs.watch`. Verify: unit test reads/writes temp file, watcher fires on change.
- [ ] 4.6 Create `src/runtime/node/http.ts` implementing `HttpServer` via `@hono/node-server` with WebSocket upgrade via `@hono/node-ws`. Verify: unit test starts server, makes HTTP request, upgrades WebSocket.
- [ ] 4.7 Update `src/runtime/index.ts` factory to detect runtime (`typeof Deno !== 'undefined'`) and return the appropriate adapter. Verify: `deno task check` still passes and `npx tsc --noEmit src/runtime/index.ts` passes.
- [ ] 4.8 Add `@std/path` and `@std/fs` replacements: audit all `@std/path` imports and replace with `node:path` equivalents (already partially done — `src/core/config.ts` uses `node:path`). Verify: `grep -r "@std/" src/ --include="*.ts"` shows only imports with Node.js equivalents documented.
- [ ] 4.9 Run full test suite on Node.js: `npx vitest run`. Fix any adapter divergences. Verify: `npx vitest run` passes with same results as `deno task test`.
- [ ] 4.10 Add CI matrix (GitHub Actions or equivalent) running tests on both Deno and Node.js. Verify: CI pipeline runs both legs and both pass.

## 5. Tooling Migration (Phase 3)

- [ ] 5.1 Configure Vitest in `vitest.config.ts` with TypeScript support, thread pool, node environment. Migrate test files from `@std/assert` to Vitest's `expect`/`describe`/`it`. Verify: `npx vitest run` passes on all migrated test files.
- [ ] 5.2 Add ESLint config (`eslint.config.js`) with TypeScript support, matching existing `deno lint` rules (exclude `require-await`, `no-explicit-any`). Run initial `npx eslint src/ --fix`. Verify: `npx eslint src/` passes.
- [ ] 5.3 Add Prettier config (`.prettierrc`) matching `deno fmt` style (double quotes, semicolons, 2-space indent, 80-char line width). Run initial `npx prettier --write src/`. Verify: `npx prettier --check src/` passes.
- [ ] 5.4 Verify `tsc --noEmit` passes on the full codebase. Fix any type errors introduced by the migration. Verify: `npx tsc --noEmit` exits 0.
- [ ] 5.5 Update `package.json` scripts: `test`, `test:watch`, `lint`, `format`, `check`, `verify` mirroring the existing `deno task` scripts. Verify: `npm run verify` runs check + lint + test.
- [ ] 5.6 Remove `deno.json` `tasks` section entries for `test`, `test:watch`, `fmt`, `lint`, `check`, `verify` (keep `imports` and `compilerOptions` until Phase 5). Verify: `deno task test` still works via remaining config or falls through to npm.

## 6. Web UI Migration (Phase 4)

- [ ] 6.1 Add Hono dependencies (`hono`, `@hono/node-server`, `@hono/node-ws`, `hono/jsx`). Verify: `npm install` succeeds.
- [ ] 6.2 Create `src/runtime/deno/http.ts` Hono-based adapter and `src/runtime/node/http.ts` Hono-based adapter, both using Hono's router and WebSocket support. Verify: HTTP + WebSocket unit tests pass on both runtimes.
- [ ] 6.3 Migrate `web/main.ts` from Fresh to Hono: replace `App` from `fresh` with Hono app, port routes to Hono handlers. Verify: `deno run -A web/main.ts --connect localhost:9001` serves the dashboard.
- [ ] 6.4 Migrate Fresh islands/components to Hono JSX or HTMX. Verify: dashboard renders session list, event stream, health status.
- [ ] 6.5 Verify embedded mode: `deno run -A src/main.ts --port 9001` serves the dashboard at `/`. Verify: browser check shows dashboard loads and WebSocket connects.
- [ ] 6.6 Verify standalone mode: `deno run -A web/main.ts --connect localhost:9001` connects to harness and displays real-time events. Verify: events appear in dashboard as they are emitted.
- [ ] 6.7 Remove Fresh dependencies from `deno.json` imports (`fresh`, `@fresh/core`, `preact`, `preact/hooks`, `@preact/signals`). Verify: `deno task check` passes.

## 7. Persistence Migration (Phase 2, parallelizable)

- [ ] 7.1 Test `@db/sqlite` on Node.js: import `@db/sqlite` in a scratch Node.js script, execute a simple query. Verify: query returns expected result or documented incompatibility.
- [ ] 7.2 If `@db/sqlite` is incompatible, create `src/store/sqlite-adapter.ts` wrapping `better-sqlite3` with the same async API surface used by `EventStore`. Verify: unit test persists and retrieves events identically.
- [ ] 7.3 Migrate `EventStore` to use the adapter. Verify: `deno task test -- event-store` and `npx vitest run src/store/` both pass.
- [ ] 7.4 Verify schema migration runs cleanly on both runtimes with a fresh database. Verify: `rm -f test.db && deno run -A src/main.ts --port 9999` and `node src/main.ts --port 9999` both create identical schema.

## 8. Cutover (Phase 5)

- [ ] 8.1 Remove `src/runtime/deno/` directory. Verify: `deno task check` fails (expected — Deno adapter gone), `npx tsc --noEmit` passes.
- [ ] 8.2 Remove `deno.json` entirely. Move remaining `imports` to `package.json` dependencies. Verify: `npm install && npm run verify` passes.
- [ ] 8.3 Remove `@std/*` imports from all source files, replace with `node:*` equivalents. Verify: `grep -r "@std/" src/ --include="*.ts"` returns empty.
- [ ] 8.4 Remove JSR-specific config from CI, update CI to Node.js-only. Verify: CI pipeline runs and passes without Deno leg.
- [ ] 8.5 Update `README.md`: change `deno run -A src/main.ts` to `node src/main.ts`, update contributing guide, update test/lint/fmt commands. Verify: README instructions work as written.
- [ ] 8.6 Update `docs/architecture.md`, `docs/capabilities.md`, `docs/contributing.md` to reference Node.js instead of Deno. Verify: grep for "deno" in docs returns only historical references.
- [ ] 8.7 Remove Deno permission flags (`--allow-read`, `--allow-env`, etc.) from all scripts, CI config, and documentation. Verify: grep for `--allow-` returns empty.
- [ ] 8.8 Final smoke test: `npm install && npm run verify` passes, `node src/main.ts --port 9999` starts harness, dashboard loads, events flow, shell/git/search capabilities work. Verify: full manual smoke test on Node.js.
