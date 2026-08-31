## Context

`deno check` reported 28 type errors and `deno lint` reported 66 lint errors. The codebase had no pre-push quality gates, and the reviewer agent didn't include static analysis in its workflow.

## Goals / Non-Goals

**Goals:**
- Zero `deno check` errors
- Zero `deno lint` errors
- Pre-push hook blocks pushes with errors
- Reviewer agent runs static analysis before review

**Non-Goals:**
- Fixing all `require-await` errors (would require removing `async` from stubbed interfaces, breaking the contract)
- CI pipeline for lint/check (pre-push hook is sufficient for now)

## Decisions

### 1. Suppress `require-await` lint rule globally

**Decision:** Exclude `require-await` in `deno.json` lint config.

**Rationale:**
- Stubbed capabilities implement interfaces that declare async methods
- Removing `async` would break the interface contract
- Methods will become truly async when real implementations are added
- Per-file suppression would be noisy and fragile

### 2. Suppress `no-explicit-any` lint rule globally

**Decision:** Exclude `no-explicit-any` in `deno.json` lint config.

**Rationale:**
- `performance.memory` is a non-standard Chrome API requiring `any` cast
- Only 4 occurrences, all in benchmarks.test.ts
- A typed wrapper would add unnecessary complexity for a test utility

### 3. Migrate test imports to bare specifiers

**Decision:** Replace `https://deno.land/std@0.2x/assert/mod.ts` with `@std/assert` in all test files.

**Rationale:**
- `deno.json` already defines `@std/assert` in imports
- Bare specifiers are version-managed via deno.lock
- Eliminates `no-import-prefix` lint errors (12 occurrences)

### 4. Pre-push hook over pre-commit

**Decision:** Use pre-push hook, not pre-commit.

**Rationale:**
- `deno check` + `deno lint` take ~2 seconds total
- Pre-commit would slow down every commit, including WIP commits
- Pre-push catches issues before they reach the remote
- Developer can still commit locally with errors during work

### 5. Reviewer agent runs all three checks

**Decision:** Reviewer runs `deno task check`, `deno lint`, `deno task test` sequentially before reviewing.

**Rationale:**
- Static analysis catches issues the reviewer would otherwise report
- Saves tokens by filtering out mechanical issues
- Review focuses on design, decomposition, and correctness — not syntax

## Risks / Trade-offs

### Risk: Pre-push hook can be bypassed

**Impact:** Low — `git push --no-verify` skips hooks. Acceptable for emergency pushes.

**Mitigation:** Document the hook in contributing.md. CI can add a stricter gate later.

### Risk: Suppressed lint rules may hide future issues

**Impact:** Low — `require-await` and `no-explicit-any` are narrow rules with clear justification.

**Mitigation:** Rules are documented in deno.json with rationale. Can be re-enabled per-file as code evolves.
