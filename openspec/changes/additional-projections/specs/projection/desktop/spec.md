## Purpose

Desktop application projection using Tauri, wrapping the Web UI with native OS integration (system tray, notifications, keyboard shortcuts).

## ADDED Requirements

### Requirement: Desktop system tray

The desktop app MUST provide a system tray icon with quick actions.

#### Scenario: Tray icon
- **WHEN** the desktop app is running
- **THEN** a system tray icon is visible with the app icon

#### Scenario: Tray menu
- **WHEN** the user right-clicks the tray icon
- **THEN** a context menu shows: Open, New Session, Quit

### Requirement: Desktop notifications

The desktop app MUST show native OS notifications for important events.

#### Scenario: Agent completion notification
- **WHEN** an agent completes a task
- **THEN** a native notification is shown with the session name and result summary

#### Scenario: Error notification
- **WHEN** an agent encounters an error
- **THEN** a native notification is shown with the error details

### Requirement: Desktop keyboard shortcuts

The desktop app MUST support global keyboard shortcuts.

#### Scenario: New session shortcut
- **WHEN** the user presses Ctrl+Shift+A (or Cmd+Shift+A on macOS)
- **THEN** a new session is created and focused

#### Scenario: Quick input shortcut
- **WHEN** the user presses Ctrl+Shift+I (or Cmd+Shift+I on macOS)
- **THEN** the input field is focused for quick message entry
