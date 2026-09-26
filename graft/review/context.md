# review/context.ts · [[code-review-system]]

This module provides utilities for scanning a TypeScript source directory and building a review context that maps source files to their tests and tracks import dependencies.

- buildContext · function · L5-L65 — Scans a source directory recursively to collect all TypeScript files, reads their contents, extracts exports and imports, and builds a mapping between source files and their corresponding test files.
- extractExports · function · L68-L95 — Parses TypeScript/JavaScript source code to extract all exported symbol names including functions, constants, classes, types, interfaces, enums, and default exports.
- extractImports · function · L98-L107 — Extracts module import paths from TypeScript/JavaScript source code by scanning for both static import statements and dynamic import() expressions.
