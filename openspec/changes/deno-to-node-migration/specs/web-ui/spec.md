## Purpose

Migrate the web monitoring UI from Fresh (Deno-only) to a runtime-agnostic framework so it runs on both Deno (during transition) and Node.js.

## ADDED Requirements

### Requirement: Runtime-agnostic web framework

The web UI MUST use a framework that runs on both Deno and Node.js, replacing Fresh.

#### Scenario: Embedded mode serves UI

- **WHEN** the harness starts with web enabled
- **THEN** the monitoring dashboard is served on the configured port

#### Scenario: Standalone mode serves UI

- **WHEN** the web UI is started standalone with `--connect` URLs
- **THEN** it connects to the specified harness instances and displays the dashboard

### Requirement: Dashboard functionality preserved

All existing dashboard features MUST work after the framework migration.

#### Scenario: Real-time event display

- **WHEN** a harness instance emits events
- **THEN** the dashboard displays them in real time via WebSocket

#### Scenario: Session browsing

- **WHEN** the user navigates to a session
- **THEN** the session details and event history are displayed

#### Scenario: Health status display

- **WHEN** the dashboard loads
- **THEN** it shows the health status of connected harness instances
