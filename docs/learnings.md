# Learnings

This file captures patterns, decisions, and gotchas discovered during kayak-lab development. Agents reference this automatically via config.yaml context.

---

## OpenSpec

- Schema: `spec-driven` (proposal → specs → design → tasks)
- Delta specs must use `## ADDED/MODIFIED/REMOVED/RENAMED Requirements` headers
- Each requirement must include at least one `#### Scenario:` block
- `openspec validate <change-name>` validates all artifacts
- `openspec instructions apply --change <name> --json` returns context files and progress
- Tasks tracked via checkboxes: `- [ ]` pending, `- [x]` complete
- Archive requires all artifacts done and all tasks complete (or user confirmation)

## Event Sourcing

- Events are immutable and append-only
- Sequence numbers must be monotonically increasing (no gaps)
- Session isolation: events from session A never appear in session B
- Schema versioning is critical for forward compatibility
- Persistence layer implemented: JSONL append-only logs, snapshot persistence, startup recovery via `PersistentEventStore`
- `IPersistenceBackend` interface enables pluggable backends (file, SQLite, etc.) without changing callers
- `FilePersistenceBackend` uses synchronous Deno I/O — guaranteed durability per write, no buffering needed
- `EventStream.append()` takes a single `AppendEventInput` object — not separate session_id + event args
- Sequence numbers start at 1, not 0 — `getCurrentSequence()` returns 0 for new sessions; next = `getCurrentSequence() + 1`
- Event types use dot notation with `ui.` prefix for user input: `ui.user.input`, not `user.input`
- Event arrays are frozen after retrieval — `getEvents()` returns `Object.freeze([...events])`
- `EventStoreBridge.connect()` performs one-shot backfill but does not subscribe to new events — known gap

## Agent Runtime

- Provider abstraction must hide streaming differences (Anthropic vs OpenAI delta formats)
- Context window management requires truncation/summarization strategy
- Tool invocation needs timeout and error handling at the abstraction layer
- AgentRuntime has hard-coded 10-iteration safety limit — not configurable via AgentConfig
- `AgentRuntime.appendEvent()` casts event type with `as any` — should accept `EventType` instead of `string`

## Interface Design

- `ISessionManager` uses compound method names (`createSession()`, `pauseSession()`) to avoid ambiguity when composed with other interfaces
- Session manager returns immutable clones via `cloneSession()` — never store a returned Session reference
- `CapabilityResult<T>` wraps success/data/error pattern — only `ensureInitialized()` throws

## Capabilities

- Abstract interfaces enable testing with mocks
- Typed parameters and results prevent runtime errors
- Safety constraints (timeouts, output limits) are mandatory for shell execution
- Shell capability has dual-layer safety: `BLOCKED_COMMANDS` always rejected; `DANGEROUS_COMMANDS` return 'requires approval'

## Deno / TypeScript Patterns

- Deno.Command requires `--allow-run` permission — shell capability tests fail without it
- Error class `cause` property needs `override` keyword in strict mode: `override readonly cause?: Error`
- Generic type params cause assignability issues in test callbacks — use `unknown` and cast inside handler
- `mod.ts` barrel files separate type exports from value exports for tree-shaking
- Custom error assertion: use manual try/catch when verifying specific error properties (e.g., `error.name`)
- `deno check src/**/*.ts` catches type errors; add it to pre-push hooks for early detection
- `deno lint` catches unused imports/params, inline URLs, and async-without-await — configure rule exclusions in `deno.json` for stubbed implementations
- Test files should use bare specifiers (`@std/assert`) not inline `https://deno.land` URLs — avoids `no-import-prefix` lint errors
- `require-await` lint rule fires on stubbed async methods that implement async interfaces — suppress globally rather than removing `async` (would break interface contract)
- `no-explicit-any` fires on `performance.memory` casts — suppress globally or use typed wrapper for non-standard APIs

## VitePress / Documentation

- `markdown.mermaid: true` alone marks code blocks for rendering but doesn't render them — you need `vitepress-plugin-mermaid` as a direct dependency
- `withMermaid(config, mermaidConfig)` takes mermaid options as second argument — nesting inside `defineConfig` causes TS errors because `mermaid` isn't part of VitePress's `UserConfig` type
- VitePress 1.6.x pins Vite to 5.4.x and esbuild to 0.21.x — overriding these for security patches breaks the build (Rolldown incompatibility, destructuring transform errors). Wait for VitePress 2.0.
- GitHub Actions `actions/checkout@v4`, `upload-pages-artifact@v3`, `deploy-pages@v4` use Node 20 (deprecated) — update to v5+ for Node 24 compatibility
- `pnpm/action-setup@v4` → `v6` for latest Node 24 support

## Git Hooks

- Pre-push hooks are better than pre-commit for `deno check` + `deno lint` — avoids slowing down WIP commits
- Hook runs `deno task check` then `deno lint` sequentially — first failure blocks push
- Can be bypassed with `git push --no-verify` — acceptable for emergencies

## Testing Patterns

- `Deno.test` with async `t.step` for nested test organization
- Mock providers implement `IModelProvider` with configurable responses and failure flags
- Test context objects (`CapabilityContext`, `ToolContext`) provide minimal required fields
