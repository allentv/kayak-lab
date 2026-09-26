# graft — repo map

Small markdown nodes summarising this repo. `grep` any term, symbol, or
filename here, or run `graft ask "<task>"`. Each node carries prose plus exact
`file:line`; open a source file only to edit the named span.

The same graph is queryable as MCP tools (`graft_find_code`, `graft_find_all`,
`graft_trace_calls`, `graft_file_api`, `graft_repo_map`) where a host exposes them, and
as the `graft` CLI everywhere else. Edges — who calls what — live only in the
graph, not in these files: `graft callers <symbol>` is the only way to read them.

## Concepts

- [aggregation-layer](aggregation-layer.md) — Aggregation Layer · web/lib/aggregation.ts, web/routes/api/health.ts, web/routes/api/sessions.ts
- [analytics-query-engines](analytics-query-engines.md) — Analytics Query Engines · src/store/__tests__/query-engine.test.ts, src/store/__tests__/sqlite-query-engine.test.ts, src/store/query-engine.ts, src/store/sqlite-query-engine.ts
- [attestation-service](attestation-service.md) — Attestation Service · src/session/__tests__/attestation-service.test.ts, src/session/attestation-service.ts, src/session/mod.ts
- [capability-framework](capability-framework.md) — Capability Framework · src/capabilities/capability.ts, src/capabilities/mod.ts
- [capability-lifecycle-enforcement](capability-lifecycle-enforcement.md) — Capability Lifecycle Enforcement · src/capabilities/__tests__/capability.test.ts, src/capabilities/capability.ts
- [causal-graph-analysis](causal-graph-analysis.md) — Causal Graph Analysis · src/store/causal-graph.ts
- [cli-repl](cli-repl.md) — CLI & REPL · src/cli.ts
- [code-review-system](code-review-system.md) — Code Review System · review/cli.ts, review/context.ts, review/formatter.ts, review/registry.ts, review/types.ts
- [concrete-capabilities](concrete-capabilities.md) — Concrete Capabilities · src/capabilities/file.ts, src/capabilities/git.ts, src/capabilities/github.ts, src/capabilities/kubernetes.ts, src/capabilities/search.ts, src/capabilities/shell.ts
- [core-resilience-fault-tolerance](core-resilience-fault-tolerance.md) — Core Resilience & Fault Tolerance · src/core/bounded-queue.ts, src/core/circuit-breaker.ts, src/core/fallback.ts, src/core/rate-limiter.ts, src/core/retry.ts
- [cross-cutting-telemetry](cross-cutting-telemetry.md) — Cross-Cutting Telemetry · src/cross-cutting/telemetry/logger.ts, src/cross-cutting/telemetry/metrics.ts, src/cross-cutting/telemetry/mod.ts, src/cross-cutting/telemetry/tracing.ts, src/cross-cutting/telemetry/types.ts
- [dynamic-tool-management](dynamic-tool-management.md) — Dynamic Tool Management · src/runtime/__tests__/dynamic-tool-registry.test.ts, src/runtime/dynamic-tool-registry.ts
- [evaluation-framework](evaluation-framework.md) — Evaluation Framework · src/cross-cutting/evaluation/benchmark.ts, src/cross-cutting/evaluation/metrics.ts, src/cross-cutting/evaluation/mod.ts, src/cross-cutting/evaluation/quality.ts, src/cross-cutting/evaluation/types.ts
- [event-analysis-optimization](event-analysis-optimization.md) — Event Analysis & Optimization · src/analysis.ts
- [event-sourcing-core](event-sourcing-core.md) — Event-Sourcing Core · src/__tests__/e2e-session-lifecycle.test.ts, src/analysis.ts, src/cli.ts
- [event-sourcing-persistence-system](event-sourcing-persistence-system.md) — Event Sourcing & Persistence System · src/store/__tests__/event-store.test.ts, src/store/__tests__/persistence.test.ts, src/store/__tests__/sqlite-backend.test.ts, src/store/__tests__/sqlite-migration.test.ts, src/store/__tests__/sqlite-performance.test.ts, src/store/causal-graph.ts, src/store/event-store.ts, src/store/persistence.ts, src/store/sqlite-backend.ts
- [event-sourcing-session-lifecycle](event-sourcing-session-lifecycle.md) — Event Sourcing & Session Lifecycle · src/core/event-stream.ts, src/core/session-manager.ts
- [event-type-taxonomy](event-type-taxonomy.md) — Event Type Taxonomy · src/types/attestations.ts, src/types/events.ts
- [finding-types](finding-types.md) — Finding Types · review/types.ts
- [harness-connection-manager](harness-connection-manager.md) — Harness Connection Manager · web/lib/harness-connection.ts, web/routes/api/harnesses.ts
- [health-observability](health-observability.md) — Health & Observability · src/core/component-health.ts, src/core/health.ts
- [hook-based-extensibility](hook-based-extensibility.md) — Hook-Based Extensibility · src/runtime/__tests__/hooks.test.ts, src/runtime/agent-runtime.ts, src/runtime/hooks.ts
- [identity-authorization](identity-authorization.md) — Identity & Authorization · src/cross-cutting/identity/middleware.ts, src/cross-cutting/identity/mod.ts, src/cross-cutting/identity/provider.ts, src/cross-cutting/identity/types.ts, src/cross-cutting/policy/engine.ts, src/cross-cutting/policy/mod.ts, src/cross-cutting/policy/types.ts
- [main-application-harness](main-application-harness.md) — Main Application Harness · src/main.ts
- [memory-context-management](memory-context-management.md) — Memory & Context Management · src/memory/__tests__/memory.test.ts, src/memory/__tests__/provenance-context.test.ts, src/memory/__tests__/retrieval-l2l3.test.ts, src/memory/config.ts
- [memory-system](memory-system.md) — Memory System · src/memory/emitter.ts, src/memory/message-classifier.ts, src/memory/mod.ts, src/memory/provenance-context-types.ts, src/memory/provenance-context.ts, src/memory/provider.ts, src/memory/retrieval.ts, src/memory/search.ts, src/memory/shared.ts, src/memory/storage.ts, src/memory/types.ts, src/memory/update.ts
- [memory-tiering-l1-l2-l3](memory-tiering-l1-l2-l3.md) — Memory Tiering (L1/L2/L3) · src/memory/provider.ts, src/memory/retrieval.ts, src/memory/types.ts, src/runtime/__tests__/agent-runtime-l3.test.ts, src/runtime/__tests__/pattern-analyzer-l2.test.ts
- [model-context-protocol-mcp-integration](model-context-protocol-mcp-integration.md) — Model Context Protocol (MCP) Integration · src/mcp/client.ts, src/mcp/event-emitter.ts, src/mcp/events.ts, src/mcp/mod.ts, src/mcp/registry.ts, src/mcp/search.ts, src/mcp/server.ts, src/mcp/transport.ts, src/mcp/types.ts
- [pluggable-check-architecture](pluggable-check-architecture.md) — Pluggable Check Architecture · review/cli.ts, review/registry.ts
- [profile-inheritance](profile-inheritance.md) — Profile Inheritance · src/runtime/__tests__/profile-registry.test.ts, src/runtime/profile-registry.ts, src/runtime/profiles.ts
- [projection-system](projection-system.md) — Projection System · src/projection/__tests__/desktop.test.ts, src/projection/__tests__/protocol.test.ts, src/projection/__tests__/rest-api.test.ts, src/projection/__tests__/vscode.test.ts, src/projection/__tests__/web.test.ts, src/projection/__tests__/websocket-server.test.ts, src/projection/desktop.ts, src/projection/mod.ts, src/projection/protocol.ts, src/projection/rest-api.ts, src/projection/terminal.ts, src/projection/vscode.ts, src/projection/web.ts, src/projection/websocket-server.ts
- [provenance-aware-context-pruning](provenance-aware-context-pruning.md) — Provenance-Aware Context Pruning · src/memory/message-classifier.ts, src/memory/provenance-context.ts
- [provenance-graph-system](provenance-graph-system.md) — Provenance Graph System · src/provenance/__tests__/classifier.test.ts, src/provenance/__tests__/graph.test.ts, src/provenance/classifier.ts, src/provenance/graph.ts, src/provenance/mod.ts, src/provenance/types.ts
- [review-checks](review-checks.md) — Review Checks · review/checks/file-size.ts, review/checks/reexports.ts, review/checks/test-pairing.ts
- [review-delegates](review-delegates.md) — Review Delegates · review/delegate/deno-check.ts, review/delegate/deno-lint.ts, review/delegate/knip.ts, review/delegate/madge.ts
- [runtime-orchestration](runtime-orchestration.md) — Runtime Orchestration · src/runtime/__tests__/agent-runtime-config.test.ts, src/runtime/__tests__/agent-runtime-l3.test.ts, src/runtime/__tests__/agent-runtime.test.ts, src/runtime/__tests__/builtin-profiles.test.ts, src/runtime/__tests__/dynamic-tool-registry.test.ts, src/runtime/__tests__/hooks.test.ts, src/runtime/__tests__/model-provider.test.ts, src/runtime/__tests__/pattern-analyzer-l2.test.ts, src/runtime/__tests__/pattern-analyzer.test.ts, src/runtime/__tests__/profile-registry.test.ts, src/runtime/__tests__/self-observation.test.ts, src/runtime/__tests__/spawn-config.test.ts, src/runtime/__tests__/spawn.test.ts, src/runtime/__tests__/tool-registry.test.ts, src/runtime/agent-runtime.ts, src/runtime/dynamic-tool-registry.ts, src/runtime/hooks.ts, src/runtime/mod.ts, src/runtime/model-provider.ts, src/runtime/pattern-analyzer.ts, src/runtime/profile-registry.ts, src/runtime/profiles.ts, src/runtime/self-observation.ts, src/runtime/spawn-config.ts, src/runtime/spawn.ts, src/runtime/tool-registry.ts, src/runtime/types.ts
- [safe-sql-query-api](safe-sql-query-api.md) — Safe SQL Query API · web/routes/api/query.ts
- [sandboxed-execution](sandboxed-execution.md) — Sandboxed Execution · src/capabilities/sandbox/docker-runtime.ts, src/capabilities/sandbox/gvisor-runtime.ts, src/capabilities/sandbox/mod.ts, src/capabilities/sandbox/types.ts, src/capabilities/sandboxed-shell.ts
- [schema-evolution-migration](schema-evolution-migration.md) — Schema Evolution & Migration · src/core/schema-registry.ts
- [scripts-setup](scripts-setup.md) — Scripts & Setup · scripts/migrate-jsonl-to-duckdb.ts, scripts/sandbox-health-check.sh, scripts/setup-duckdb.sh, scripts/setup-sandbox.sh
- [security-first-sandboxing](security-first-sandboxing.md) — Security-First Sandboxing · scripts/sandbox-health-check.sh, src/capabilities/file.ts, src/capabilities/sandbox/docker-runtime.ts, src/capabilities/sandbox/gvisor-runtime.ts, src/capabilities/shell.ts
- [self-observation-and-pattern-detection](self-observation-and-pattern-detection.md) — Self-Observation and Pattern Detection · src/runtime/__tests__/self-observation.test.ts, src/runtime/pattern-analyzer.ts, src/runtime/self-observation.ts
- [sqlite-query-engine](sqlite-query-engine.md) — SQLite Query Engine · src/store/sqlite-query-engine.ts
- [structured-error-taxonomy](structured-error-taxonomy.md) — Structured Error Taxonomy · src/core/errors.ts
- [test-utilities](test-utilities.md) — Test Utilities · src/__test-utils__/fixtures/mod.ts, src/__test-utils__/harness/mod.ts, src/__test-utils__/helpers/mod.ts, src/__test-utils__/mocks/mod.ts, src/__tests__/_helpers/harness-client.ts, src/__tests__/_helpers/harness-process.ts
- [tool-calling-system](tool-calling-system.md) — Tool Calling System · src/tools/__tests__/authoring.test.ts, src/tools/__tests__/calling-engine.test.ts, src/tools/__tests__/registry.test.ts, src/tools/__tests__/self-improvement.test.ts, src/tools/__tests__/tool-definition.test.ts, src/tools/authoring.ts, src/tools/calling-engine.ts, src/tools/mod.ts, src/tools/registry.ts, src/tools/self-improvement.ts, src/tools/tool-definition.ts, src/tools/types.ts
- [tool-self-improvement-feedback-loop](tool-self-improvement-feedback-loop.md) — Tool Self-Improvement Feedback Loop · src/tools/__tests__/self-improvement.test.ts, src/tools/self-improvement.ts
- [web-monitoring-dashboard](web-monitoring-dashboard.md) — Web Monitoring Dashboard · web/components/Layout.tsx, web/fresh.config.ts, web/islands/DashboardIsland.tsx, web/islands/SessionInspectorIsland.tsx, web/main.ts, web/routes/index.tsx, web/routes/sessions/[harness]/[id].tsx

## Files

228 per-file wiring cards mirror the source tree under `graft/` (179 carry extracted symbols). They are deliberately not enumerated here —
`grep` a symbol or `find`/`ls` a filename under `graft/` to land on the card for that file.
