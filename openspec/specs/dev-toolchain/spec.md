# dev-toolchain Specification

## Purpose

Project-level mise configuration that pins deno for kayak-lab, ensuring consistent tool versions across all development and agent environments.

## Requirements

### Requirement: Deno version pinned via mise

The project MUST declare a deno version in `.mise.toml` at the project root.

#### Scenario: Agent enters kayak-lab directory
- **WHEN** an agent or developer `cd`s into the kayak-lab directory
- **THEN** mise activates and `deno` is on PATH at the pinned version

#### Scenario: Deno version is minor-track
- **WHEN** the pinned deno version specifies a minor (e.g. `2.9`)
- **THEN** mise resolves to the latest compatible patch release (e.g. `2.9.6`)

### Requirement: No global config changes

The project-level `.mise.toml` MUST NOT modify or depend on entries in `~/.config/mise/config.toml`.

#### Scenario: Global config unchanged
- **WHEN** a developer has existing global mise tools (ripgrep, uv)
- **THEN** those tools remain functional and unaffected by project activation

### Requirement: Gitignore covers mise artifacts

The `.gitignore` MUST include `.mise.lock` (the lock file mise generates).

#### Scenario: Lock file not committed
- **WHEN** mise generates a `.mise.lock` file in the project root
- **THEN** git status does not show it as an untracked file

### Requirement: Tool list is extensible

The `.mise.toml` format MUST support adding tools beyond deno without structural changes.

#### Scenario: Adding a new tool later
- **WHEN** a developer adds e.g. `node = "22"` to the `[tools]` section
- **THEN** mise installs and activates that tool alongside deno on next activation
