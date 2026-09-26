## Purpose

Task list management for coding harness agents, enabling structured progress tracking across tool calls and session resumptions.

## ADDED Requirements

### Requirement: Task Creation

The system MUST allow agents to create task items with a description and optional initial status.

#### Scenario: Create a new task

- **WHEN** the agent invokes the `todo` tool with action `create` and a description
- **THEN** a new task item is created with status `pending` (default) and a unique identifier
- **AND** a `todo.created` event is emitted to the EventStream

#### Scenario: Create a task with explicit status

- **WHEN** the agent invokes the `todo` tool with action `create`, a description, and status `in-progress`
- **THEN** the task item is created with status `in-progress`
- **AND** a `todo.created` event is emitted with the specified status

### Requirement: Task Status Updates

The system MUST allow agents to update the status of existing task items.

#### Scenario: Mark task in-progress

- **WHEN** the agent invokes the `todo` tool with action `update`, a task ID, and status `in-progress`
- **THEN** the task's status changes to `in-progress`
- **AND** a `todo.updated` event is emitted with old and new status

#### Scenario: Mark task completed

- **WHEN** the agent invokes the `todo` tool with action `update`, a task ID, and status `completed`
- **THEN** the task's status changes to `completed`
- **AND** a `todo.updated` event is emitted with old and new status

#### Scenario: Update non-existent task

- **WHEN** the agent invokes the `todo` tool with action `update` and a task ID that does not exist
- **THEN** the tool returns an error indicating the task was not found

### Requirement: Task Deletion

The system MUST allow agents to delete task items.

#### Scenario: Delete an existing task

- **WHEN** the agent invokes the `todo` tool with action `delete` and a task ID
- **THEN** the task item is removed from the list
- **AND** a `todo.deleted` event is emitted

#### Scenario: Delete non-existent task

- **WHEN** the agent invokes the `todo` tool with action `delete` and a task ID that does not exist
- **THEN** the tool returns an error indicating the task was not found

### Requirement: Task Listing

The system MUST allow agents to query the current task list, optionally filtered by status.

#### Scenario: List all tasks

- **WHEN** the agent invokes the `todo` tool with action `list` and no status filter
- **THEN** all tasks in the current session are returned with their IDs, descriptions, and statuses

#### Scenario: List tasks by status

- **WHEN** the agent invokes the `todo` tool with action `list` with status filter `completed`
- **THEN** only tasks with status `completed` are returned

#### Scenario: List tasks when none exist

- **WHEN** the agent invokes the `todo` tool with action `list` and no tasks have been created
- **THEN** an empty list is returned

### Requirement: Session Persistence

The system MUST persist task items across session pause and resume.

#### Scenario: Tasks survive session pause

- **WHEN** a session is paused and later resumed
- **THEN** all task items created during the session are still present with their current statuses

#### Scenario: Tasks available on cold start

- **WHEN** a session resumes after server restart or context overflow
- **THEN** the agent's context includes a summary of the task list (counts by status and descriptions of incomplete tasks)

### Requirement: Event Sourcing

All task mutations MUST be captured as events for replay and audit.

#### Scenario: Task events are queryable

- **WHEN** tasks are created, updated, or deleted
- **THEN** corresponding events (`todo.created`, `todo.updated`, `todo.deleted`) are stored in the EventStream with the session ID

#### Scenario: Task state reconstructable from events

- **WHEN** the EventStream is replayed for a session
- **THEN** the current task list state can be reconstructed from the sequence of todo events
