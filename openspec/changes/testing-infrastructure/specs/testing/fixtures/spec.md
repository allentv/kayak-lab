## Purpose

Test fixture management for loading, saving, and sharing test data across test files.

## ADDED Requirements

### Requirement: Fixture loading

Test fixtures MUST be loadable from fixture files.

#### Scenario: Load fixture
- **WHEN** `loadFixture("sessions/basic")` is called
- **THEN** the fixture file at `fixtures/sessions/basic.json` is loaded and parsed

#### Scenario: Fixture format
- **WHEN** a fixture is loaded
- **THEN** it returns a typed object matching the expected schema

#### Scenario: Missing fixture
- **WHEN** a fixture file does not exist
- **THEN** a clear error is thrown with the expected path

### Requirement: Fixture saving

Test results MUST be saveable as fixtures for regression testing.

#### Scenario: Save fixture
- **WHEN** `saveFixture("output/result", data)` is called
- **THEN** the data is serialized and written to `fixtures/output/result.json`

### Requirement: Fixture data

Pre-built fixtures MUST be provided for common test scenarios.

#### Scenario: Basic session fixture
- **WHEN** `loadFixture("sessions/basic")` is called
- **THEN** a session with 5 events (created, thinking, tool_call, tool_result, completed) is returned

#### Scenario: Multi-session fixture
- **WHEN** `loadFixture("sessions/multi")` is called
- **THEN** 3 sessions with different states are returned