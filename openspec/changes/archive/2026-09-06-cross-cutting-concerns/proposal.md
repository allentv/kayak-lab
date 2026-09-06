## Why

The platform lacks cross-cutting concerns that any production system requires: identity and authentication (who is using the platform), policy enforcement (what they can do), telemetry (observability), and evaluation (how well agents perform). Without these, the platform cannot be deployed securely or monitored effectively.

## What Changes

Add four cross-cutting capability areas:

- **Identity/Auth**: User identity, authentication, and authorization for all surfaces
- **Policy Engine**: Rule-based policy enforcement for agent actions and capability access
- **Telemetry**: Structured logging, metrics, and tracing for observability
- **Evaluation Framework**: Agent performance measurement, benchmarking, and quality scoring

### New Capabilities

- `cross-cutting/identity`: User identity, authentication, and authorization
- `cross-cutting/policy`: Rule-based policy engine for agent actions
- `cross-cutting/telemetry`: Structured logging, metrics, and distributed tracing
- `cross-cutting/evaluation`: Agent performance measurement and quality scoring

## Capabilities

### New Capabilities

- `cross-cutting/identity`: Identity and access management
- `cross-cutting/policy`: Policy enforcement engine
- `cross-cutting/telemetry`: Observability (logs, metrics, traces)
- `cross-cutting/evaluation`: Agent quality measurement
