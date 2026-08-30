/**
 * Core event types for the kayak-lab agent interaction platform.
 *
 * Events are immutable, ordered records that form the source of truth
 * for all agent interactions.
 */

// ============================================================================
// Event Type Registry
// ============================================================================

/**
 * All supported event types in the system.
 * Organized by category for clarity.
 */
export const EventTypes = {
  // Session events
  SESSION_CREATED: "session.created",
  SESSION_RESUMED: "session.resumed",
  SESSION_PAUSED: "session.paused",
  SESSION_COMPLETED: "session.completed",
  SESSION_FAILED: "session.failed",
  SESSION_CANCELLED: "session.cancelled",

  // Agent events
  AGENT_THINKING: "agent.thinking",
  AGENT_DECISION: "agent.decision",
  AGENT_TOOL_INVOCATION: "agent.tool_invocation",

  // Tool events
  TOOL_EXECUTION_STARTED: "tool.execution.started",
  TOOL_EXECUTION_COMPLETED: "tool.execution.completed",
  TOOL_EXECUTION_FAILED: "tool.execution.failed",

  // Model events
  MODEL_REQUEST: "model.request",
  MODEL_RESPONSE: "model.response",
  MODEL_STREAM_DELTA: "model.stream.delta",

  // UI events
  UI_USER_INPUT: "ui.user.input",
  UI_DISPLAY_UPDATE: "ui.display.update",
  UI_ACTION: "ui.action",

  // Policy events
  POLICY_APPROVAL: "policy.approval",
  POLICY_DENIAL: "policy.denial",
  POLICY_CONSTRAINT: "policy.constraint",

  // Context events
  CONTEXT_WINDOW_UPDATED: "context.window.updated",
  CONTEXT_STATE_CHANGED: "context.state.changed",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

// ============================================================================
// Event Schema
// ============================================================================

/**
 * Base event interface that all events must conform to.
 */
export interface BaseEvent {
  /** Unique identifier for this event */
  event_id: string;

  /** Session this event belongs to */
  session_id: string;

  /** Monotonically increasing sequence number within the session */
  sequence_number: number;

  /** Timestamp when the event was created (ISO 8601) */
  timestamp: string;

  /** Type of event (from EventTypes registry) */
  event_type: EventType;

  /** Schema version for forward compatibility */
  schema_version: number;

  /** Event-specific payload */
  payload: Record<string, unknown>;

  /** Optional metadata (source, correlation IDs, etc.) */
  metadata: EventMetadata;
}

/**
 * Metadata attached to every event.
 */
export interface EventMetadata {
  /** Source that created this event (e.g., "agent-runtime", "ui-terminal") */
  source: string;

  /** Optional correlation ID for linking related events */
  correlation_id?: string;

  /** Optional user ID */
  user_id?: string;

  /** Additional arbitrary metadata */
  [key: string]: unknown;
}

// ============================================================================
// Specific Event Payloads
// ============================================================================

/**
 * Session created event payload.
 * Uses index signature for compatibility with Record<string, unknown>.
 */
export interface SessionCreatedPayload {
  /** Initial session state */
  initial_state: "active";

  /** Optional session description or name */
  description?: string;

  /** Configuration for this session */
  config?: Record<string, unknown>;

  /** Index signature for Record<string, unknown> compatibility */
  [key: string]: unknown;
}

/**
 * Tool execution event payload.
 */
export interface ToolExecutionPayload {
  /** Name of the tool being executed */
  tool_name: string;

  /** Parameters passed to the tool */
  parameters: Record<string, unknown>;

  /** Result returned by the tool (for completed/failed events) */
  result?: unknown;

  /** Error message (for failed events) */
  error?: string;

  /** Duration in milliseconds (for completed/failed events) */
  duration_ms?: number;

  /** Index signature for Record<string, unknown> compatibility */
  [key: string]: unknown;
}

/**
 * Model request/response event payload.
 */
export interface ModelPayload {
  /** Model provider (e.g., "openai", "anthropic") */
  provider: string;

  /** Model name (e.g., "gpt-4", "claude-3-opus") */
  model: string;

  /** Messages sent to the model (for request events) */
  messages?: Array<{ role: string; content: string }>;

  /** Response content (for response events) */
  content?: string;

  /** Token usage (for response events) */
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };

  /** Stream delta content (for stream delta events) */
  delta?: string;

  /** Index signature for Record<string, unknown> compatibility */
  [key: string]: unknown;
}

/**
 * User input event payload.
 */
export interface UserInputPayload {
  /** The raw input text */
  input: string;

  /** Input source (e.g., "keyboard", "voice", "api") */
  source: string;

  /** Index signature for Record<string, unknown> compatibility */
  [key: string]: unknown;
}

// ============================================================================
// Event Creation Helpers
// ============================================================================

/**
 * Current schema version for events.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Input type for event append - schema_version, event_id, and timestamp are auto-generated.
 */
export type AppendEventInput = Omit<BaseEvent, "event_id" | "timestamp" | "schema_version">;

// ============================================================================
// Event Type Guards
// ============================================================================

/**
 * Checks if a string is a valid event type.
 */
export function isValidEventType(type: string): type is EventType {
  return (Object.values(EventTypes) as string[]).includes(type);
}

/**
 * Type guard for session events.
 */
export function isSessionEvent(
  event: BaseEvent,
): event is BaseEvent & { event_type: "session.created" | "session.resumed" | "session.paused" | "session.completed" | "session.failed" | "session.cancelled" } {
  return event.event_type.startsWith("session.");
}

/**
 * Type guard for tool events.
 */
export function isToolEvent(
  event: BaseEvent,
): event is BaseEvent & { event_type: "tool.execution.started" | "tool.execution.completed" | "tool.execution.failed" } {
  return event.event_type.startsWith("tool.");
}

/**
 * Type guard for model events.
 */
export function isModelEvent(
  event: BaseEvent,
): event is BaseEvent & { event_type: "model.request" | "model.response" | "model.stream.delta" } {
  return event.event_type.startsWith("model.");
}
