# kayak-lab

Event-sourced agent interaction platform built with Deno 2.

Decouples an AI agent runtime from multiple UI surfaces (CLI, VS Code, Web, Desktop, API) using immutable event streams as the canonical representation of agent interactions. UIs become disposable projections — reconstructable from events at any time.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KAYAK-LAB ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Core Layer                         │   │
│  │  EventStream ←→ SessionManager ←→ AgentRuntime      │   │
│  │       │                               │              │   │
│  │  EventStore                    ModelProvider         │   │
│  │  (in-memory, persistence       (OpenAI, Anthropic,  │   │
│  │   planned)                      local models)       │   │
│  └─────────────────────┬───────────────────────────────┘   │
│                        │                                    │
│  ┌─────────────────────▼───────────────────────────────┐   │
│  │                Capability Layer                      │   │
│  │  Shell (real)  Git (stubbed)  GitHub (stubbed)      │   │
│  │  Kubernetes (stubbed)                               │   │
│  └─────────────────────┬───────────────────────────────┘   │
│                        │                                    │
│  ┌─────────────────────▼───────────────────────────────┐   │
│  │              Projection Layer                        │   │
│  │  Protocol ←→ Terminal (real)                         │   │
│  │            ←→ WebSocket (planned)                    │   │
│  │            ←→ Web UI (planned)                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Core Concepts

### Event Sourcing

Every agent interaction is captured as an ordered stream of immutable events. Events are the canonical representation — UIs, tools, and debugging all read from the same event stream.

```
Session "abc-123":
  1  session.created     { state: "active" }
  2  ui.user.input       { text: "run ls -la" }
  3  agent.thinking      { reasoning: "User wants to list files..." }
  4  tool.execution.started  { tool: "shell", command: "ls -la" }
  5  tool.execution.completed  { exit_code: 0, stdout: "..." }
  6  model.response      { content: "Here are the files..." }
  7  session.completed   { state: "completed" }
```

### Sessions

Sessions manage the lifecycle of agent interactions:

```
  active ──→ paused ──→ active    (interruptible)
    │
    ├──→ completed                 (success)
    ├──→ failed                    (error)
    └──→ cancelled                 (user abort)
```

### Capabilities

Abstract interfaces for external systems. Capabilities are pluggable — swap implementations without changing the agent runtime.

| Capability | Status | Description |
|-----------|--------|-------------|
| Shell | Real execution | `Deno.Command` with safety constraints (blocked/dangerous command lists) |
| Git | Stubbed | Interface defined, returns simulated data |
| GitHub | Stubbed | Interface defined, returns simulated data |
| Kubernetes | Stubbed | Interface defined, returns simulated data |

### Projections

UI surfaces subscribe to the event stream and render events appropriately. Each projection is independent — multiple projections can run simultaneously on the same event stream.

| Projection | Status | Description |
|-----------|--------|-------------|
| Terminal | Implemented | ANSI-colored event rendering with streaming display |
| Protocol | Implemented | Subscription management with filtering and reconnection |
| WebSocket | Planned | Real-time event delivery over WebSocket |
| Web UI | Planned | Fresh-based monitoring dashboard |

## Project Structure

```
src/
├── types/                  Event schema and type definitions
│   └── events.ts           BaseEvent, EventTypes registry, type guards
├── core/                   Core infrastructure
│   ├── event-stream.ts     Immutable, ordered event stream with session isolation
│   └── session-manager.ts  Session lifecycle state machine
├── runtime/                Agent execution
│   ├── agent-runtime.ts    Agent loop: input → model → tool cycle
│   ├── model-provider.ts   Provider-agnostic model interface (IModelProvider)
│   └── tool-registry.ts    Typed tool registration and invocation
├── capabilities/           External system interfaces
│   ├── capability.ts       ICapability interface, registry, error hierarchy
│   ├── shell.ts            Shell execution via Deno.Command
│   ├── git.ts              Git operations (stubbed)
│   ├── github.ts           GitHub API operations (stubbed)
│   └── kubernetes.ts       Kubernetes API operations (stubbed)
├── store/                  Event persistence
│   └── event-store.ts      In-memory event store with snapshots and replay
├── projection/             UI projection layer
│   ├── protocol.ts         Subscription protocol with filtering
│   └── terminal.ts         Terminal/CLI event rendering
└── __tests__/              End-to-end and benchmark tests
```

