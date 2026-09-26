# review/delegate/madge.ts · [[review-delegates]]

A review check that delegates to madge for detecting circular dependencies in the codebase, gracefully skipping if madge is not installed.

- run · method · L10-L42 — Executes madge to find circular dependencies and converts each cycle into a finding with the first file as the location.
