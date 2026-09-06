## Context

The code reviewer agent (`agents/reviewer.md`) runs `deno task check`, `deno lint`, `deno task test` as preflight, then reads every source file and applies a 5-item checklist via LLM. The checklist includes mechanical checks (file size, unused exports, circular deps) that existing tools already handle. The agent also lacks a CI-gateable output.

The project uses Deno with `deno.json` tasks for lint, fmt, check, and test. No existing tool orchestrates multiple check sources into a unified finding format.

## Goals / Non-Goals

**Goals:**
- Single `kayak review` command that runs all checks and produces unified output
- Plugin architecture: new checks added by dropping a file, no core changes
- Delegate to existing tools (deno lint, deno check, knip, madge) — no reimplementation
- Three custom checks: file-size, test-pairing, re-export coverage
- `--only`, `--skip`, `--fail-on` flags for selective execution and CI gating
- Pre-computed `ReviewContext` shared across checks

**Non-Goals:**
- Auto-fixing findings
- LLM-based review (abstraction quality, correctness) — stays in reviewer agent
- Replacing `deno fmt` or formatting checks
- Web UI or dashboard for findings

## Decisions

### 1. Check registry via filesystem discovery

**Decision:** Checks live in `review/checks/`. Each file exports a default `ReviewCheck` object. The registry scans the directory and loads all modules.

**Why:** Follows ESLint/Biome plugin patterns. Zero wiring cost for new checks. Deno supports dynamic imports for discovery.

**Alternatives considered:**
- Explicit registration in a config file — rejected: adds maintenance overhead, easy to forget
- npm plugin system — rejected: overkill for project-local checks

### 2. Unified Finding schema

**Decision:** All checks produce `Finding[]` with: `title`, `body`, `priority` (1-3), `confidence` (0-1), `file_path`, `line_start`, `line_end`.

**Why:** Matches the existing reviewer agent's output schema. LLM reviewer can consume it directly. CI tools can parse it.

### 3. Tool delegation via subprocess

**Decision:** `deno lint`, `deno check`, `knip`, `madge` are spawned as subprocesses. Their stdout/stderr is parsed into `Finding[]`.

**Why:** Avoids importing tool internals. Tools evolve independently. Subprocess isolation prevents conflicts.

### 4. Pre-computed ReviewContext

**Decision:** Before checks run, scan all `src/**/*.ts` once and build a `ReviewContext` with file metadata, source→test mapping, export/import lists, and dependency graph.

**Why:** Checks share this data. Without pre-computation, each check re-reads files — wasteful for 50+ source files.

### 5. knip and madge as new dependencies

**Decision:** Add `knip` (npm, Deno-compatible via `npx`) and `madge` (npm) as dev dependencies.

**Why:** `knip` is the standard for unused exports/deps. `madge` is the standard for circular dependency detection. Both are mature, well-maintained, and have simple APIs.

**Trade-off:** Adds npm dependencies to a Deno project. Mitigated by using `npx` invocation and keeping them optional (skip if not installed).

### 6. CLI as Deno script

**Decision:** The CLI is a Deno TypeScript script (`review/cli.ts`) invoked via `deno task review` or `deno run -A review/cli.ts`.

**Why:** Stays within the project's Deno toolchain. No separate build step. Can import shared types directly.

## Risks / Trade-offs

- **knip/madge availability:** If not installed, custom tool checks gracefully degrade with a warning. Not a hard failure.
- **Subprocess parsing fragility:** Tool output formats change. Each parser is isolated in its own module — easy to update without touching the registry.
- **Check execution time:** Running all checks including subprocesses could be slow. Mitigated by parallel execution via `Promise.all` and the ability to `--only` specific checks.
