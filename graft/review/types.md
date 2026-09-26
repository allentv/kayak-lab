# review/types.ts · [[code-review-system]] [[finding-types]]

This file defines the core data structures for a code review system, including findings, checks, file metadata, and shared context.

- Finding · interface · L2-L10 — Represents a single issue detected during code review, capturing its description, priority, confidence, and location in the codebase.
- ReviewCheck · interface · L13-L17 — Defines a modular review rule that analyzes code context to produce findings, enabling extensible code quality checks.
- FileEntry · interface · L20-L26 — Stores pre-computed metadata about a source file to avoid repeated parsing and provide efficient access for review checks.
- ReviewContext · interface · L29-L35 — Provides shared pre-computed data across all review checks, including file contents, test mappings, and dependency graphs.
