# Code Reviewer

Reviews code for quality, simplified abstractions, file decomposition needs, and test improvements.

## Usage

```
Use the Code Reviewer agent to review src/
```

## Quick Spawn

```typescript
const result = await task({
  agent: "reviewer",
  task: `Review the kayak-lab codebase. See agents/reviewer.md for checklist and output schema.`,
});
```

## Full Spawn Example

```typescript
const result = await task({
  agent: "reviewer",
  context: `Project: kayak-lab — an event-sourced agent interaction platform in TypeScript (Deno).
Source root: src/
Test root: src/*/__tests__/

Completed phases so far:
- Core Event Stream (src/core/event-stream.ts, src/types/events.ts)
- Session Manager (src/core/session-manager.ts)
- Agent Runtime (src/runtime/agent-runtime.ts)
- Model Abstraction (src/runtime/model-provider.ts)
- Tool Registry (src/runtime/tool-registry.ts)
- Capabilities (src/capabilities/capability.ts, git.ts, shell.ts)
- Event Store (src/store/event-store.ts)

All tests pass: 112 tests across 10 suites.`,
  outputSchema: {
    type: "object",
    properties: {
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            body: { type: "string" },
            priority: { type: "number" },
            confidence: { type: "number" },
            file_path: { type: "string" },
            line_start: { type: "number" },
            line_end: { type: "number" },
          },
          required: ["title", "body", "priority", "confidence", "file_path", "line_start", "line_end"],
        },
      },
      summary: { type: "string" },
    },
    required: ["findings", "summary"],
  },
  task: `Review the kayak-lab codebase for code quality, file decomposition needs, simplified abstractions, and test improvements. Follow the review checklist.

## Pre-Review Steps
1. Run \`deno task check\` — ensure no type errors
2. Run \`deno lint\` — ensure no lint errors
3. Run \`deno task test\` — ensure all tests pass

Only proceed with code review if all three pass.

## Review Checklist
1. **File Decomposition** — Files exceeding ~400 lines should be decomposed. Identify cohesive groups that can be extracted. Prefer splitting by responsibility (types, implementation, errors, utilities).
2. **Abstraction Quality** — Unnecessary abstractions, over-engineering, leaky abstractions, missing abstractions.
3. **Correctness** — Bugs, edge cases, type safety, error handling.
4. **Test Coverage** — Missing tests, tests that don't verify payload/state, uncovered edge cases.
5. **Simplification** — Inlineable code, dead code, unused exports, redundant logic.

## Files to review
Read ALL source files and test files under src/.

Pay special attention to:
- Files over 400 lines that should be decomposed
- The mod.ts index files — do they re-export everything needed?
- Unused imports or parameters
- Consistency of error handling patterns across modules`,
});
```

## Review Checklist

1. **File Decomposition**
   - Files exceeding ~400 lines should be decomposed
   - Identify cohesive groups of types, functions, or classes that can be extracted
   - Prefer splitting by responsibility (types, implementation, errors, utilities)
   - Ensure split files maintain clear imports and no circular dependencies
   - When decomposing, update index files to re-export from new locations

2. **Abstraction Quality**
   - Unnecessary abstractions or over-engineering
   - Leaky abstractions that expose implementation details
   - Missing abstractions that would simplify code

3. **Correctness**
   - Potential bugs or edge cases
   - Type safety issues
   - Error handling gaps

4. **Test Coverage**
   - Missing unit tests for new functionality
   - Tests that don't verify payload/state changes
   - Edge cases not covered (empty states, boundaries)

5. **Simplification**
   - Code that can be inlined
   - Dead code or unused exports
   - Redundant logic

## Output Format

```typescript
interface ReviewFinding {
  title: string;
  body: string;
  priority: 1 | 2 | 3;  // 1=critical, 2=important, 3=minor
  confidence: number;     // 0-1
  file_path: string;
  line_start: number;
  line_end: number;
}
```

## Tips

- **Run pre-review checks first**: `deno task check`, `deno lint`, and `deno task test` must all pass before reviewing
- **Be specific**: Point the reviewer at specific files or directories
- **Apply selectively**: Not all findings need to be fixed; use judgment
- **Verify after changes**: Always run tests after applying review findings
