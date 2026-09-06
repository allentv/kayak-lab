# Contributing

## Development Setup

```bash
git clone https://github.com/allentv/kayak-lab.git
cd kayak-lab

# Run tests
deno test --allow-read --allow-env --allow-run

# Type check
deno check src/**/*.ts

# Format and lint
deno fmt
deno lint
```

## Project Conventions

- **TypeScript** — strict mode, no `any` unless unavoidable
- **Deno** — no Node.js dependencies, use Deno std lib
- **Events** — all state changes emit events to the EventStream
- **Interfaces** — capabilities and providers use abstract interfaces for testability
- **Tests** — `Deno.test` with `t.step` for nested organization

## Adding Features

1. Create an OpenSpec change: `openspec new change "my-feature"`
2. Write proposal, specs, design, tasks
3. Implement tasks in order
4. Verify tests pass
5. Commit with conventional commit message

## Commit Messages

```
feat: add new capability for X
fix: handle edge case in Y
spec: add OpenSpec change for Z
docs: update README with W
test: add tests for V
```

## Code Review

Run the review CLI before merging. It auto-discovers checks and tool delegates against `src/`, producing prioritized findings:

```bash
# Run all checks
deno task review

# Run a specific check
deno task review --only file-size

# Skip the preflight gate
deno task review --skip preflight

# CI mode: exit 1 if any critical findings
deno task review --fail-on 1
```

**Adding a custom check:** Drop a `.ts` file in `review/checks/` exporting a default `ReviewCheck`. It is auto-discovered on the next run — no wiring needed.

```typescript
import type { Finding, ReviewCheck, ReviewContext } from "../types.ts";

const check: ReviewCheck = {
  name: "my-check",
  description: "What this check does",
  async run(ctx: ReviewContext): Promise<Finding[]> {
    const findings: Finding[] = [];
    // scan ctx.files, produce findings
    return findings;
  },
};

export default check;
```

**Adding a tool delegate:** Same contract as checks but typically spawns a subprocess. Drop a `.ts` file in `review/delegate/`:

```typescript
import type { Finding, ReviewCheck } from "../types.ts";

const check: ReviewCheck = {
  name: "my-tool",
  description: "Runs an external tool",
  async run(): Promise<Finding[]> {
    const cmd = new Deno.Command("my-tool", { args: [...], stdout: "piped" });
    const output = await cmd.output();
    // parse output into Finding[]
    return findings;
  },
};

export default check;
```

## OpenSpec Workflow

This project uses [OpenSpec](https://github.com/allentv/openspec) for specification-driven development.

```bash
# Check change status
openspec status --change <change-name>

# List all changes
openspec list

# Start implementing
openspec instructions apply --change <change-name> --json
```

See [OpenSpec Analysis](../docs/openspec-analysis.md) for details on how OpenSpec is used in this project.
