# Code Reviewer

Reviews code for quality, simplified abstractions, file decomposition needs, and test improvements.

## Usage

```
Use the Code Reviewer agent to review specific files
```

## Quick Spawn (Targeted)

```typescript
const result = await task({
  agent: "reviewer",
  task: `Review these files for code quality issues:
- src/provenance/types.ts
- src/provenance/graph.ts
- src/provenance/classifier.ts
Focus on: correctness, duplication, type safety, test gaps.`,
});
```

## Full Spawn Example

```typescript
const result = await task({
  agent: "reviewer",
  context: `Project: kayak-lab — an event-sourced agent interaction platform in TypeScript (Deno).
Source root: src/
Test root: src/*/__tests__/`,
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
  task: `Review the specified files for code quality issues.

## Review Focus (in order of priority)
1. **Correctness** — Bugs, edge cases, type safety, error handling
2. **Duplication** — Repeated logic that should be extracted
3. **Type Safety** — Unchecked casts, `as any`, missing validation
4. **Simplification** — Inlineable code, dead code, unused exports

## Files to review
Read ONLY the files listed in the task. Do NOT scan the entire codebase.

For each finding:
- Quote the exact code snippet
- Explain the issue
- Suggest a concrete fix

Skip style issues, naming conventions, and documentation gaps — focus on correctness and maintainability.`,
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

## Review CLI

A standalone `deno task review` command pre-filters hotspots before LLM review:

```bash
deno task review                      # all checks
deno task review --only file-size     # one check
deno task review --skip preflight     # skip preflight
deno task review --fail-on 1          # CI gate on critical findings
```

The CLI delegates to `deno lint`, `deno check`, `knip`, and `madge`, plus three custom checks: file-size decomposition, test-file pairing, and mod.ts re-export coverage.

Findings follow the same `ReviewFinding` schema below — feed them directly into the LLM reviewer for targeted analysis.

## Tips

- **Run pre-review checks first**: `deno task check`, `deno lint`, and `deno task test` must all pass before reviewing
- **Be specific**: Point the reviewer at specific files or directories
- **Apply selectively**: Not all findings need to be fixed; use judgment
- **Verify after changes**: Always run tests after applying review findings
