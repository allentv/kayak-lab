## Why

We need an enterprise agent platform where employees interact with AI-powered capabilities through multiple surfaces (CLI, VS Code, Web, Desktop, API). The current challenge is that each surface requires its own implementation, leading to duplicated logic and inconsistent behavior. The platform needs an abstraction between the agent runtime and individual UI surfaces to enable shared capabilities across all interfaces.

## What Changes

Introduce an event-sourced interaction layer that decouples the agent runtime from UI surfaces. The canonical representation of an agent interaction becomes an ordered stream of immutable events. UIs become projections of that event stream, disposable and reconstructable from events.

### Core Components

1. **Event Stream**: Immutable, ordered sequence of events representing agent interactions
2. **Session Manager**: Handles session lifecycle (create, resume, pause, complete, fail, cancel)
3. **Agent Runtime**: Executes agent loops, manages context, invokes tools, communicates with model providers
4. **Capability Layer**: Abstract interfaces for external systems (Git, GitHub, Shell, K8s, Cloud, DB, APIs)
5. **Projection Protocol**: How UI surfaces subscribe to and receive events
6. **Event Store**: Persistence layer for event streams

### Event Categories

- Session events (created, resumed, paused, completed, failed, cancelled)
- Agent events (thinking, decision, tool invocation)
- Tool events (execution started, completed, failed)
- Model events (request, response, streaming)
- UI events (user input, display update, action)
- Policy events (approval, denial, constraint)
- Context events (window updated, state changed)

## Capabilities

### New Capabilities

- `core/event-stream`: Core event stream infrastructure including event schema, ordering guarantees, and immutability
- `core/session-manager`: Session lifecycle management with create, resume, pause, complete, fail, cancel operations
- `runtime/agent-loop`: Agent execution loop with context management, model abstraction, and tool invocation
- `runtime/model-abstraction`: Provider-independent model interface supporting multiple LLM providers
- `capabilities/git`: Git operations capability with abstract interface
- `capabilities/github`: GitHub API capability with abstract interface
- `capabilities/shell`: Shell execution capability with abstract interface
- `capabilities/kubernetes`: Kubernetes operations capability with abstract interface
- `projection/protocol`: Event projection protocol for UI surface subscription and delivery
- `projection/terminal`: Terminal/CLI projection implementation
- `store/event-store`: Event persistence layer with replay and recovery support

### Modified Capabilities

None - this is a new system.

## Impact

- New repository structure with separate modules for each capability layer
- Requires defining event schemas (JSON Schema or Protobuf)
- Requires implementing event store (could start with in-memory, add persistence later)
- Requires model provider abstraction (OpenAI, Anthropic, local models)
- UI surfaces will consume events rather than directly calling agent runtime
- Cross-cutting concerns: identity, policy, telemetry, sessions, persistence, evaluation
