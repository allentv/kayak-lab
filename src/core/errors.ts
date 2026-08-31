/**
 * Standardized error taxonomy for the kayak-lab platform.
 *
 * All application errors extend AppError with structured metadata
 * for programmatic handling: retry decisions, circuit breaking, and logging.
 */

// ============================================================================
// Error Codes
// ============================================================================

export const ErrorCodes = {
  VALIDATION: "VALIDATION",
  AUTHENTICATION: "AUTHENTICATION",
  AUTHORIZATION: "AUTHORIZATION",
  NOT_FOUND: "NOT_FOUND",
  TIMEOUT: "TIMEOUT",
  RATE_LIMIT: "RATE_LIMIT",
  EXTERNAL_SERVICE: "EXTERNAL_SERVICE",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ============================================================================
// Base Error
// ============================================================================

/**
 * Base application error with structured metadata.
 *
 * @param code - Machine-readable error code for programmatic handling
 * @param module - Source module (e.g. "git", "github", "k8s", "shell")
 * @param operation - Operation that failed (e.g. "clone", "commit", "apply")
 * @param retryable - Whether the operation can be retried
 * @param context - Additional context for debugging
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly module: string = "unknown",
    public readonly operation: string = "unknown",
    public readonly retryable: boolean = false,
    public readonly context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ============================================================================
// Error Subclasses
// ============================================================================

/**
 * Validation error — invalid input or schema mismatch.
 * Not retryable without input correction.
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    module: string = "unknown",
    operation: string = "unknown",
    context: Record<string, unknown> = {},
  ) {
    super(message, ErrorCodes.VALIDATION, module, operation, false, context);
    this.name = "ValidationError";
  }
}

/**
 * Authentication error — missing or invalid credentials.
 * Not retryable without credential fix.
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string,
    module: string = "unknown",
    operation: string = "unknown",
    context: Record<string, unknown> = {},
  ) {
    super(message, ErrorCodes.AUTHENTICATION, module, operation, false, context);
    this.name = "AuthenticationError";
  }
}

/**
 * Authorization error — insufficient permissions.
 * Not retryable without permission change.
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string,
    module: string = "unknown",
    operation: string = "unknown",
    context: Record<string, unknown> = {},
  ) {
    super(message, ErrorCodes.AUTHORIZATION, module, operation, false, context);
    this.name = "AuthorizationError";
  }
}

/**
 * Not found error — resource does not exist.
 * Not retryable unless resource may be created.
 */
export class NotFoundError extends AppError {
  constructor(
    message: string,
    module: string = "unknown",
    operation: string = "unknown",
    context: Record<string, unknown> = {},
  ) {
    super(message, ErrorCodes.NOT_FOUND, module, operation, false, context);
    this.name = "NotFoundError";
  }
}

/**
 * Timeout error — operation exceeded time limit.
 * Retryable — transient condition.
 */
export class TimeoutError extends AppError {
  constructor(
    message: string,
    module: string = "unknown",
    operation: string = "unknown",
    context: Record<string, unknown> = {},
  ) {
    super(message, ErrorCodes.TIMEOUT, module, operation, true, context);
    this.name = "TimeoutError";
  }
}

/**
 * Rate limit error — too many requests.
 * Retryable after delay.
 */
export class RateLimitError extends AppError {
  constructor(
    message: string,
    module: string = "unknown",
    operation: string = "unknown",
    public readonly retryAfterMs?: number,
    context: Record<string, unknown> = {},
  ) {
    super(message, ErrorCodes.RATE_LIMIT, module, operation, true, {
      retryAfterMs,
      ...context,
    });
    this.name = "RateLimitError";
  }
}

/**
 * External service error — third-party service failure.
 * Retryable — transient condition.
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string,
    module: string = "unknown",
    operation: string = "unknown",
    public readonly statusCode?: number,
    context: Record<string, unknown> = {},
  ) {
    super(message, ErrorCodes.EXTERNAL_SERVICE, module, operation, true, {
      statusCode,
      ...context,
    });
    this.name = "ExternalServiceError";
  }
}

/**
 * Internal error — unexpected failure within the system.
 * Retryable — may be transient.
 */
export class InternalError extends AppError {
  constructor(
    message: string,
    module: string = "unknown",
    operation: string = "unknown",
    cause?: Error,
    context: Record<string, unknown> = {},
  ) {
    super(message, ErrorCodes.INTERNAL, module, operation, true, context);
    this.name = "InternalError";
    if (cause) {
      this.cause = cause;
    }
  }
}
