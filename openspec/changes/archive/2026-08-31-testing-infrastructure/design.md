## Context

Current tests (112+) each create their own mocks inline. `src/__tests__/benchmarks.test.ts` has some shared setup. No fixture files, no test builders, no integration harness. As projections, capabilities, and cross-cutting concerns are added, test boilerplate will explode.

## Goals / Non-Goals

**Goals:**
- Reduce test boilerplate with reusable mocks and helpers
- Provide fixture management for regression testing
- Create integration test harness for end-to-end testing
- Standardize test patterns across the codebase

**Non-Goals:**
- Test coverage tooling (use Deno's built-in)
- Visual regression testing
- Load/stress testing framework (separate from benchmarks)
- Test generation from specs

## Decisions

### 1. In-project test utilities

**Decision:** Test utilities live in `src/__test-utils__/` alongside the code they test.

**Rationale:**
- Co-located with test files
- Easy to import
- No external dependency

### 2. JSON fixtures

**Decision:** Fixtures are JSON files in `fixtures/` directory.

**Rationale:**
- Simple to create and edit
- Human-readable
- Version-controlled

### 3. Builder pattern for test data

**Decision:** Use builder pattern for creating test sessions and events.

**Rationale:**
- Fluent API makes tests readable
- Default values reduce boilerplate
- Customization where needed

## Risks / Trade-offs

### Risk: Test utility bloat

**Impact:** Low — utilities are only added when needed by multiple tests.

**Mitigation:** Review test utilities quarterly. Remove unused helpers.