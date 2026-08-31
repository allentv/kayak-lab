## Purpose

Integration test harness that provides a pre-configured test environment with real components wired together.

## ADDED Requirements

### Requirement: Test environment

The harness MUST provide a fully wired test environment.

#### Scenario: Create environment
- **WHEN** `createTestEnvironment()` is called
- **THEN** an environment with in-memory event store, mock capabilities, and mock model provider is returned

#### Scenario: Environment lifecycle
- **WHEN** the test is complete
- **THEN** `environment.cleanup()` disposes all resources

#### Scenario: Custom configuration
- **WHEN** `createTestEnvironment({ persistence: "real" })` is called
- **THEN** the environment uses a real persistent store in a temp directory

### Requirement: Agent runtime in harness

The harness MUST provide a ready-to-use agent runtime.

#### Scenario: Get runtime
- **WHEN** `environment.getRuntime()` is called
- **THEN** an agent runtime configured with mock capabilities and model provider is returned

#### Scenario: Run agent interaction
- **WHEN** `environment.runInteraction("hello")` is called
- **THEN** a session is created, the message is processed, and the session with events is returned

### Requirement: Event store in harness

The harness MUST provide an event store for testing projections.

#### Scenario: Get event store
- **WHEN** `environment.getEventStore()` is called
- **THEN** an event store (in-memory or persistent) is returned

#### Scenario: Pre-loaded events
- **WHEN** the environment is created with `events: [...]`
- **THEN** those events are loaded into the event store