# OpenSpec for Agent Interaction & UI Control Plane

## Analysis

This document explores using OpenSpec to specify and orchestrate the agent interaction and UI control plane project.

---

## What OpenSpec Could Cover

| Layer | OpenSpec Role | Fit |
|-------|---------------|-----|
| Interaction Protocol | Define event schema, types, transitions | Good — structured requirements map to event taxonomy |
| Agent Runtime | Specify agent loop, model abstraction, tool invocation | Partial — runtime behavior is procedural, not declarative |
| Capability Layer | Document capability interfaces and contracts | Good — clear boundary, testable |
| UI Surfaces | Define projection contracts per surface | Weak — UIs are implementations, not specs |
| Cross-cutting | Policy, telemetry, identity as requirements | Good — naturally declarative |

---

## Pros

### 1. Structured decomposition of a complex system

OpenSpec forces explicit goals, requirements, and acceptance criteria before implementation. For a system with multiple interacting layers (event stream, projections, runtime, capabilities), this discipline prevents underspecified interfaces.

Your event taxonomy (`session.created`, `tool.execution.started`, etc.) maps directly to OpenSpec requirements with acceptance criteria:

```yaml
requirements:
  - id: req-tool-execution-events
    title: Tool execution event lifecycle
    type: functional
    acceptanceCriteria:
      - id: ac-tool-started
        given: Agent invokes a tool
        when: Tool execution begins
        then: A tool.execution.started event is emitted with event_id, session_id, sequence_number
      - id: ac-tool-completed
        given: A tool.execution.started event exists
        when: Tool execution finishes
        then: A tool.execution.completed event is emitted with result payload
```

### 2. Dependency graph for implementation ordering

OpenSpec tickets with explicit dependencies enforce a build order. Your architecture has natural dependencies:

```yaml
epics:
  - id: epic-event-stream
    title: Core event stream
    tickets:
      - id: tkt-event-schema
        title: Define event schema
        dependencies: []
      - id: tkt-session-manager
        title: Implement session manager
        dependencies: [tkt-event-schema]
      - id: tkt-event-store
        title: Implement event store
        dependencies: [tkt-event-schema]
  - id: epic-runtime
    title: Agent runtime
    tickets:
      - id: tkt-agent-loop
        title: Implement agent loop
        dependencies: [tkt-event-store, tkt-session-manager]
```

Agents executing this spec know exactly what to build first.

### 3. Acceptance criteria as executable verification

Each requirement has explicit `given/when/then` criteria. This translates directly to tests:

```yaml
acceptanceCriteria:
  - id: ac-replay
    given: A complete event stream for a session
    when: Replay is initiated
    then: The system reconstructs state at each event boundary
```

Becomes a test that validates replay correctness — not just "it compiles."

### 4. Guardrails prevent scope creep

Your non-goals section maps directly to OpenSpec guardrails:

```yaml
guardrails:
  - Do not implement general-purpose workflow orchestration
  - Do not build distributed consensus
  - Do not replace Kubernetes
  - Do not build a general-purpose UI framework
```

Agents executing the spec have explicit boundaries.

### 5. Provider independence is specifiable

Your goal of provider-independent model abstraction becomes a concrete requirement:

```yaml
requirements:
  - id: req-provider-abstraction
    title: Model provider abstraction
    type: architectural
    acceptanceCriteria:
      - id: ac-provider-switch
        given: Two model providers configured
        when: Provider is switched at runtime
        then: Agent execution continues without code changes
```

---

## Cons

### 1. OpenSpec is a document format, not a runtime protocol

Your core abstraction is an **event stream** — a runtime data structure. OpenSpec describes what to build, not how events flow at runtime. You still need:

- An event schema format (JSON Schema, Avro, Protobuf)
- A transport (WebSocket, gRPC, message queue)
- A projection protocol (how UIs subscribe and receive events)

OpenSpec specifies the requirements for these, but doesn't define the runtime wire format.

**Mitigation:** Use OpenSpec for the spec layer; define event schemas separately in JSON Schema or Protobuf.

### 2. Event taxonomy is emergent, not specifiable upfront

Your brief says "the exact event taxonomy should be explored rather than assumed to be final." OpenSpec works best when requirements are stable. Early exploration means the spec churns.

**Mitigation:** Keep the spec at the requirement level ("system emits tool execution events"), not the event-name level. Let the event taxonomy evolve in implementation while the spec captures the invariant.

### 3. UI projections are hard to spec declaratively

A terminal projection and a web projection of the same event stream have fundamentally different rendering logic. OpenSpec can specify what data each surface needs, but not how to render it.

**Mitigation:** Spec the data contract per surface (what events each surface consumes, what actions it emits), not the rendering.

### 4. Recovery semantics are procedural

Your recoverability goal ("resume from a known event boundary") involves checkpoint logic, transaction boundaries, and state reconstruction — all procedural. OpenSpec captures the requirement but not the implementation strategy.

**Mitigation:** Use OpenSpec tickets to decompose recovery into testable steps (e.g., "implement checkpoint at tool.execution.completed", "verify replay from checkpoint").

### 5. Event-sourced systems have subtle invariants

Event sourcing introduces complexities that are hard to capture in acceptance criteria:

- Event ordering guarantees
- Idempotency of event handlers
- Schema evolution and versioning
- Snapshot vs. full replay tradeoffs

OpenSpec can specify the behavior, but the correctness of these invariants depends on implementation discipline.

**Mitigation:** Supplement OpenSpec with an architecture decision record (ADR) for event sourcing invariants.

---

## Recommendation

Use OpenSpec for **what to build and why**, not for **how it works at runtime**.

| Use OpenSpec for | Use something else for |
|------------------|------------------------|
| Goal decomposition | Event schema (JSON Schema/Protobuf) |
| Requirement acceptance criteria | Runtime protocol (WebSocket/gRPC) |
| Dependency ordering | Projection rendering logic |
| Guardrails and scope | State reconstruction algorithms |
| Provider/capability contracts | Event store implementation |

The spec captures the architecture at the boundary level. The runtime implementation fills in the procedural details.

---

## Next Steps

1. Write an OpenSpec document for the interaction protocol layer
2. Define event schemas separately (JSON Schema)
3. Prototype a single event stream with one projection (terminal)
4. Validate the spec against the prototype
5. Iterate on event taxonomy based on prototype findings
