## Why

The coding harness agent often needs to break down complex tasks into sub-steps and track progress across tool calls and model turns. Without a structured TODO/task list, agents lose context during long-running work or when sessions resume after cold starts (e.g., context window overflow, server restarts, or explicit pause/resume). This creates confusion about what was completed, what's in progress, and what remains — leading to redundant work or dropped requirements.

## What Changes

- **New `todo` tool**: LLM-callable tool for creating, updating, and querying a task list scoped to the current session
- **Task lifecycle events**: New event types (`todo.created`, `todo.updated`, `todo.completed`, `todo.deleted`) for event sourcing and replay
- **Persistence**: Tasks stored in SQLite via the existing persistence backend, surviving session pause/resume
- **Session integration**: On session resume, the TODO list is injected into context so the agent knows its prior progress
- **Progress query**: Tool supports listing pending, in-progress, and completed tasks

## Capabilities

### New Capabilities

- `todo-task-management`: Task list creation, status updates, progress tracking, and session-aware persistence

### Modified Capabilities

- (none)

## Scope

### In Scope

- Create a new task item with description and optional status (`pending`, `in-progress`, `completed`)
- Update task status (mark in-progress, mark completed)
- Delete a task item
- List all tasks filtered by status
- Persist tasks to SQLite and reload on session resume
- Emit events for each mutation (created, updated, deleted)
- Inject task summary into agent context on session resume

### Out of Scope

- Cross-session task sharing (tasks are session-scoped)
- Task dependencies or ordering constraints
- Task time tracking or estimation
- UI/visualization of task progress (projection layer concern)
- Automatic task creation from model output (agent explicitly calls the tool)

## Success Criteria

- Agent can create, update, and list tasks via tool calls
- Tasks persist across session pause/resume
- On session resume, agent context includes a summary of prior task progress
- Each task mutation emits a corresponding event to the EventStream
- Unit tests cover task CRUD, persistence, and session integration
