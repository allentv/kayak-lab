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

Run the code reviewer agent before merging:

```bash
# Ensure tests pass first
deno test --allow-read --allow-env --allow-run
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