## Quick Start

```bash
# Run all tests (112+ tests across 10 suites)
deno test --allow-read --allow-env --allow-run

# Type check
deno check src/**/*.ts

# Format
deno fmt

# Lint
deno lint
```

### Running Benchmarks

```bash
deno test src/__tests__/benchmarks.test.ts --allow-read --allow-env
```

Benchmarks measure: event append throughput, event read throughput, subscription creation, event delivery, session lifecycle, and memory usage.

## Event Types

25 event types across 7 categories:

| Category | Events | Purpose |
|----------|--------|---------|
| Session | `session.created`, `.resumed`, `.paused`, `.completed`, `.failed`, `.cancelled` | Lifecycle management |
| Agent | `agent.thinking`, `.decision`, `.tool_invocation` | Agent loop state |
| Tool | `tool.execution.started`, `.completed`, `.failed` | Tool invocation tracking |
| Model | `model.request`, `.response`, `.stream.delta` | Model provider interaction |
| UI | `ui.user.input`, `.display.update`, `.action` | User interaction |
| Policy | `policy.approval`, `.denial`, `.constraint` | Policy enforcement (planned) |
| Context | `context.window.updated`, `.state.changed` | Context management |

## OpenSpec

This project uses [OpenSpec](https://github.com/allentv/openspec) for specification-driven development. Every feature is specified before implementation.

### Active Changes

| Change | Focus | Status |
|--------|-------|--------|
| `persistence-layer` | File-based event persistence (JSONL, snapshots, recovery) | Spec complete |
| `real-capabilities` | Real Git/GitHub/K8s execution replacing stubs | Spec complete |
| `schema-evolution` | Event schema versioning, compatibility, migration | Spec complete |
| `error-handling-recovery` | Error taxonomy, retry policies, circuit breaker | Spec complete |
| `configuration-management` | Typed config, env overrides, secrets, hot-reload | Spec complete |
| `websocket-projection` | WebSocket transport for real-time event delivery | Spec complete |
| `additional-projections` | VS Code, Web, Desktop, REST API projections | Spec complete |
| `rate-limiting-backpressure` | Token bucket rate limiters, backpressure, queue bounds | Spec complete |
| `health-checks-observability` | Health/readiness/liveness probes, component health | Spec complete |
| `cross-cutting-concerns` | Identity, policy, telemetry, evaluation | Spec complete |
| `testing-infrastructure` | Mock registry, test helpers, fixtures, harness | Spec complete |
| `web-monitoring-ui` | Fresh-based monitoring dashboard (separate process) | Spec complete |

### Working with OpenSpec

```bash
# Check change status
openspec status --change <change-name>

# List all changes
openspec list

# Validate specs
openspec validate <change-name>

# Start implementing a change
openspec instructions apply --change <change-name> --json
```

Change artifacts live in `openspec/changes/<change-name>/` with: `proposal.md`, `specs/`, `design.md`, `tasks.md`.

## Documentation

- [OpenSpec Analysis](docs/openspec-analysis.md) — Pros/cons of using OpenSpec for this project
- [Learnings](docs/learnings.md) — Patterns, decisions, and gotchas discovered during development
- [Agents](AGENTS.md) — Code reviewer and scout agent configurations

## Development

### Adding a New Capability

1. Define the interface in `src/capabilities/<name>.ts` extending `ICapability`
2. Register it in `src/capabilities/mod.ts`
3. Write tests in `src/capabilities/__tests__/<name>.test.ts`
4. Create an OpenSpec change if the capability has complex behavior

### Adding a New Event Type

1. Add the event type to `EventTypes` in `src/types/events.ts`
2. Add the type guard if needed
3. Update `SCHEMA_VERSION` if this is a breaking change
4. Emit the event from the appropriate module

### Testing Patterns

- `Deno.test` with async `t.step` for nested test organization
- Mock providers implement `IModelProvider` with configurable responses
- Test context objects provide minimal required fields
- E2E tests wire real components together (EventStream → SessionManager → AgentRuntime)

## License

ISC
