# src/core/retry.ts · [[core-resilience-fault-tolerance]]

- RetryPolicy · interface · L24-L30 — Defines the configuration parameters for retry behavior including maximum attempts, delay timing, jitter, and custom retryable error detection.
- calculateDelay · function · L53-L63 — Computes exponential backoff delay with optional jitter to prevent thundering herd problems during retry attempts.
- isRetryable · function · L69-L77 — Determines whether an error is retryable by checking custom functions or the error's retryable property for transient failures.
- withRetry · function · L91-L117 — Wraps async functions with retry logic that automatically retries on transient errors using exponential backoff and configurable policies.
