# Getting Started

## Prerequisites

- [Deno 2](https://deno.land/) installed
- Git

## Quick Start

```bash
# Clone the repository
git clone https://github.com/allentv/kayak-lab.git
cd kayak-lab

# Run all tests
deno test --allow-read --allow-env --allow-run

# Type check
deno check src/**/*.ts

# Format and lint
deno fmt
deno lint
```

## Project Structure

```
src/
├── types/                  Event schema and type definitions
├── core/                   Event stream and session manager
├── runtime/                Agent runtime, model abstraction, tool registry
├── tools/                  Structured tool calling protocol
├── capabilities/           External system interfaces (Shell, Git, GitHub, K8s)
├── mcp/                    Model Context Protocol client, server, registry, search
├── memory/                 Persistent memory subsystem (episodic, semantic, procedural, working)
├── store/                  Event persistence, replay, and file-based durability
├── projection/             UI projection protocol and terminal rendering
└── __tests__/              End-to-end tests and benchmarks
```

## Core Usage

### Creating an Event Stream

```typescript
import { EventStream } from "./src/core/event-stream.ts";

const stream = new EventStream();

// Append events
stream.append({
  session_id: "my-session",
  event_type: "session.created",
  payload: { state: "active" },
  metadata: { source: "example" },
});

// Read events
const events = stream.getEvents("my-session");
```

### Managing Sessions

```typescript
import { EventStream } from "./src/core/event-stream.ts";
import { SessionManager } from "./src/core/session-manager.ts";

const stream = new EventStream();
const manager = new SessionManager(stream);

// Create a session
const session = await manager.createSession({
  description: "My agent task",
});

// The session is now active
console.log(session.state); // "active"

// Pause it
manager.pauseSession(session.id);

// Resume it
manager.resumeSession(session.id);

// Complete it
manager.completeSession(session.id);
```

### Running the Agent

```typescript
import { EventStream } from "./src/core/event-stream.ts";
import { SessionManager } from "./src/core/session-manager.ts";
import { AgentRuntime } from "./src/runtime/agent-runtime.ts";
import { ModelManager } from "./src/runtime/model-provider.ts";
import { ToolRegistry } from "./src/runtime/tool-registry.ts";

const stream = new EventStream();
const sessionManager = new SessionManager(stream);
const modelManager = new ModelManager();
const toolRegistry = new ToolRegistry();

const agent = new AgentRuntime(stream, sessionManager, modelManager, toolRegistry);

// Start the agent
await agent.start();

// Process user input
const response = await agent.processInput("What files are in this directory?");

// The agent emits events as it works:
// - agent.thinking (reasoning about the input)
// - tool.execution.started (invoking shell)
// - tool.execution.completed (shell result)
// - model.response (generating response)

console.log(response);
```

### Subscribing to Events

```typescript
import { ProjectionProtocol } from "./src/projection/protocol.ts";

const protocol = new ProjectionProtocol(stream);

// Subscribe to all events for a session
const sub = protocol.subscribe(session.id, (event) => {
  console.log(`[${event.event_type}]`, event.payload);
});

// Filter by event type
const toolSub = protocol.subscribe(session.id, (event) => {
  console.log(`Tool: ${event.payload.tool_name}`);
}, {
  filter: { event_types: ["tool.execution.started", "tool.execution.completed"] },
});
```

## Persisting Events

For durable sessions that survive restarts, use the `PersistentEventStore`:

```typescript
import { PersistentEventStore } from "./src/store/persistence.ts";

// Writes events to ./data/events/<session_id>.jsonl
const store = new PersistentEventStore({ dataDir: "./data/events" });

// Store events — written synchronously to disk
store.store(event);

// On next startup, recover state automatically
// Snapshot + events replayed from disk into memory
```

For ephemeral/testing use, the in-memory `EventStore` remains available and requires no configuration.

## Running Benchmarks

```bash
deno test src/__tests__/benchmarks.test.ts --allow-read --allow-env
```

Benchmarks measure:
- Event append throughput
- Event read throughput
- Subscription creation speed
- Event delivery latency
- Session lifecycle performance
- Memory usage

## Next Steps

- [Architecture](/architecture) — Understand the three-layer design
- [Event Types](/event-types) — All 25 event types across 7 categories
- [Sessions](/sessions) — Session lifecycle state machine
- [Capabilities](/capabilities) — Pluggable external system interfaces
