## 1. Foundation

- [ ] 1.1 Define shared types: `Finding`, `ReviewCheck`, `ReviewContext` in `review/types.ts`. Verify: file compiles with `deno check review/types.ts`
- [ ] 1.2 Implement `ReviewContext` builder: scan `src/**/*.ts`, compute line counts, source→test mapping, export/import lists. Verify: unit test in `review/__tests__/context.test.ts`
- [ ] 1.3 Implement check registry: scan `review/checks/`, import modules, collect `ReviewCheck[]`. Verify: unit test confirming auto-discovery of a stub check

## 2. Tool Delegation

- [ ] 2.1 Implement `deno lint` parser: spawn subprocess, parse stdout into `Finding[]`. Verify: test with a file containing a known lint issue
- [ ] 2.2 Implement `deno check` parser: spawn subprocess, parse stdout into `Finding[]`. Verify: test with a file containing a known type error
- [ ] 2.3 Implement `knip` integration: spawn `npx knip --reporter json`, parse output into `Finding[]`. Graceful skip if knip not installed. Verify: test with a file containing an unused export
- [ ] 2.4 Implement `madge` integration: spawn `npx madge --circular --json src/`, parse output into `Finding[]`. Graceful skip if madge not installed. Verify: test detecting a circular import

## 3. Custom Checks

- [ ] 3.1 Implement `file-size` check: flag files exceeding threshold (default 400 lines). Verify: test with a 401-line file produces a finding, 400-line file does not
- [ ] 3.2 Implement `test-pairing` check: flag source files with no matching `__tests__/*.test.ts`. Verify: test with a source file lacking a test produces a finding
- [ ] 3.3 Implement `reexports` check: compare `mod.ts` exports against sibling file exports. Verify: test with a missing re-export produces a finding

## 4. CLI Entrypoint

- [ ] 4.1 Implement `review/cli.ts`: parse `--only`, `--skip`, `--fail-on` flags, run preflight (deno lint/check/test), fan out checks via `Promise.all`, collect findings. Verify: `deno task review` runs end-to-end with output
- [ ] 4.2 Implement output formatter: group findings by file, print priority labels, summary line with counts. Verify: output matches expected format in a smoke test
- [ ] 4.3 Implement CI exit code: exit 1 when findings meet `--fail-on` threshold. Verify: `--fail-on 1` exits non-zero when a priority-1 finding exists

## 5. Integration

- [ ] 5.1 Add `deno task review` to `deno.json`. Verify: `deno task review` invokes the CLI
- [ ] 5.2 Update `agents/reviewer.md` to document the CLI and how findings feed into LLM review. Verify: reviewer agent can reference the CLI output schema
