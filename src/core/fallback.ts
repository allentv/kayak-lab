/**
 * Graceful degradation via fallback execution.
 *
 * Executes a primary operation with an optional fallback when the
 * primary fails. Integrates with circuit breakers to skip
 * failing capabilities entirely when circuits are open.
 */

import { CircuitBreaker } from "./circuit-breaker.ts";

// ============================================================================
// executeWithFallback
// ============================================================================

/**
 * Result of a fallback execution, indicating whether the primary or fallback succeeded.
 */
export interface FallbackResult<T> {
  /** Whether the primary operation succeeded */
  primarySucceeded: boolean;
  /** The result value */
  value: T;
}

/**
 * Execute a primary operation with a fallback on failure.
 *
 * If the circuit breaker is provided and open, skips the primary
 * and executes the fallback directly. If the primary throws,
 * catches the error and executes the fallback. If the fallback
 * also throws, the fallback error is re-thrown.
 *
 * @param primary - The primary async operation
 * @param fallback - The fallback async operation
 * @param circuitBreaker - Optional circuit breaker to check before executing primary
 * @returns FallbackResult indicating which path succeeded
 */
export async function executeWithFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  circuitBreaker?: CircuitBreaker,
): Promise<FallbackResult<T>> {
  // If circuit is open, skip primary entirely
  if (circuitBreaker && circuitBreaker.getState() === "open") {
    const value = await fallback();
    return { primarySucceeded: false, value };
  }

  try {
    const value = circuitBreaker
      ? await circuitBreaker.execute(primary)
      : await primary();
    return { primarySucceeded: true, value };
  } catch {
    const value = await fallback();
    return { primarySucceeded: false, value };
  }
}
