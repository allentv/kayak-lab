## Why

Without rate limiting, agents can overwhelm external APIs (GitHub, K8s) or consume excessive resources. Without backpressure, slow UI clients can cause memory buildup in the event delivery pipeline. Both are needed for production stability.

## What Changes

- **Rate limiting**: Token bucket rate limiters for agent API calls and tool invocations
- **Backpressure**: Flow control for event delivery to slow consumers
- **Queue management**: Bounds on internal queues with overflow policies

### New Capabilities

- `core/rate-limiting`: Token bucket rate limiters, backpressure, queue bounds
