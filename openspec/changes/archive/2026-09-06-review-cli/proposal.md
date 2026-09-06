## Why

The code reviewer agent currently reads every file blindly and applies the same checklist each time. This is slow, consumes unnecessary context, and misses repeatable mechanical checks that existing tools already handle well. A standalone CLI can pre-filter hotspots, delegate to battle-tested linters, and output a unified finding schema — reducing LLM review time and enabling CI gating.

## What Changes

- New `kayak review` CLI entrypoint that orchestrates existing tools and custom checks
- Check registry pattern: each check is a self-contained module, discoverable and composable
- Delegates to existing tools (`deno lint`, `deno check`, `knip`, `madge`) for mechanical checks — no reimplementation
- Three new custom checks: file-size decomposition, test-file pairing, mod.ts re-export coverage
- Unified `Finding` output schema across all checks, consumable by the LLM reviewer agent
- CLI flags: `--only`, `--skip`, `--fail-on` for selective execution and CI gating
- Pre-computed `ReviewContext` to avoid redundant file I/O across checks

## Capabilities

### New Capabilities

- `review-cli/check-registry`: Plugin-based check discovery and execution framework
- `review-cli/custom-checks`: File-size, test-pairing, and re-export coverage checks
- `review-cli/cli`: CLI entrypoint with flags for filtering and CI gating

### Modified Capabilities

- None — this is additive tooling, no existing behavior changes.

## Out of Scope

- LLM-based review (abstraction quality, correctness judgment) — stays in the reviewer agent
- Formatting fixes — `deno fmt` handles that today
- Auto-fixing findings — this is a reporting tool, not an auto-formatter
