## Why

The platform currently only has a terminal projection. The design doc specifies multiple UI surfaces: CLI, VS Code, Web, Desktop, API. Each surface needs its own projection to render events appropriately for its environment. Without these, the platform is limited to terminal-only interaction.

## What Changes

Add projection implementations for four additional UI surfaces:

- **VS Code Extension**: Tree view, output panel, status bar integration for agent interactions within VS Code
- **Web UI**: Browser-based interface using the WebSocket projection for real-time event display
- **Desktop App**: Native desktop application (Tauri) wrapping the Web UI with system integration
- **REST API**: HTTP API for programmatic access to agent sessions and events

### New Capabilities

- `projection/vscode`: VS Code extension projection
- `projection/web`: Web browser projection
- `projection/desktop`: Desktop application projection
- `projection/rest-api`: REST API projection

## Capabilities

### New Capabilities

- `projection/vscode`: VS Code extension for agent interaction
- `projection/web`: Web browser UI for agent interaction
- `projection/desktop`: Desktop app (Tauri) for agent interaction
- `projection/rest-api`: REST API for programmatic agent access
