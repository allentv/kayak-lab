# src/capabilities/__tests__/search.test.ts

Test suite that validates the SearchCapability's grep and glob functionality by creating a temporary git project and running comprehensive search scenarios.

- createTempProject · function · L7-L26 — Creates a temporary git repository with a structured set of test files (including TypeScript source, documentation, generated content, and hidden files) to provide a consistent test environment for search operations.
- assertSearchBehavior · function · L29-L94 — Comprehensive test function that validates all search specification scenarios including basic regex matching, case sensitivity, file/directory filtering, glob patterns, hidden file handling, and gitignore behavior.
