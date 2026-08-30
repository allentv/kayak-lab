## ADDED Requirements

### REQ-LINT-01: Deno lint configuration

The project MUST configure `deno lint` rules in `deno.json` to suppress rules that don't apply to the codebase.

**Acceptance Criteria:**
- `require-await` is excluded: stubbed capability implementations must match async interface contracts
- `no-explicit-any` is excluded: non-standard APIs (e.g., `performance.memory`) require `any` casts
- `deno lint` passes with zero errors after configuration

### REQ-LINT-02: Test files use bare specifiers

All test files MUST import `@std/assert` via the bare specifier defined in `deno.json`, not inline `https://deno.land` URLs.

**Acceptance Criteria:**
- No `https://deno.land` imports remain in `src/**/__tests__/`
- `deno lint` reports zero `no-import-prefix` errors
