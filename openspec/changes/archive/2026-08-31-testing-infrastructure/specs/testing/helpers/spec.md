## Purpose

Common test utilities, assertion helpers, and data generators to reduce boilerplate and improve test readability.

## ADDED Requirements

### Requirement: Session test builder

A test builder MUST be available for creating test sessions with events.

#### Scenario: Build session with defaults
- **WHEN** `createTestSession()` is called
- **THEN** a session with 5 default events is created and returned

#### Scenario: Build session with custom events
- **WHEN** `createTestSession({ eventCount: 10, eventTypes: [...] })` is called
- **THEN** a session with 10 events of the specified types is created

#### Scenario: Build session with state
- **WHEN** `createTestSession({ state: { key: "value" } })` is called
- **THEN** the session contains the specified state

### Requirement: Event generators

Reusable event generators MUST be available for common event types.

#### Scenario: Generate session event
- **WHEN** `generateSessionEvent(type)` is called
- **THEN** a valid event of the specified type is returned with all required fields

#### Scenario: Generate event sequence
- **WHEN** `generateEventSequence(count, session_id)` is called
- **THEN** a sequence of `count` events with incrementing sequence numbers is returned

### Requirement: Assertion helpers

Custom assertion helpers MUST be available for common test patterns.

#### Scenario: Assert event equals
- **WHEN** `assertEventEquals(actual, expected)` is called
- **THEN** the events are compared field-by-field (ignoring timestamp and event_id)

#### Scenario: Assert capability result
- **WHEN** `assertCapabilitySuccess(result)` is called
- **THEN** it verifies `result.success === true` and `result.data` is defined