## 1. Core Event Stream

- [ ] 1.1 Define event schema with required fields (event_id, session_id, sequence_number, timestamp, event_type, schema_version, payload, metadata)
- [ ] 1.2 Implement event append operation with immutability guarantee
- [ ] 1.3 Implement event ordering with sequence number validation
- [ ] 1.4 Implement session isolation for concurrent sessions
- [ ] 1.5 Add event type registry and validation

## 2. Session Manager

- [ ] 2.1 Implement session creation with unique session_id generation
- [ ] 2.2 Implement session state machine (active → paused → active, active → completed, active → failed, active → cancelled)
- [ ] 2.3 Implement session pause/resume operations
- [ ] 2.4 Implement session completion and failure handling
- [ ] 2.5 Add session resumption from event stream

## 3. Agent Runtime

- [ ] 3.1 Implement agent loop with input processing, model invocation, and tool execution
- [ ] 3.2 Implement context management with accumulation and windowing
- [ ] 3.3 Implement tool invocation with typed parameters and results
- [ ] 3.4 Add tool failure handling and timeout support
- [ ] 3.5 Implement streaming model response handling

## 4. Model Abstraction

- [ ] 4.1 Define provider-agnostic model invocation interface
- [ ] 4.2 Implement provider configuration and switching
- [ ] 4.3 Add provider fallback support
- [ ] 4.4 Implement streaming and non-streaming response handling

## 5. Capability Layer

- [ ] 5.1 Define Git capability interface (status, changes, commit)
- [ ] 5.2 Implement Git capability with abstract interface
- [ ] 5.3 Define GitHub capability interface (issues, pull requests, repository management)
- [ ] 5.4 Implement GitHub capability with abstract interface
- [ ] 5.5 Define Shell capability interface (command execution, working directory, environment)
- [ ] 5.6 Implement Shell capability with safety constraints
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

- [ ] 8.1 Implement in-memory event store with persistence interface
- [ ] 8.2 Add event retrieval by session and range
- [ ] 8.3 Implement full and partial replay support
- [ ] 8.4 Add snapshot support for large event streams
- [ ] 8.5 Implement crash recovery and corrupted event handling

## 9. Integration and Testing

- [ ] 9.1 Create integration tests for event stream and session manager
- [ ] 9.2 Create integration tests for agent runtime and model abstraction
- [ ] 9.3 Create integration tests for capability layer
- [ ] 9.4 Create integration tests for projection protocol and terminal
- [ ] 9.5 Create end-to-end tests for complete interaction flows
- [ ] 9.6 Add performance benchmarks for critical paths
