## 1. Core Event Stream

- [x] 1.1 Define event schema with required fields (event_id, session_id, sequence_number, timestamp, event_type, schema_version, payload, metadata)
- [x] 1.2 Implement event append operation with immutability guarantee
- [x] 1.3 Implement event ordering with sequence number validation
- [x] 1.4 Implement session isolation for concurrent sessions
- [x] 1.5 Add event type registry and validation

## 2. Session Manager

- [x] 2.1 Implement session creation with unique session_id generation
- [x] 2.2 Implement session state machine (active → paused → active, active → completed, active → failed, active → cancelled)
- [x] 2.3 Implement session pause/resume operations
- [x] 2.4 Implement session completion and failure handling
- [x] 2.5 Add session resumption from event stream

## 3. Agent Runtime

- [x] 3.1 Implement agent loop with input processing, model invocation, and tool execution
- [x] 3.2 Implement context management with accumulation and windowing
- [x] 3.3 Implement tool invocation with typed parameters and results
- [x] 3.4 Add tool failure handling and timeout support
- [x] 3.5 Implement streaming model response handling

## 4. Model Abstraction

- [x] 4.1 Define provider-agnostic model invocation interface
- [x] 4.2 Implement provider configuration and switching
- [x] 4.3 Add provider fallback support
- [x] 4.4 Implement streaming and non-streaming response handling

## 5. Capability Layer

- [x] 5.1 Define Git capability interface (status, changes, commit)
- [x] 5.2 Implement Git capability with abstract interface
- [ ] 5.3 Define GitHub capability interface (issues, pull requests, repository management)
- [ ] 5.4 Implement GitHub capability with abstract interface
- [x] 5.5 Define Shell capability interface (command execution, working directory, environment)
- [x] 5.6 Implement Shell capability with safety constraints
- [ ] 5.7 Define Kubernetes capability interface (resource management, status, mutations)
- [ ] 5.8 Implement Kubernetes capability with cluster abstraction

## 6. Projection Protocol

- [ ] 6.1 Define subscription protocol for UI surfaces
- [ ] 6.2 Implement event delivery with ordering guarantees
- [ ] 6.3 Add reconnection and event gap handling
- [ ] 6.4 Implement subscription filtering by event type

## 7. Terminal Projection

- [ ] 7.1 Implement terminal event rendering with styling
- [ ] 7.2 Implement user input capture and event emission
- [ ] 7.3 Add session management through CLI
- [ ] 7.4 Implement streaming display updates

## 8. Event Store

- [x] 8.1 Implement in-memory event store with persistence interface
- [x] 8.2 Add event retrieval by session and range
- [x] 8.3 Implement full and partial replay support
- [x] 8.4 Add snapshot support for large event streams
- [x] 8.5 Implement crash recovery and corrupted event handling
- [x] 8.6 Fix EventStoreBridge timeout and error handling (commit 32ca4f5)

## 9. Integration and Testing

- [x] 9.1 Create integration tests for event stream and session manager
- [x] 9.2 Create integration tests for agent runtime and model abstraction
- [x] 9.3 Create integration tests for capability layer
- [ ] 9.4 Create integration tests for projection protocol and terminal
- [x] 9.5 Create end-to-end tests for complete interaction flows
- [ ] 9.6 Add performance benchmarks for critical paths

---

## Implementation Log

| Commit | Date | Description |
|--------|------|-------------|
| 48ef196 | 2026-08-30 | feat: agent runtime, model abstraction, tool registry, capabilities |
| 32ca4f5 | 2026-08-30 | fix: shell timeout signal, ToolTimeoutError args, EventStoreBridge docs |

### Test Status
- **112 tests passing** across 10 test suites
- Runtime: agent-runtime, model-provider, tool-registry
- Capabilities: capability-registry, git, shell
- Core: event-stream, session-manager
- Store: event-store
- E2E: session lifecycle
