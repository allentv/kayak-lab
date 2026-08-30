# Learning Scout

Captures implementation learnings, patterns, and gotchas for documentation.

## Usage

```
Use the Learning Scout to scan for learnings after completing a phase
```

## Quick Spawn

```typescript
const result = await task({
  agent: "scout",
  task: `Scan kayak-lab for learnings to document. See agents/scout.md for details.`,
});
```

## Full Spawn Example

```typescript
const result = await task({
  agent: "scout",
  context: `Project: kayak-lab — event-sourced agent interaction platform in TypeScript (Deno).

Recent implementation completed:
- Core Event Stream (event sourcing, immutability, sequence validation)
- Session Manager (state machine, pause/resume, completion/failure)
- Agent Runtime (agent loop, context management, tool invocation, streaming)
- Model Abstraction (provider registration, fallback, streaming)
- Tool Registry (typed params/results, timeout, failure handling)
- Capabilities (Git, Shell with safety constraints)
- Event Store (in-memory, snapshots, replay)`,
  task: `Review the kayak-lab codebase for implementation learnings that should be documented. Focus on:

1. Read docs/learnings.md to see what's already recorded
2. Scan src/ for any patterns, workarounds, or decisions that future developers should know about
3. Look for:
   - Non-obvious Deno/TypeScript patterns used
   - Event sourcing design decisions and their rationale
   - Interface design choices (why methods are named a certain way)
   - Testing patterns specific to this project
   - Any gotchas or pitfalls encountered

Report findings as a list of learning entries with category, title, and description. Each should be something a future developer would benefit from knowing.`,
});
```

## What to Capture

- **Deno/TypeScript patterns**: Permission requirements, strict mode gotchas, generic workarounds
- **Event sourcing decisions**: Why sequences start at 1, why arrays are frozen, append API design
- **Interface design**: Compound method names, immutable returns, result type patterns
- **Testing patterns**: Mock setup, error assertion approaches, Deno.test conventions
- **Safety constraints**: Blocked vs dangerous commands, timeout handling, output limits

## Output Format

Report findings as a structured list:

```typescript
interface Learning {
  category: string;      // e.g., "Deno/TypeScript", "Event Sourcing", "Testing"
  title: string;         // Short, descriptive title
  description: string;   // What was learned and why it matters
  severity: "high" | "medium" | "low";  // Impact on future developers
}
```
