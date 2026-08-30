# kayak-lab

Event-sourced agent interaction platform built with Deno 2.

## Quick Start

```bash
# Run tests
deno test --allow-read --allow-env

# Type check
deno check src/**/*.ts

# Format
deno fmt

# Lint
deno lint
```

## Architecture

```
src/
├── types/          Event schema and type definitions
├── core/           Event stream and session manager
├── store/          Event persistence and replay
└── __tests__/      End-to-end tests
```

## Documentation

- [OpenSpec Analysis](docs/openspec-analysis.md) — Pros/cons of using OpenSpec for this project
- [Learnings](docs/learnings.md) — Patterns, decisions, and gotchas discovered during development
- [Agents](AGENTS.md) — Code reviewer and other agent configurations

## OpenSpec

This project uses OpenSpec for specification-driven development.

```bash
# Check change status
openspec status --change agent-interaction-control-plane

# Validate specs
openspec validate agent-interaction-control-plane
```

Change artifacts are in `openspec/changes/agent-interaction-control-plane/`.

## License

ISC
