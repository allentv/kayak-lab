/**
 * Circuit breaker for preventing cascading failures.
 *
 * Tracks consecutive failures per capability and opens the circuit
 * when failures exceed a threshold. The circuit allows half-open
 * recovery tests after a cooldown period.
 */

import { AppError, ErrorCodes } from "./errors.ts";

// ============================================================================
// Circuit States
// ============================================================================

export const CircuitState = {
  CLOSED: "closed",
  OPEN: "open",
  HALF_OPEN: "half_open",
} as const;

export type CircuitState = (typeof CircuitState)[keyof typeof CircuitState];

// ============================================================================
// Circuit Breaker Options
// ============================================================================

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening circuit (default: 5) */
  failureThreshold: number;
  /** Time in ms before transitioning from open to half-open (default: 30000) */
  recoveryTimeMs: number;
  /** Number of successful half-open attempts before closing circuit (default: 1) */
  halfOpenMaxAttempts: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  recoveryTimeMs: 30000,
  halfOpenMaxAttempts: 1,
};

// ============================================================================
// Circuit Open Error
// ============================================================================

/**
 * Thrown when a circuit breaker is open and rejects an execution attempt.
 */
export class CircuitOpenError extends AppError {
  constructor(
    module: string,
    public readonly circuitName: string,
    public readonly opensAt: number,
  ) {
    super(
      `Circuit breaker "${circuitName}" is open for module "${module}"`,
      ErrorCodes.EXTERNAL_SERVICE,
      module,
      "circuit_breaker",
      false,
      { circuitName, opensAt },
    );
    this.name = "CircuitOpenError";
  }
}

// ============================================================================
// Circuit Breaker
// ============================================================================

/**
 * Circuit breaker that tracks failures and prevents calls to failing services.
 *
 * States:
 * - **closed**: Normal operation. Failures counted. Threshold → open.
 * - **open**: All calls rejected with CircuitOpenError. Cooldown → half-open.
 * - **half-open**: Test call allowed. Success → closed. Failure → open.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private openedAt = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(
    public readonly name: string,
    options: Partial<CircuitBreakerOptions> = {},
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** Current circuit state. */
  getState(): CircuitState {
    if (
      this.state === CircuitState.OPEN &&
      Date.now() - this.openedAt >= this.options.recoveryTimeMs
    ) {
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }
    return this.state;
  }

  /** Number of consecutive failures since last success. */
  getFailureCount(): number {
    return this.failureCount;
  }

  /** Reset circuit to closed state. */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.openedAt = 0;
  }

  /**
   * Execute a function through the circuit breaker.
   * Throws CircuitOpenError when circuit is open.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === CircuitState.OPEN) {
      throw new CircuitOpenError(this.name, this.name, this.openedAt);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.halfOpenMaxAttempts) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Failure during half-open → back to open
      this.state = CircuitState.OPEN;
      this.openedAt = Date.now();
      this.successCount = 0;
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.openedAt = Date.now();
    }
  }
}
