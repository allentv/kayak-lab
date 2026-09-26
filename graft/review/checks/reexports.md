# review/checks/reexports.ts · [[review-checks]]

A review check that ensures mod.ts files properly re-export all public symbols from sibling files in the same directory to maintain a clean public API surface.

- run · method · L6-L42 — Scans all mod.ts files in the codebase and reports any public symbols exported from sibling files that are missing from their corresponding mod.ts re-exports.
