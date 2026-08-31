## Why

kayak-lab is a Deno 2 project with no tool version pinning. Agents and new contributors must manually install deno and guess the correct version. mise is already installed globally (managing ripgrep and uv) but has no project-level config. Adding a `.mise.toml` pins deno for this project, making agent environments identical on entry.

## What Changes

- Add `.mise.toml` to project root pinning deno (latest 2.x minor)
- Add `.mise.lock` to gitignore (generated file, not committable)
- No global config changes — scope is project-local only

## Capabilities

### New Capabilities

- `dev-toolchain`: Project-level mise configuration for managing deno and future tooling

### Modified Capabilities

None — this is additive infrastructure, no existing behavior changes.

## Non-Goals

- Pinning deno to a specific patch version (minor-track is sufficient; agents get latest compatible)
- Adding tools beyond deno (will grow with project needs)
- Global mise config changes (ripgrep and uv stay as-is)
- CI/CD integration (separate concern)
