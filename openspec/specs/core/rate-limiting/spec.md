## Purpose

Rate limiting for agent operations and backpressure handling for event delivery, preventing resource exhaustion and ensuring system stability.

## Requirements

### Requirement: Token bucket rate limiter

The system MUST provide token bucket rate limiters for external API calls.

#### Scenario: Rate limit defined
- **WHEN** a capability is configured with a rate limit (e.g., 100 requests/minute)
- **THEN** a token bucket is created with the specified capacity and refill rate

#### Scenario: Request within limit
- **WHEN** a request is made and tokens are available
- **THEN** the request proceeds and one token is consumed

#### Scenario: Request exceeds limit
- **WHEN** a request is made and no tokens are available
- **THEN** the request is queued with a wait time, or rejected with `RateLimitError` if queue is full

#### Scenario: Token refill
- **WHEN** time passes
- **THEN** tokens are refilled at the configured rate up to the bucket capacity

### Requirement: Per-capability rate limits

Each external capability MUST have configurable rate limits.

#### Scenario: GitHub API limit
- **WHEN** GitHub capability is configured with 5000 requests/hour
- **THEN** the rate limiter enforces this limit

#### Scenario: K8s API limit
- **WHEN** K8s capability is configured with 100 requests/second
- **THEN** the rate limiter enforces this limit

#### Scenario: No limit configured
- **WHEN** a capability has no rate limit configured
- **THEN** requests proceed without rate limiting (unlimited)

### Requirement: Backpressure for event delivery

The event delivery pipeline MUST apply backpressure to slow consumers.

#### Scenario: Consumer keep-up
- **WHEN** a consumer processes events at the rate they are produced
- **THEN** events flow through without buffering

#### Scenario: Consumer slow
- **WHEN** a consumer processes events slower than production rate
- **THEN** events are buffered up to a configured limit; the producer is not blocked

#### Scenario: Buffer full
- **WHEN** the consumer buffer is full
- **THEN** the oldest events are dropped (lossy) or the producer blocks (blocking), based on configuration

### Requirement: Queue bounds

Internal queues MUST have configured maximum sizes.

#### Scenario: Queue within bounds
- **WHEN** items are added to a queue below its max size
- **THEN** items are enqueued normally

#### Scenario: Queue at capacity
- **WHEN** a queue is at its maximum size
- **THEN** the overflow policy is applied: drop-oldest, drop-newest, block, or reject with error
