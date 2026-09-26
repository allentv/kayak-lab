# src/core/circuit-breaker.ts · [[core-resilience-fault-tolerance]]

Implements a circuit breaker pattern to prevent cascading failures by tracking consecutive failures and opening circuits when thresholds are exceeded.

- CircuitState · type · L21-L21 — Defines the three possible states (closed, open, half-open) for circuit breaker operation.
- CircuitBreakerOptions · interface · L27-L34 — Configures the failure threshold, recovery time, and half-open attempt limits for circuit breaker behavior.
- CircuitOpenError · class · L49-L65 — Represents an error thrown when a circuit breaker is open and rejects execution attempts.
- constructor · method · L50-L64 — Creates a circuit open error with details about the circuit name and when it opened.
- CircuitBreaker · class · L79-L165 — Implements the core circuit breaker logic that tracks failures and prevents calls to failing services.
- constructor · method · L86-L91 — Initializes a circuit breaker with a name and optional configuration options.
- getState · method · L94-L103 — Returns the current circuit state, automatically transitioning from open to half-open after the recovery time elapses.
- getFailureCount · method · L106-L108 — Returns the number of consecutive failures since the last successful execution.
- reset · method · L111-L116 — Resets the circuit breaker to its initial closed state with zeroed counters.
- execute · method · L122-L137 — Executes a function through the circuit breaker, throwing CircuitOpenError when the circuit is open.
- onSuccess · method · L139-L150 — Handles successful executions by resetting failure counts or incrementing half-open success counts to potentially close the circuit.
- onFailure · method · L152-L164 — Handles failed executions by incrementing failure counts and opening the circuit when thresholds are exceeded.
