## 1. Event Types and Data Model

- [ ] 1.1 Add TODO event types to `src/types/events.ts`: `todo.created`, `todo.updated`, `todo.deleted` with payload interfaces
- [ ] 1.2 Add type guards: `isTodoEvent()`, `isTodoCreatedEvent()`, `isTodoUpdatedEvent()`, `isTodoDeletedEvent()`

## 2. Task Data Model and Storage

- [ ] 2.1 Create `src/tools/todo.ts` with `Task` interface (`id`, `session_id`, `description`, `status`, `created_at`, `updated_at`)
- [ ] 2.2 Add SQLite migration for `tasks` table with session index and status constraint
- [ ] 2.3 Implement `TodoStore` class with `create()`, `update()`, `delete()`, `list()` methods

## 3. Tool Implementation

- [ ] 3.1 Create `TodoTool` class implementing `IToolDefinition` with `todo` tool name
- [ ] 3.2 Define JSON Schema for `todo` tool parameters: `action` (create|update|delete|list), `description?`, `task_id?`, `status?`
- [ ] 3.3 Implement tool handler: dispatch to `TodoStore` methods based on action
- [ ] 3.4 Register `todo` tool in `ToolRegistry` during harness initialization

## 4. Event Emission

- [ ] 4.1 Wire `TodoStore` to emit `todo.created` event on task creation
- [ ] 4.2 Wire `TodoStore` to emit `todo.updated` event on status change
- [ ] 4.3 Wire `TodoStore` to emit `todo.deleted` event on task deletion

## 5. Session Integration

- [ ] 5.1 Add `getTaskSummary()` method to `TodoStore` for session resume context
- [ ] 5.2 Integrate task summary injection into `AgentRuntime` on session resume
- [ ] 5.3 Add session-scoped queries (all task operations filter by `session_id`)

## 6. Testing

- [ ] 6.1 Unit tests for `TodoStore` CRUD operations
- [ ] 6.2 Unit tests for `TodoTool` parameter validation and action dispatch
- [ ] 6.3 Integration tests for event emission on task mutations
- [ ] 6.4 Integration test for session persistence (create tasks, pause, resume, verify)
- [ ] 6.5 Test task summary generation for context injection
