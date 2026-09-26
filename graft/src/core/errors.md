# src/core/errors.ts · [[structured-error-taxonomy]]

Standardized error taxonomy for the kayak-lab platform providing structured metadata for programmatic error handling, retry decisions, circuit breaking, and logging.

- ErrorCode · type · L23-L23 — Union type representing all possible machine-readable error codes for programmatic error handling across the application.
- AppError · class · L38-L50 — Base application error class that provides structured metadata for programmatic error handling including error codes, module context, operation tracking, retryability, and debugging context.
- constructor · method · L39-L49 — Constructs the base application error with all structured metadata fields for programmatic error handling.
- ValidationError · class · L60-L70 — Error for invalid input or schema mismatches that cannot be retried without correcting the input.
- constructor · method · L61-L69 — Creates a validation error with the appropriate error code and non-retryable flag.
- AuthenticationError · class · L76-L86 — Error for missing or invalid credentials that cannot be retried without fixing credentials.
- constructor · method · L77-L85 — Creates an authentication error with the appropriate error code and non-retryable flag.
- AuthorizationError · class · L92-L102 — Error for insufficient permissions that cannot be retried without permission changes.
- constructor · method · L93-L101 — Creates an authorization error with the appropriate error code and non-retryable flag.
- NotFoundError · class · L108-L118 — Error for resources that do not exist, which cannot be retried unless the resource might be created.
- constructor · method · L109-L117 — Creates a not-found error with the appropriate error code and non-retryable flag.
- TimeoutError · class · L124-L134 — Error for operations that exceeded time limits, which is retryable as a transient condition.
- constructor · method · L125-L133 — Creates a timeout error with the appropriate error code and retryable flag set to true.
- RateLimitError · class · L140-L154 — Error for too many requests that is retryable after a delay, optionally including retry timing information.
- constructor · method · L141-L153 — Creates a rate limit error with retry timing metadata and the appropriate error code.
- ExternalServiceError · class · L160-L174 — Error for third-party service failures that is retryable as a transient condition, optionally including HTTP status codes.
- constructor · method · L161-L173 — Creates an external service error with optional status code metadata and the appropriate error code.
- InternalError · class · L180-L194 — Error for unexpected system failures that is retryable as potentially transient, optionally including the underlying cause.
- constructor · method · L181-L193 — Creates an internal error with optional cause tracking and the appropriate error code.
