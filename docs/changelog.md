# Changelog

All notable changes to kayak-lab will be documented in this file.

## [Unreleased]

### Added

- Event stream with immutable, ordered events and session isolation
- Session manager with full lifecycle state machine (active/paused/completed/failed/cancelled)
- Agent runtime with input → model → tool execution loop
- Model provider abstraction with OpenAI, Anthropic, and local model support
- Tool registry with typed parameters and timeout support
- Shell capability with real execution and safety constraints (blocked/dangerous commands)
- Git, GitHub, Kubernetes capability interfaces (stubbed implementations)
- Event store with in-memory persistence, snapshots, and replay
- Projection protocol with subscription management and event filtering
- Terminal projection with ANSI-colored event rendering
- 112+ tests across 10 test suites
- Performance benchmarks for critical paths
- End-to-end session lifecycle tests

### OpenSpec Changes (Planned)

- `persistence-layer` — File-based event persistence with JSONL
- `real-capabilities` — Real Git/GitHub/K8s execution
- `schema-evolution` — Event schema versioning and migration
- `error-handling-recovery` — Error taxonomy, retry, circuit breaker
- `configuration-management` — Typed config with env overrides
- `websocket-projection` — WebSocket transport for real-time events
- `additional-projections` — VS Code, Web, Desktop, REST API
- `rate-limiting-backpressure` — Rate limiters and flow control
- `health-checks-observability` — Health probes and component health
- `cross-cutting-concerns` — Identity, policy, telemetry, evaluation
- `testing-infrastructure` — Mocks, helpers, fixtures, harness
- `web-monitoring-ui` — Fresh-based monitoring dashboard
