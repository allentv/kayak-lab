## Context

kayak-lab's coding harness provides tools (shell, file, search, git, github) that agents invoke during task execution. The tool calling system (`src/tools/`) has a `ToolRegistry` for tool discovery, `ToolCallingEngine` for execution with JSON Schema validation, and `ToolDefinition` for schema validation. Persistence uses SQLite via `SQLitePersistenceBackend` with event sourcing (append-only events reconstructed into state).

Sessions are managed by `SessionManager` with pause/resume lifecycle. The `AgentRuntime` processes input through model turns and tool calls. Currently, agents have no structured way to track multi-step task progress — they rely on context window memory which can be lost on session resume.

## Goals / Non-Goals

**Goals:**

- Provide a `todo` tool that agents call to create, update, delete, and list task items
- Persist task state in SQLite, scoped to session, surviving pause/resume
- Emit events for each mutation to maintain event sourcing integrity
- On session resume, inject a task summary into the agent's context so it knows prior progress

**Non-Goals:**

- Cross-session task sharing (tasks are session-scoped)
- Task dependencies, ordering, or priority beyond status
- Automatic task creation from model output
- UI/visualization of task progress (projection layer concern)
- Time tracking or estimation

## Decisions

### 1. Tool, not Capability

TODO task management is a **tool** (`src/tools/todo.ts`), not a capability (`src/capabilities/`).

**Rationale:** Capabilities are for external system access (shell, files, git). The todo tool manages internal state — it doesn't interact with an external system. It fits naturally in the tool calling system alongside shell, file, and search tools.

### 2. Single tool with action parameter

One `todo` tool with an `action` parameter (`create`, `update`, `delete`, `list`), not separate tools per operation.

**Rationale:** Reduces tool count in the registry. Agent uses a single tool name with different actions. Matches OMP's `todo` tool pattern.

### 3. Task data model

```typescript
interface Task {
  id: string;           // UUID
  session_id: string;   // Owning session
  description: string;  // What the task is
  status: "pending" | "in-progress" | "completed";
  created_at: string;   // ISO 8601
  updated_at: string;   // ISO 8601
}
```

**Rationale:** Minimal fields. `id` for updates/deletes. `session_id` for scoping. `status` for filtering and progress tracking. Timestamps for ordering and debugging.

### 4. SQLite table for task persistence

New `tasks` table in the existing SQLite database (same file as event store).

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_tasks_session ON tasks(session_id);
```

**Rationale:** Reuses existing SQLite infrastructure. Session-scoped queries via index. Status check constraint enforces valid states.

### 5. Event types for mutations

Four new event types in the existing event taxonomy:

| Event Type | Payload |
|------------|---------|
| `todo.created` | `{ task_id, description, status }` |
| `todo.updated` | `{ task_id, old_status, new_status }` |
| `todo.deleted` | `{ task_id }` |

**Rationale:** Events enable replay-based state reconstruction. Minimal payload — no need to embed full task in event since SQLite is source of truth.

### 6. Session resume context injection

On session resume, `AgentRuntime` queries pending/in-progress tasks and prepends a summary to the system context:

```
[TODO Progress]
- Completed: 3
- In Progress: 1: "Implement file write handler"
- Pending: 2
```

**Rationale:** Gives the agent immediate visibility into prior progress without full context replay. Summary is compact (fits in context budget).

## Risks / Trade-offs

- **SQLite contention**: Tasks table shares the database with events and memory. Low risk — task operations are infrequent (one per agent decision, not per tool call).
- **Context window overhead**: Task summary on resume adds tokens. Mitigated by keeping summary compact (counts + in-progress descriptions only).
- **Event duplication**: Task state stored in both SQLite and events. Trade-off: SQLite for fast queries, events for replay integrity. Consistency maintained by treating SQLite as source of truth.
