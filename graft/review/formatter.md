# review/formatter.ts · [[code-review-system]]

This module formats security findings for console output with color-coded priorities and grouped by file, ensuring critical issues are always shown while limiting warnings to prevent overwhelming the user.

- formatFindings · function · L15-L77 — Groups findings by file, displays all critical issues and up to 50 warnings per run, and provides a color-coded summary of findings by priority level.
