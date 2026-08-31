/**
 * Token bucket rate limiter.
 *
 * Smooths burst traffic while enforcing average rate limits.
 * Uses monotonic clock for accurate token refill calculations.
 */

/** Configuration for a token bucket. */
export interface TokenBucketConfig {
  /** Maximum number of tokens. */
  capacity: number;
  /** Tokens added per refill interval (ms). */
  refillRate: number;
  /** Refill interval in milliseconds. */
  refillIntervalMs: number;
  /** Initial tokens (defaults to capacity). */
  initialTokens?: number;
}

/**
 * Token bucket rate limiter.
 *
 * Tokens refill at a fixed rate up to capacity.
 * Requests consume tokens; rejects when insufficient.
 */
export class TokenBucket {
  readonly capacity: number;
  private refillRate: number;
  private refillIntervalMs: number;
  private tokens: number;
  private lastRefillTime: number;
  private refillTimer?: ReturnType<typeof setInterval>;

  constructor(config: TokenBucketConfig) {
    this.capacity = config.capacity;
    this.refillRate = config.refillRate;
    this.refillIntervalMs = config.refillIntervalMs;
    this.tokens = config.initialTokens ?? config.capacity;
    this.lastRefillTime = performance.now();
  }

  /**
   * Try to consume tokens immediately.
   * Returns true if successful, false if insufficient tokens.
   */
  tryConsume(tokens = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  /**
   * Wait for tokens to become available, then consume.
   * Resolves when tokens are available.
   */
  async waitAndConsume(tokens = 1): Promise<void> {
    while (!this.tryConsume(tokens)) {
      // Wait for at least one refill interval
      await new Promise((resolve) => setTimeout(resolve, this.refillIntervalMs));
    }
  }

  /**
   * Get current token count.
   */
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Start automatic token refill on interval.
   */
  startRefill(): void {
    if (this.refillTimer !== undefined) return;

    this.refillTimer = setInterval(() => {
      this.refill();
    }, this.refillIntervalMs);
  }

  /**
   * Stop automatic token refill.
   */
  stopRefill(): void {
    if (this.refillTimer !== undefined) {
      clearInterval(this.refillTimer);
      this.refillTimer = undefined;
    }
  }

  /**
   * Refill tokens based on elapsed time.
   */
  private refill(): void {
    const now = performance.now();
    const elapsed = now - this.lastRefillTime;
    const refillCount = Math.floor(elapsed / this.refillIntervalMs) * this.refillRate;

    if (refillCount > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + refillCount);
      this.lastRefillTime = now;
    }
  }
}

// ============================================================================
// Rate Limiter Wrapper
// ============================================================================

/**
 * Rate limiter that wraps async functions.
 * Enforces token bucket limits on function invocations.
 */
export class RateLimiter {
  private bucket: TokenBucket;

  constructor(bucket: TokenBucket) {
    this.bucket = bucket;
  }

  /**
   * Wrap an async function with rate limiting.
   * Throws if rate limit exceeded.
   */
  wrap<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
  ): T {
    const bucket = this.bucket;

    const limited = async (...args: unknown[]) => {
      if (!bucket.tryConsume()) {
        throw new Error("Rate limit exceeded");
      }
      return fn(...args);
    };

    return limited as T;
  }

  /**
   * Wrap an async function with rate limiting, waiting for tokens.
   */
  wrapWithWait<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
  ): T {
    const bucket = this.bucket;

    const limited = async (...args: unknown[]) => {
      await bucket.waitAndConsume();
      return fn(...args);
    };

    return limited as T;
  }
}
