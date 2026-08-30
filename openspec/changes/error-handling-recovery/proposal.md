## Why

Error handling is inconsistent across the codebase — capabilities throw different error types, the agent runtime has basic retry logic, and there's no system-wide error taxonomy. Without consistent error handling, failures cascade unpredictably and debugging is difficult.

## What Changes

- **Error taxonomy**: Standardized error types and codes across all modules
- **Retry policies**: Configurable retry with exponential backoff for transient failures
- **Circuit breaker**: Prevent cascading failures by breaking circuits on repeated failures
- **Graceful degradation**: Fallback behaviors when capabilities are unavailable

### New Capabilities

- `core/error-handling`: Standardized error types, retry policies, circuit breaker, degradation
