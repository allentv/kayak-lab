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

## Tool Calling

- **Dual-protocol dispatch:** AgentRuntime checks `newToolRegistry` first for structured tools, then falls back to legacy `toolRegistry` — enables incremental migration without breaking existing tools
- **JSON Schema validation:** `ToolDefinition` validates tool parameters against JSON Schema before execution — catch bad inputs at definition time, not runtime
- **Tool authoring lifecycle:** Propose → Review → Accept/Reject → Register. `ToolAuthoring` handles the full flow; rejected proposals get a reason for feedback
- **Self-improvement deduplication:** `ToolSelfImprovement` tracks usage patterns and deduplicates suggestions — same improvement is not proposed twice for the same tool
- **ToolHandlerContext:** Provides tool authors with a standardized context (tool name, parameters, call ID) without requiring direct dependency on the event system
- **Enable/disable lifecycle:** `ToolRegistry` supports runtime enable/disable of tools — useful for feature flags, A/B testing, and safe rollouts

## Memory Subsystem Patterns

- 4 memory types serve different retention needs: episodic for event logs, semantic for learned facts, procedural for patterns, working for active context
- Provider abstraction decouples storage from logic — swap backends without changing consumers
- SharedMemory enables sub-agents to share context snapshots without coupling to parent state
- MemoryUpdate handles atomic state transitions with event sourcing

## MCP Integration Patterns

- Transport abstraction allows switching between stdio, SSE, and custom transports
- MCPRegistry manages server lifecycle and tool discovery
- Event wiring connects MCP events to the main event stream

## Configuration Management Patterns

- ConfigWatcher uses debounced file watching to prevent reload storms
- Validation-on-reload ensures bad configs don't replace working ones
- Previous config retention on failure enables automatic rollback

## Capabilities

- Abstract interfaces enable testing with mocks
- Typed parameters and results prevent runtime errors
- Safety constraints (timeouts, output limits) are mandatory for shell execution
- Shell capability has dual-layer safety: `BLOCKED_COMMANDS` always rejected; `DANGEROUS_COMMANDS` return 'requires approval'

## Review CLI Patterns

- **Convention-based auto-discovery:** Checks and delegates are discovered by scanning `review/checks/` and `review/delegate/` for `.ts` files exporting a default `ReviewCheck` — no manual registration or wiring needed
- **Checks vs delegates separation:** Checks analyze pre-computed `ReviewContext` (file metadata, test pairing, dependency graph); delegates spawn external tools (deno-lint, knip, madge) and parse their output into `Finding[]`
- **Context pre-computation:** `buildContext()` reads every source file once and builds `FileEntry` maps (exports, imports, lines, test pairing) — checks consume this without re-reading files
- **Graceful degradation:** Delegate checks catch tool-not-found errors and skip silently — optional tools (knip, madge) don't block the review if uninstalled
- **Priority/confidence model:** Findings use `priority` (1=critical, 2=important, 3=minor) for filtering and `confidence` (0-1) for reliability — `--fail-on` thresholds act on priority only
- **Preflight gate:** Built-in preflight checks (format, lint, type-check) run before custom checks unless skipped with `--skip preflight` — ensures basic hygiene before deeper analysis
- **Single shared formatter:** `formatFindings()` groups findings by file, sorts by priority, and renders ANSI-colored output — all checks produce the same `Finding` schema so formatting is centralized

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

## Review CLI Patterns

- **Auto-discovery over registration:** Checks and delegates are discovered by scanning directories at startup — no central config file, no manual wiring. Drop a file, it runs.
- **Single-pass context building:** `buildContext()` scans `src/` once before any check runs — no file is read more than once. Checks consume the shared `ReviewContext` without redundant I/O.
- **Graceful degradation:** Delegates catch errors and skip silently if external tools (knip, madge) aren't installed. Custom checks always run.
- **Priority levels:** 1 = critical (blocks CI), 2 = warning (should fix), 3 = info (nice to have). `--fail-on` threshold maps directly to priority numbers.
- **Preflight gate:** Runs `deno lint`, `deno check`, `deno test` before checks — catches basic failures before deeper analysis. Skip with `--skip preflight`.
- **Convention over configuration:** Check files export a default `ReviewCheck` object. Registry uses `import()` dynamic imports — no barrel files, no explicit imports.

