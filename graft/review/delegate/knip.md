# review/delegate/knip.ts · [[review-delegates]]

Delegates to knip for detecting unused exports, files, and dependencies in the codebase, gracefully handling missing installations.

- run · method · L10-L70 — Executes knip via npx, parses its JSON report, and converts findings about unused files, exports, and unlisted dependencies into the review system's format.
