## Why

`deno check` had 28 type errors and `deno lint` had 66 lint errors across the codebase. No pre-push checks existed — broken code could be pushed to `main` without detection. The reviewer agent didn't include static analysis in its workflow.

## What Changes

- **Type error fixes**: 28 errors across 5 files (unused imports, unused params, type casts, invalid properties)
- **Lint error fixes**: 66 errors resolved — test files migrated from inline `https://deno.land` URLs to `@std/assert` bare specifier
- **Lint configuration**: `deno.json` lint rules exclude `require-await` (stubbed async interfaces) and `no-explicit-any` (non-standard APIs)
- **Pre-push hook**: Git hook runs `deno task check` + `deno lint` before every push
- **Reviewer agent**: Updated to run `deno task check`, `deno lint`, `deno task test` before code review

### Modified Capabilities

- `core/agent-runtime`: Type error fixes (unused imports, type casts)
- `capabilities/git`, `capabilities/github`, `capabilities/kubernetes`: Removed unused imports, prefixed unused params
- `projection/terminal`: Removed unused imports and fields
- `projection/protocol` tests: Fixed `unknown[]` to `BaseEvent[]` typing

## Capabilities

### New Capabilities

None

### Modified Capabilities

- `tooling/lint-config`: deno.json lint rule configuration
- `tooling/pre-push`: Git pre-push hook for deno check + deno lint
- `agents/reviewer`: Added pre-review static analysis steps
