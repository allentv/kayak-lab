## Why

Tests are ad-hoc — each test file creates its own mocks and setup. There's no shared test infrastructure, no fixture management, and no integration test harness. As the codebase grows, test duplication and inconsistency will slow development.

## What Changes

- **Mock registry**: Reusable mocks for capabilities, model providers, and event stores
- **Test helpers**: Common setup/teardown, assertion utilities, test data generators
- **Fixture management**: Load/save test fixtures for event streams and session state
- **Integration test harness**: Pre-configured test environment for end-to-end testing

### New Capabilities

- `testing/mocks`: Reusable mock implementations for all major interfaces
- `testing/helpers`: Common test utilities and data generators
- `testing/fixtures`: Test fixture management
- `testing/harness`: Integration test environment