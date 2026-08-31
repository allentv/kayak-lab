## Purpose

Standardized error handling, retry policies, and circuit breaker patterns for resilient agent operations across all capabilities and runtime components.

## ADDED Requirements

### Requirement: Error taxonomy

The system MUST define a standardized error hierarchy with error codes.

#### Scenario: Error types
- **WHEN** an error occurs in any module
- **THEN** it is classified as one of: `ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `TimeoutError`, `RateLimitError`, `ExternalServiceError`, `InternalError`

#### Scenario: Error codes
- **WHEN** an error is created
- **THEN** it includes a machine-readable error code (e.g., `GIT_AUTH_FAILED`, `GITHUB_RATE_LIMITED`)

#### Scenario: Error context
- **WHEN** an error is created
- **THEN** it includes context: module name, operation, timestamp, and optional retry hint

### Requirement: Retry policies

Transient failures MUST be retryable with configurable policies.

#### Scenario: Default retry
- **WHEN** a transient failure occurs (timeout, rate limit, network error)
- **THEN** the operation is retried up to 3 times with exponential backoff (1s, 2s, 4s)

#### Scenario: Custom retry policy
- **WHEN** a capability defines a custom retry policy
- **THEN** that policy overrides the default (max retries, backoff, jitter)

#### Scenario: Non-retryable error
- **WHEN** a non-transient error occurs (auth failure, validation error)
- **THEN** the operation is NOT retried and the error is propagated immediately

### Requirement: Circuit breaker

The system MUST prevent cascading failures via circuit breaker pattern.

#### Scenario: Circuit opens
- **WHEN** a capability fails 5 times in 60 seconds
- **THEN** the circuit opens and subsequent calls fail fast with `CircuitOpenError`

#### Scenario: Circuit half-open
- **WHEN** the circuit has been open for 30 seconds
- **THEN** one test call is allowed through; if it succeeds, circuit closes; if it fails, circuit re-opens

#### Scenario: Circuit closes
- **WHEN** the test call in half-open state succeeds
- **THEN** the circuit closes and normal operation resumes

### Requirement: Graceful degradation

Capabilities MUST define fallback behaviors when unavailable.

#### Scenario: Fallback defined
- **WHEN** a capability has a defined fallback
- **THEN** the fallback is executed when the capability fails or circuit is open

#### Scenario: No fallback
- **WHEN** a capability has no fallback defined
- **THEN** the error is propagated to the agent runtime for handling

#### Scenario: Fallback failure
- **WHEN** the fallback itself fails
- **THEN** the original error and fallback error are both reported
