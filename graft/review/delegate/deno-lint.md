# review/delegate/deno-lint.ts · [[review-delegates]]

A review check that runs deno lint to surface code quality warnings as findings for code review.

- run · method · L9-L45 — Executes deno lint with JSON output, parses diagnostics, and converts them into finding objects with location and priority metadata.
