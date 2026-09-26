# Session Fixtures

JSON files representing saved session event histories. Used for replaying user-reported bugs and E2E test scenarios.

## Schema

```json
{
  "id": "string — session identifier",
  "description": "string — human-readable session description",
  "events": [
    {
      "event_id": "string — unique event identifier",
      "session_id": "string — matches top-level id",
      "sequence_number": "number — monotonically increasing, starts at 1",
      "timestamp": "string — ISO 8601",
      "event_type": "string — event type (e.g. session.created, ui.user.input)",
      "schema_version": "number — event schema version",
      "payload": "object — event-type-specific data",
      "metadata": "object — source, trace, etc."
    }
  ]
}
```

## Event Types

Common event types in fixtures:

| Type | Description |
|------|-------------|
| `session.created` | Session initialized |
| `session.paused` | Session paused by user/system |
| `session.resumed` | Session resumed after pause |
| `session.completed` | Session finished successfully |
| `session.failed` | Session ended with error |
| `session.cancelled` | Session aborted by user |
| `ui.user.input` | User message to the agent |
| `agent.thinking` | Agent reasoning step |
| `model.request` | Request sent to model provider |
| `model.response` | Response received from model |
| `tool.execution.started` | Tool invocation began |
| `tool.execution.completed` | Tool invocation finished |

## Creating Fixtures

Export from a live harness:

```bash
# Start the harness
deno run -A src/main.ts --port 9000

# Get session events
curl http://localhost:9000/api/sessions/<session-id> | jq . > fixtures/sessions/my-session.json
```

Or use the E2E test client to capture and save.
