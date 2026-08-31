## 1. Mock Registry

- [x] 1.1 Create `src/__test-utils__/mocks/mock-git.ts` with `MockGitCapability` implementing `IGitCapability`. Configurable responses, call tracking. Verify: mock compiles and tracks calls.
- [x] 1.2 Create `src/__test-utils__/mocks/mock-github.ts` with `MockGitHubCapability`. Verify: mock compiles.
- [x] 1.3 Create `src/__test-utils__/mocks/mock-shell.ts` with `MockShellCapability`. Verify: mock compiles.
- [x] 1.4 Create `src/__test-utils__/mocks/mock-model.ts` with `MockModelProvider`. Configurable responses, streaming, error simulation. Verify: mock compiles.
- [x] 1.5 Create `src/__test-utils__/mocks/mock-event-store.ts` with pre-loaded events and event capture. Verify: mock compiles.

## 2. Test Helpers

- [x] 2.1 Create `src/__test-utils__/helpers/session-builder.ts` with `createTestSession()` builder. Verify: builds sessions with default and custom events.
- [x] 2.2 Create `src/__test-utils__/helpers/event-generators.ts` with `generateSessionEvent()`, `generateEventSequence()`. Verify: generates valid events.
- [x] 2.3 Create `src/__test-utils__/helpers/assertions.ts` with `assertEventEquals()`, `assertCapabilitySuccess()`. Verify: assertions work correctly.

## 3. Fixtures

- [x] 3.1 Create `src/__test-utils__/fixtures/loader.ts` with `loadFixture()`, `saveFixture()`. Verify: loads and saves JSON fixtures.
- [x] 3.2 Create `fixtures/sessions/basic.json` with a 5-event session. Verify: fixture loads correctly.
- [x] 3.3 Create `fixtures/sessions/multi.json` with 3 sessions. Verify: fixture loads correctly.

## 4. Integration Harness

- [x] 4.1 Create `src/__test-utils__/harness/environment.ts` with `createTestEnvironment()`. Returns wired environment with mock capabilities and in-memory store. Verify: environment creates and cleans up.
- [x] 4.2 Add `getRuntime()` to harness that returns configured agent runtime. Verify: runtime processes messages.
- [x] 4.3 Add `runInteraction(message)` to harness for quick end-to-end testing. Verify: returns session with events.
- [x] 4.4 Add `getEventStore()` to harness for projection testing. Verify: store available and functional.

## 5. Migration

- [x] 5.1 Identify 3 existing test files with duplicated mock setup. Verify: files identified.
- [x] 5.2 Refactor identified tests to use new mock registry and helpers. Verify: tests still pass.
- [x] 5.3 Verify all 112+ tests still pass after refactoring. Verify: `deno test` passes.
