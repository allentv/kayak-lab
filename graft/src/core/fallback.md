# src/core/fallback.ts · [[core-resilience-fault-tolerance]]

Provides graceful degradation via fallback execution with circuit breaker integration to skip failing capabilities when circuits are open.

- FallbackResult · interface · L18-L23 — Represents the outcome of a fallback execution, indicating whether the primary operation succeeded and containing the resulting value.
- executeWithFallback · function · L38-L58 — Executes a primary operation with automatic fallback on failure, optionally skipping the primary when a circuit breaker is open.
