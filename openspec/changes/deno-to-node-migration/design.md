## Context

kayak-lab is a Deno 2.x TypeScript project with Deno-specific APIs concentrated in ~15 files across capabilities, core, and mcp modules. The capability layer already has interfaces (`ICapability`, `IShellCapability`, etc.) that isolate business logic from runtime details. Deno API usage falls into five categories: subprocess (`Deno.Command` — 20+ call sites), environment (`Deno.env`, `Deno.args`, `Deno.exit`), HTTP server (`Deno.serve`), file I/O (`Deno.readTextFile`/`writeTextFile`), and file watching (`Deno.watchFs`). The project also uses JSR std imports (`@std/path`, `@std/fs`), `@db/sqlite`, and Fresh for the web UI. See proposal.md for full scope.

## Goals / Non-Goals

**Goals:**
- All runtime-specific code behind a single abstraction layer in `src/runtime/`
- Both Deno and Node.js pass the same test suite during transition
- Zero behavior change from the user's perspective (CLI flags, API surface, config format identical)
- Migration proceeds in phases; each phase leaves a working system

**Non-Goals:**
- Rewriting business logic, event sourcing, or projection architecture
- Changing the capability interface contracts (`ICapability` etc.)
- Supporting runtimes other than Deno and Node.js
- Migrating to ESM-only module format (keep existing import style during transition)

## Decisions

### 1. Runtime adapter via dependency injection, not conditional imports

**Decision:** The runtime adapter is instantiated once at startup and passed through the existing capability context. Each capability receives the adapter via its existing `initialize(context)` call, extended with a `runtime` field.

**Rationale:** The capability pattern already injects context. Adding `runtime` to `CapabilityContext` follows the existing convention and avoids global state or conditional `if (typeof Deno !== 'undefined')` checks scattered across the codebase. Alternative considered: conditional imports (`import.meta.env` sniffing) — rejected because it's fragile, hard to test, and spreads runtime awareness everywhere.

### 2. Abstraction interfaces are minimal, not comprehensive

**Decision:** Define narrow interfaces that cover only the call sites that exist today, not a hypothetical full runtime API. `ProcessRunner` has `run()` and `spawn()`; `FileSystem` has `readTextFile()`, `writeTextFile()`, `watch()`; `Environment` has `get()`, `set()`, `toObject()`, `args()`, `exit()`, `platform()`; `HttpServer` has `listen()`.

**Rationale:** Over-abstracting creates maintenance burden and leaky interfaces. The existing call sites define the contract. Alternative considered: a comprehensive `Runtime` facade — rejected because it couples unrelated concerns and grows unboundedly.

### 3. Hono replaces Fresh for the web UI

**Decision:** Migrate the Fresh-based monitoring dashboard to Hono, which runs on Deno, Node.js, Bun, and Cloudflare Workers with the same API.

**Rationale:** Fresh is Deno-only and ties the UI to the runtime being abandoned. Hono's JSX/HTMX support covers the dashboard's server-rendered needs, and its WebSocket support (`@hono/node-ws` / `@hono/deno-ws`) handles real-time event streaming. Alternative considered: keep Fresh until final cutover — rejected because it means maintaining two web stacks and the Fresh→Hono migration is easier to do alongside the runtime abstraction than after.

### 4. Vitest for test runner

**Decision:** Replace `deno test` with Vitest, configured with `pool: 'threads'` for parallelism and `environment: 'node'`.

**Rationale:** Vitest has native TypeScript support, ESM compatibility, API mocking, and watch mode. It runs on Node.js but the test files themselves are runtime-agnostic after the abstraction migration. Alternative considered: `node:test` — rejected because it lacks watch mode and has weaker TypeScript ergonomics. Alternative considered: Jest — rejected because Vitest is faster and has better ESM support.

### 5. SQLite: keep `@db/sqlite` via npm, fall back to `better-sqlite3`

**Decision:** First attempt to use `@db/sqlite` on Node.js (Deno published it to npm). If API incompatibilities arise, migrate to `better-sqlite3` with a thin adapter.

**Rationale:** Minimizes query-level changes. `better-sqlite3` is the fallback because it's the most battle-tested Node.js SQLite binding and its synchronous API maps cleanly to the existing async usage pattern (wrap in `Promise.resolve()`).

### 6. Dual-runtime test strategy via CI matrix

**Decision:** During Phases 2–4, CI runs the test suite on both Deno and Node.js via a matrix build. Phase 5 removes the Deno leg.

**Rationale:** This is the safety net that catches adapter divergences. Without it, "works on Node.js" is unverified until cutover. Alternative considered: testing only on Node.js after Phase 2 — rejected because it silently breaks Deno before the cutover is ready.

## Risks / Trade-offs

- **Adapter divergence** → CI matrix runs both runtimes through Phase 4; any behavioral difference fails the build
- **`Deno.serve` WebSocket semantics differ from Node's** → Hono's WebSocket abstraction normalizes this; test WS upgrade in both adapters early (Phase 2)
- **`@db/sqlite` npm compatibility unknown** → Spike this in Phase 2 before committing to the adapter; `better-sqlite3` fallback is well-understood
- **Fresh migration breaks dashboard features** → Migrate the dashboard last (Phase 4) when the runtime abstraction is proven; keep Fresh working on Deno until Hono parity is verified
- **Test files use `Deno.Command` directly** → Test helpers (`harness-process.ts`, `git.test.ts` setup) migrate to the abstraction alongside src code in Phase 1; this is mechanical
- **`deno.json` import map conflicts with `package.json`** → During transition, maintain both; Phase 5 removes `deno.json`. Use `npm:` prefix in `deno.json` for packages that exist on both registries

## Migration Plan

**Phase 1 — Runtime abstraction (no behavior change):**
Create `src/runtime/` with interfaces and Deno adapter. Migrate all `Deno.*` call sites in `src/` to use the abstraction. Tests still run on Deno. Ship as a normal PR.

**Phase 2 — Node.js adapter:**
Implement Node.js adapter. Add `package.json`, configure TypeScript for Node.js compilation. Run test suite on both runtimes via CI matrix. Fix adapter divergences.

**Phase 3 — Tooling:**
Add Vitest, ESLint + Prettier, `tsc` config. Run alongside Deno tools initially. Verify equivalent output. Remove `deno task` scripts for lint/fmt/check/test.

**Phase 4 — Web UI:**
Migrate Fresh dashboard to Hono. Verify embedded and standalone modes on both runtimes.

**Phase 5 — Cutover:**
Remove Deno adapter, `deno.json`, JSR imports. Update CI to Node.js-only. Update README, contributing guide, docs. Remove Deno permission flags from CI scripts.

**Rollback:** Each phase is a separate PR. If a phase fails validation, revert that PR. Phases 1–4 leave Deno fully functional; the cutover in Phase 5 is the only point of no return.
