/**
 * Retry policies and wrapper for transient error handling.
 *
 * Provides configurable retry with exponential backoff,
 * jitter, and custom retryable-error detection.
 */

import { AppError } from "./errors.ts";

// ============================================================================
// Retry Policy
// ============================================================================

/**
 * Configuration for retry behavior.
 *
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelayMs - Base delay between retries in milliseconds (default: 1000)
 * @param maxDelayMs - Maximum delay cap in milliseconds (default: 10000)
 * @param jitter - Add random jitter to delay to avoid thundering herd
 * @param retryableFn - Custom function to determine if an error is retryable.
 *   If omitted, uses error.retryable property.
 */
export interface RetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
  retryableFn?: (error: unknown) => boolean;
}

// ============================================================================
// Default Policy
// ============================================================================

/**
 * Default retry policy: 3 retries, 1s base delay, 10s max, jitter enabled.
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  jitter: true,
};

// ============================================================================
// Delay Calculation
// ============================================================================

/**
 * Calculate exponential backoff delay with optional jitter.
 */
function calculateDelay(attempt: number, policy: RetryPolicy): number {
  const exponentialDelay = Math.min(
    policy.baseDelayMs * Math.pow(2, attempt),
    policy.maxDelayMs,
  );
  if (!policy.jitter) {
    return exponentialDelay;
  }
  // Full jitter: random value between 0 and exponentialDelay
  return Math.random() * exponentialDelay;
}

// ============================================================================
// Retryable Check
// ============================================================================

function isRetryable(error: unknown, policy: RetryPolicy): boolean {
  if (policy.retryableFn) {
    return policy.retryableFn(error);
  }
  if (error instanceof AppError) {
    return error.retryable;
  }
  return false;
}

// ============================================================================
// withRetry
// ============================================================================

/**
 * Wraps an async function with retry logic.
 * Retries on transient errors with exponential backoff.
 *
 * @param fn - The async function to retry
 * @param policy - Retry configuration (defaults to DEFAULT_RETRY_POLICY)
 * @returns The result of fn, or throws the last error after all retries exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  policy: Partial<RetryPolicy> = {},
): Promise<T> {
  const effectivePolicy = { ...DEFAULT_RETRY_POLICY, ...policy };
  let lastError: unknown;

  for (let attempt = 0; attempt <= effectivePolicy.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (
        attempt < effectivePolicy.maxRetries &&
        isRetryable(error, effectivePolicy)
      ) {
        const delay = calculateDelay(attempt, effectivePolicy);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}
