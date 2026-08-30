# Agents

Reusable agent configurations for kayak-lab.

---

## Code Reviewer

Reviews code for quality, simplified abstractions, and test improvements.

### Usage

```
Use the Code Reviewer agent to review src/
```

### Configuration

```typescript
const codeReviewerConfig = {
  agent: "reviewer",
  task: `Review the kayak-lab implementation for code quality, simplified abstractions, and test improvements. Focus on: (1) identifying unnecessary abstractions or over-engineering, (2) finding potential bugs or edge cases, (3) suggesting test improvements for better coverage, (4) recommending simplifications. Read all source files and tests, then provide a structured review with specific actionable items.`,
};
```

### Review Checklist

The reviewer checks for:

1. **Abstraction Quality**
   - Unnecessary abstractions or over-engineering
   - Leaky abstractions that expose implementation details
   - Missing abstractions that would simplify code

2. **Correctness**
   - Potential bugs or edge cases
   - Type safety issues
   - Error handling gaps

3. **Test Coverage**
   - Missing unit tests for new functionality
   - Tests that don't verify payload/state changes
   - Edge cases not covered (empty states, boundaries)

4. **Simplification**
   - Code that can be inlined
   - Dead code or unused exports
   - Redundant logic

### Output Format

The reviewer returns findings as:

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

### Example

```typescript
// Spawn code reviewer
const result = await task({
  agent: "reviewer",
  task: `Review src/core/event-stream.ts for code quality and test coverage.`,
});

// Result includes findings array with actionable items
```

---

## Adding New Agents

To add a new agent:

1. Create a new section in this file
2. Document the agent's purpose and configuration
3. Include usage examples
4. Add any relevant checklists or output formats

### Agent Types

| Agent | Purpose | Speed |
|-------|---------|-------|
| `task` | General-purpose with full capabilities | Medium |
| `scout` | Read-only research and code analysis | Fast |
| `reviewer` | Code quality and security analysis | Medium |
| `designer` | UI/UX implementation and review | Medium |

---

## Running Code Review

### Manual

```bash
# Run all tests first
deno test --allow-read --allow-env

# Then spawn code reviewer
# (via task subagent in OMP)
```

### Automated

Code review can be triggered:

- After completing a phase of work
- Before committing significant changes
- When asked to "review the code"

### Integration with OpenSpec

When working on an OpenSpec change:

1. Complete implementation tasks
2. Run code reviewer on changed files
3. Apply findings
4. Verify tests still pass
5. Commit and archive

---

## Tips

- **Be specific**: Point the reviewer at specific files or directories
- **Run tests first**: Ensure code compiles and tests pass before review
- **Apply selectively**: Not all findings need to be fixed; use judgment
- **Verify after changes**: Always run tests after applying review findings