## Git Hooks

- Pre-push hooks are better than pre-commit for `deno check` + `deno lint` — avoids slowing down WIP commits
- Hook runs `deno task check` then `deno lint` sequentially — first failure blocks push
- Can be bypassed with `git push --no-verify` — acceptable for emergencies

## Testing Patterns

- `Deno.test` with async `t.step` for nested test organization
- Mock providers implement `IModelProvider` with configurable responses and failure flags
- Test context objects (`CapabilityContext`, `ToolHandlerContext`) provide minimal required fields — `ToolHandlerContext` from `src/tools/types.ts` is the structured equivalent of the legacy `ToolContext`

## Sandbox Execution

- gVisor (`runsc`) provides Level 3 isolation (userspace kernel) vs Docker's Level 1-2 (shared kernel)
- gVisor setup requires: `apt install runsc`, `runsc install`, `systemctl restart docker`
- Ubuntu's default `runsc` package may be outdated — use Google's official gVisor repo for latest
- gVisor I/O overhead is ~18% for Deno workloads — well under the 30% threshold
- `--network=none` is essential for untrusted code — prevents DNS exfiltration and network-based attacks
- `--cap-drop=ALL` drops all Linux capabilities — stronger than Docker's default reduced set
- `--user=65532:65532` runs as `nobody` — avoids root execution inside container
- `--pids-limit=128` prevents fork bomb DoS attacks
- `--tmpfs /tmp:rw,nosuid,nodev,size=64m` needed for Deno JIT — `noexec` breaks dynamic code execution
- Deno permission flags (`--deny-net --deny-env --deny-run --deny-ffi`) provide defense-in-depth inside sandbox
- `ISandboxRuntime` interface enables swapping between Docker and gVisor without caller changes
- Health check verifies: Docker installed, daemon running, runtime registered, test execution, network isolation, ptrace blocking (gVisor)
- File transfer via read-only bind mounts for input, tmpfs for output — zero-copy, automatically cleaned up
- `SandboxedShellCapability` implements `IShellCapability` — drop-in replacement for trusted shell execution

## SQLite Patterns

- WAL mode enabled by default — allows concurrent reads while writing
- `StorageBackend` type includes "sqlite" — use this for new code (not "duckdb")
- SQLitePersistenceBackend implements both IPersistenceBackend and IMemoryStorage — single class for dual interface
- SQLite schema uses foreign keys and autoincrement IDs — same table structure as DuckDB for migration compatibility

## Provenance Context Patterns

- ProvenanceContextManager extends ContextManager — drop-in replacement with provenance weighting
- Token budget defaults: 25% goal, 15% summary, 40% history, 20% memories
- Tool result compression threshold: 2000 tokens — above this, results are compressed with references
- Provenance weight default: 0.3 — controls how much provenance score affects memory ranking
- MessageClassifier is pure — no I/O, no side effects, holds reference to graph but doesn't own it
- First-match-wins classification: messages classified by first matching rule, not best match

## Hook System Patterns

- HookRegistry isolates hook errors — one failing hook doesn't block others
- hookRegistry is a global singleton — import and use directly
- HookPoint enum covers all lifecycle stages: BEFORE_MODEL_CALL, AFTER_TOOL_EXECUTION, TURN_END, SESSION_START, SESSION_END
- Hooks can be sync or async — HookFunction type accepts both
- Timeout support built-in — prevents slow hooks from blocking the runtime

## Attestation Patterns

- AttestationService.loadPricing() configures per-model cost — must be called before createAttestation()
- session.attestation emitted on session completion — includes full cost breakdown and provenance summary
- AttestationEvent.previous_attestation links resumed sessions — enables cost accumulation across pauses
- ProvenanceSummary tracks exploration-to-commitment ratio — higher ratio indicates more exploration before committing
