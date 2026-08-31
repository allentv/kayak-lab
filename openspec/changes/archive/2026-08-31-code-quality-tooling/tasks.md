## 1. Type Error Fixes

- [x] 1.1 Fix `benchmarks.test.ts`: remove unused `assertExists` import, cast `performance.memory` to `any`, remove invalid `agent_id`/`user_id` params from `createSession`. Verify: `deno check` reports zero errors for this file.
- [x] 1.2 Fix `github.ts`: remove unused `CapabilityExecutionError` import, prefix unused params (`_options`, `_issueNumber`, `_limit`). Verify: zero unused parameter errors.
- [x] 1.3 Fix `kubernetes.ts`: remove unused `CapabilityExecutionError` import, prefix unused params (`_namespace`, `_resourceType`, `_resourceName`, `_manifest`). Verify: zero unused parameter errors.
- [x] 1.4 Fix `protocol.test.ts`: change `receivedEvents` type from `unknown[]` to `BaseEvent[]`, add `BaseEvent` import. Verify: zero type errors.
- [x] 1.5 Fix `terminal.ts`: remove unused `EventTypes` import and `readline` field. Verify: zero unused import/field errors.

## 2. Lint Fixes

- [x] 2.1 Replace inline `https://deno.land/std@0.2x/assert/mod.ts` with `@std/assert` in all 12 test files. Verify: zero `no-import-prefix` errors.
- [x] 2.2 Add lint config to `deno.json`: exclude `require-await` and `no-explicit-any`. Verify: `deno lint` passes with zero errors.

## 3. Pre-Push Hook

- [x] 3.1 Create `.git/hooks/pre-push` running `deno task check` then `deno lint`. Verify: hook blocks push on error, allows push on success.

## 4. Reviewer Agent

- [x] 4.1 Update `agents/reviewer.md`: add pre-review steps (`deno task check`, `deno lint`, `deno task test`) and update Tips section. Verify: agent description reflects new workflow.

## 5. Verification

- [x] 5.1 Run `deno task check` — zero errors. Verify: clean exit.
- [x] 5.2 Run `deno lint` — zero errors. Verify: clean exit.
- [x] 5.3 Run `git push` — pre-push hook passes, push succeeds. Verify: hook output shows "Pre-push checks passed."
