# src/cross-cutting/telemetry/logger.ts · [[cross-cutting-telemetry]]

A structured logger module that provides JSON-formatted logging with level filtering and in-memory storage for observability.

- StructuredLogger · class · L17-L91 — A structured logger class that outputs JSON log entries to stderr while maintaining an in-memory buffer for programmatic access.
- constructor · method · L21-L26 — Initializes the logger with configuration, defaulting to debug level if not specified.
- debug · method · L28-L30 — Logs a debug-level message with optional metadata for detailed troubleshooting.
- info · method · L32-L34 — Logs an info-level message with optional metadata for general operational events.
- warn · method · L36-L38 — Logs a warning-level message with optional metadata for potentially problematic situations.
- error · method · L40-L42 — Logs an error-level message with optional metadata for application failures.
- setSessionId · method · L44-L46 — Associates a session identifier with subsequent log entries for request tracing.
- getEntries · method · L48-L50 — Returns a copy of all stored log entries for programmatic inspection or export.
- clear · method · L52-L54 — Clears the in-memory log buffer, useful for resetting state between test runs.
- log · method · L56-L86 — Core logging implementation that filters by level, formats entries, stores them, and outputs to stderr.
- formatJson · method · L88-L90 — Converts a log entry object to a JSON string for output formatting.
