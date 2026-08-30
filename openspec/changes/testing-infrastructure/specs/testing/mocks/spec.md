## Purpose

Reusable mock implementations for all major interfaces (capabilities, model providers, event stores) to reduce test boilerplate and ensure consistent test behavior.

## ADDED Requirements

### Requirement: Mock capabilities

Pre-built mock implementations MUST be available for all capability interfaces.

#### Scenario: Mock Git capability
- **WHEN** a test needs a Git capability
- **THEN** `MockGitCapability` is available with configurable responses for each method

#### Scenario: Mock GitHub capability
- **WHEN** a test needs a GitHub capability
- **THEN** `MockGitHubCapability` is available with configurable responses

#### Scenario: Mock Shell capability
- **WHEN** a test needs a Shell capability
- **THEN** `MockShellCapability` is available with configurable command responses

#### Scenario: Configurable behavior
- **WHEN** a mock is configured with a response
- **THEN** the mock returns that response for the specified method call

#### Scenario: Call tracking
- **WHEN** a mock method is called
- **THEN** the call is recorded (method name, arguments, timestamp) for assertions

### Requirement: Mock model provider

A mock model provider MUST be available for testing agent runtime.

#### Scenario: Mock responses
- **WHEN** the mock model provider is configured with responses
- **THEN** it returns those responses in order for each invocation

#### Scenario: Streaming mock
- **WHEN** a test needs streaming behavior
- **THEN** the mock can yield chunks over time to simulate streaming

#### Scenario: Error simulation
- **WHEN** the mock is configured to fail
- **THEN** it throws the specified error on the next invocation

### Requirement: Mock event store

A mock event store MUST be available for testing projections and bridges.

#### Scenario: Pre-loaded events
- **WHEN** the mock store is created with events
- **THEN** those events are immediately available for reading

#### Scenario: Event capture
- **WHEN** events are stored in the mock
- **THEN** they are recorded for later assertion