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
- Persistent event store with file-based JSONL append-only logs, snapshot persistence, and startup recovery
- Pluggable persistence backend interface (`IPersistenceBackend`) for alternative storage engines
- Projection protocol with subscription management and event filtering
- Terminal projection with ANSI-colored event rendering
- Schema registry with event versioning and migration support
- Error taxonomy with typed errors (ValidationError, TimeoutError, RateLimitError, etc.)
- Circuit breaker, retry, and fallback reliability patterns
- Configuration management with YAML loading, env var overrides, and secret masking
- Health registry with parallel checks and Kubernetes-compatible endpoints (/health, /ready, /alive)
- Component health checks for EventStore, Capabilities, and WebSocket server
- Token bucket rate limiter with configurable capacity and refill rate
- Bounded queue with overflow policies (drop-oldest, drop-newest, block, reject)
- Docker/GVisor sandbox execution with default-deny security posture
- SandboxedShellCapability with Deno permission flag injection
- WebSocket projection server with subscription management, gap recovery, and backpressure
- Shared mock registry (MockGitCapability, MockGitHubCapability, MockShellCapability, MockModelProvider, MockEventStore)
- Test helpers (session builder, event generators, assertions)
- Fixture loader and session fixture files
- Integration test harness with createTestEnvironment()
- Setup script for sandbox runtime installation
- Health check script for sandbox verification
- Documentation freshness agent and skill
- 140+ tests across 15 test suites
- Performance benchmarks for critical paths
- End-to-end session lifecycle tests

### OpenSpec Changes (Planned)

- `real-capabilities` — Real Git/GitHub/K8s execution
- `additional-projections` — VS Code, Web, Desktop, REST API
- `cross-cutting-concerns` — Identity, policy, telemetry, evaluation
- `web-monitoring-ui` — Fresh-based monitoring dashboard

### OpenSpec Changes (Archived)

- `persistence-layer` — File-based event persistence with JSONL, snapshots, and recovery
- `testing-infrastructure` — Mocks, helpers, fixtures, harness
- `health-checks-observability` — Health probes and component health
- `error-handling-recovery` — Error taxonomy, retry, circuit breaker
- `schema-evolution` — Event schema versioning and migration
- `configuration-management` — Typed config with env overrides
- `rate-limiting-backpressure` — Rate limiters and flow control
- `websocket-projection` — WebSocket transport for real-time events
- `local-sandbox-execution` — Docker/GVisor sandbox execution
- `code-quality-tooling` — Linting, formatting, pre-push checks
- `documentation-website` — VitePress documentation site
