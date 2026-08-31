## Context

Current error handling: capabilities return `CapabilityResult<T>` with `success` boolean and `error` string. The agent runtime has basic try/catch. No standardized error types, no retry logic, no circuit breaker. Shell has a `ToolTimeoutError` but other modules use generic Error.

## Goals / Non-Goals

**Goals:**
- Standardize error types across all modules
- Add configurable retry with exponential backoff
- Implement circuit breaker for external capabilities
- Enable graceful degradation with fallbacks

**Non-Goals:**
- Distributed circuit breaker (single-process only)
- Complex retry strategies (queue-based, priority-based)
- Error analytics/reporting (covered by telemetry change)

## Decisions

### 1. Extend CapabilityResult with error types

**Decision:** Add typed error objects to `CapabilityResult` alongside the existing string error.

**Rationale:**
- Backward compatible — existing code checks `success` boolean
- Typed errors enable programmatic handling (retry decisions, circuit breaker)
- Gradual migration: old code ignores typed errors

### 2. Circuit breaker per capability

**Decision:** One circuit breaker instance per capability (Git, GitHub, K8s, Shell).

**Rationale:**
- Failure in GitHub shouldn't affect Git
- Granular control over thresholds per capability
- Simple to implement and reason about

### 3. Retry as wrapper, not inline

**Decision:** Retry logic wraps capability calls, not embedded in capabilities.

**Rationale:**
- Capabilities remain simple (execute and return result)
- Retry policy is configurable at the caller level
- Easier to test retry logic independently

## Risks / Trade-offs

### Risk: Circuit breaker false positives

**Impact:** Medium — transient spikes could open circuit unnecessarily.

**Mitigation:** Configurable thresholds. Half-open state allows recovery.

### Risk: Retry amplification

**Impact:** Low — exponential backoff limits total retries. Max 3 retries per operation.

**Mitigation:** Respect rate limit headers. Circuit breaker stops retry storms.
