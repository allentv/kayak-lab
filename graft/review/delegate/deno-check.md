# review/delegate/deno-check.ts · [[review-delegates]]

A review check that delegates to `deno check` to surface TypeScript type errors as findings in the codebase.

- run · method · L9-L47 — Executes the deno check command, parses its stderr for file:line error patterns, and converts them into findings with appropriate priority levels.
