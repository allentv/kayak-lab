# review/registry.ts · [[code-review-system]] [[pluggable-check-architecture]]

A registry module that discovers and loads review checks and delegate parsers from designated directories for code review automation.

- loadChecks · function · L7-L23 — Scans a directory for TypeScript files implementing ReviewCheck interfaces to dynamically load code review validation rules.
- loadDelegates · function · L29-L45 — Discovers and loads delegate parser modules that can analyze code and return findings for automated review delegation.
