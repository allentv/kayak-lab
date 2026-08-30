## Context

Building an enterprise agent platform with multiple UI surfaces (CLI, VS Code, Web, Desktop, API) that share common capabilities. The core challenge is decoupling the agent runtime from UI implementations while maintaining a complete interaction history and enabling replay/recovery.

Current state: No existing implementation. This is a greenfield project.

Constraints:
- Must support multiple model providers (OpenAI, Anthropic, local models)
- Must handle real-time streaming and async operations
- Must be recoverable after failures (process crash, network failure, pod termination)
- Must maintain session isolation and security

## Goals / Non-Goals

**Goals:**
- UI independence: Agent runtime contains no UI-specific logic
- Complete interaction history: Capture all events for reconstruction
- Replayability: Reconstruct state from event streams
- Recoverability: Resume after failures without losing logical state
- Multiple UI surfaces: Single event stream supports multiple projections
- Provider independence: Abstract model provider interface
- Capability independence: Abstract capability interfaces

**Non-Goals:**
- General-purpose workflow orchestration
- Distributed consensus
- Full multi-agent orchestration
- Enterprise identity architecture
- Complete secrets management
- Building replacements for Kubernetes, GitHub, or UI frameworks

## Decisions

### 1. Event-sourced architecture

**Decision:** Use event sourcing as the core architectural pattern.

**Rationale:**
- Natural fit for interaction history and replay
- Enables UI disposability and reconstruction
- Supports recovery from failures
- Provides audit trail for compliance

**Alternatives considered:**
- Request/response with database: Simpler but loses interaction history and replay capability
- CRDT-based state: Better for collaboration but adds complexity without clear benefit for this use case

### 2. JSON Schema for event definitions

**Decision:** Use JSON Schema for event type definitions.

**Rationale:**
- Wide tooling support (validation, documentation, code generation)
- Human-readable and editable
- Compatible with multiple programming languages
- Good balance between rigor and flexibility

**Alternatives considered:**
- Protobuf: Better performance but adds compilation step and reduces flexibility
- Avro: Good schema evolution but less tooling support
- TypeScript types: Language-specific, limits cross-platform support

### 3. In-memory event store with persistence layer

**Decision:** Start with in-memory event store, add persistence later.

**Rationale:**
- Enables rapid prototyping and testing
- Persistence can be added without changing the core interface
- Allows focus on event semantics before storage mechanics
- Supports multiple persistence backends (file, database, message queue)

**Alternatives considered:**
- Database-first: Adds complexity early without clear benefit for prototyping
- File-based: Simpler but less flexible for future requirements

### 4. WebSocket for real-time projection

**Decision:** Use WebSocket for real-time event delivery to UI surfaces.

**Rationale:**
- Bidirectional communication for user input and event delivery
- Low latency for streaming events
- Well-supported in all target platforms (CLI, VS Code, Web, Desktop)
- Can fall back to HTTP long-polling if needed

**Alternatives considered:**
- Server-Sent Events: Simpler but unidirectional, requires separate channel for user input
- gRPC: Better performance but adds complexity for UI integration
- HTTP polling: Higher latency, more network overhead

### 5. Capability abstraction layer

**Decision:** Define capabilities as abstract interfaces with typed parameters and results.

**Rationale:**
- Enables provider independence
- Supports testing with mocks
- Clear boundary between agent runtime and external systems
- Allows capability implementations to evolve independently

**Alternatives considered:**
- Direct API calls: Simpler but creates tight coupling
- Plugin system: More flexible but adds complexity without clear benefit

## Risks / Trade-offs

### Risk: Event schema evolution

**Impact:** High - breaking changes to event schema can invalidate existing event stores.

**Mitigation:**
- Schema versioning with backward compatibility rules
- Event migration utilities for schema changes
- Testing schema evolution in CI/CD

### Risk: Performance overhead of event sourcing

**Impact:** Medium - event sourcing adds overhead compared to direct state updates.

**Mitigation:**
- Optimize event append path
- Use snapshots for large event streams
- Profile and optimize critical paths

### Risk: Complexity of session recovery

**Impact:** Medium - recovering session state from events is complex.

**Mitigation:**
- Start with simple recovery scenarios
- Add complexity incrementally
- Comprehensive testing of recovery paths

### Risk: UI projection consistency

**Impact:** Low - different UI surfaces may interpret events differently.

**Mitigation:**
- Define clear projection contracts
- Test each projection independently
- Provide reference implementations

### Trade-off: Flexibility vs. Complexity

Event sourcing provides flexibility and auditability but adds complexity. This is acceptable for an enterprise platform where these properties are valuable.

### Trade-off: Real-time vs. Simplicity

WebSocket provides real-time delivery but adds complexity compared to HTTP. This is acceptable for the interactive nature of the platform.
