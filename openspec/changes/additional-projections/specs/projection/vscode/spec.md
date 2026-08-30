## Purpose

VS Code extension projection that surfaces agent interactions within the VS Code IDE, providing inline code suggestions, a tree view for sessions, and output panel for event logs.

## ADDED Requirements

### Requirement: VS Code session tree view

The VS Code extension MUST display active sessions in a tree view in the sidebar.

#### Scenario: Active sessions displayed
- **WHEN** the extension is loaded and sessions exist
- **THEN** a tree view shows all active sessions with status indicators

#### Scenario: Session selection
- **WHEN** a user clicks a session in the tree view
- **THEN** the session's event log is displayed in the output panel

### Requirement: VS Code output panel

The VS Code extension MUST render agent events in the output panel with syntax highlighting.

#### Scenario: Event rendering
- **WHEN** events are received for a session
- **THEN** they are rendered in the output panel with timestamps, event types, and payloads

#### Scenario: Event filtering
- **WHEN** a user selects a filter in the output panel
- **THEN** only events matching the filter are displayed

### Requirement: VS Code status bar

The VS Code extension MUST show agent status in the status bar.

#### Scenario: Agent active
- **WHEN** an agent is processing
- **THEN** the status bar shows a spinning indicator with the current session name

#### Scenario: Agent idle
- **WHEN** no agent is processing
- **THEN** the status bar shows an idle indicator
