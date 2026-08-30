/**
 * Core event stream implementation.
 *
 * Provides immutable, ordered event storage with session isolation.
 * Events are append-only and strictly ordered by sequence number.
 */

import {
  BaseEvent,
  EventTypes,
  CURRENT_SCHEMA_VERSION,
  isValidEventType,
  AppendEventInput,
} from "../types/events.ts";

// ============================================================================
// Error Types
// ============================================================================

export class EventStreamError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "EventStreamError";
  }
}

export class SequenceError extends EventStreamError {
  constructor(expected: number, actual: number, sessionId: string) {
    super(
      `Sequence number ${actual} does not match expected ${expected} for session ${sessionId}`,
      "SEQUENCE_ERROR",
      { expected, actual, sessionId },
    );
    this.name = "SequenceError";
  }
}

export class ValidationError extends EventStreamError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class SessionNotFoundError extends EventStreamError {
  constructor(sessionId: string) {
    super(`Session ${sessionId} not found`, "SESSION_NOT_FOUND", { sessionId });
    this.name = "SessionNotFoundError";
  }
}

// ============================================================================
// Event Stream Interface
// ============================================================================

/**
 * Interface for event stream operations.
 */
export interface IEventStream {
  /** Append an event to a session's stream. */
  append(event: AppendEventInput): BaseEvent;

  /** Get all events for a session. */
  getEvents(sessionId: string): readonly BaseEvent[];

  /** Get events for a session within a sequence range. */
  getEventsInRange(
    sessionId: string,
    from: number,
    to: number,
  ): readonly BaseEvent[];

  /** Get the last event for a session. */
  getLastEvent(sessionId: string): BaseEvent | undefined;

  /** Get the current sequence number for a session. */
  getCurrentSequence(sessionId: string): number;

  /** Check if a session exists. */
  hasSession(sessionId: string): boolean;

  /** Get all session IDs. */
  getSessionIds(): string[];
}

// ============================================================================
// In-Memory Event Stream Implementation
// ============================================================================

/**
 * In-memory event stream implementation.
 *
 * Enforces:
 * - Immutability (events cannot be modified after creation)
 * - Strict ordering (sequence numbers must be monotonically increasing)
 * - Session isolation (events from different sessions are completely separate)
 * - Event type validation (must be registered in EventTypes)
 */
export class EventStream implements IEventStream {
  /** Storage for events, keyed by session ID. */
  private readonly sessions = new Map<string, BaseEvent[]>();

  /** Track the next expected sequence number for each session. */
  private readonly nextSequence = new Map<string, number>();

  /**
   * Append an event to a session's stream.
   *
   * Validates:
   * - Event type must be registered
   * - Sequence number must be exactly one greater than the last event
   * - Session ID must match
   */
  append(event: AppendEventInput): BaseEvent {
    if (!isValidEventType(event.event_type)) {
      throw new ValidationError(`Invalid event type: ${event.event_type}`, {
        event_type: event.event_type,
        valid_types: Object.values(EventTypes),
      });
    }

    const sessionId = event.session_id;
    const expectedSequence = this.nextSequence.get(sessionId) ?? 1;

    if (event.sequence_number !== expectedSequence) {
      throw new SequenceError(expectedSequence, event.sequence_number, sessionId);
    }

    const completeEvent: BaseEvent = {
      ...event,
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      schema_version: CURRENT_SCHEMA_VERSION,
    };

    const events = this.sessions.get(sessionId) ?? [];
    events.push(completeEvent);
    this.sessions.set(sessionId, events);

    this.nextSequence.set(sessionId, expectedSequence + 1);

    return completeEvent;
  }

  /** Get all events for a session. */
  getEvents(sessionId: string): readonly BaseEvent[] {
    const events = this.sessions.get(sessionId);
    if (!events) {
      return [];
    }
    return Object.freeze([...events]);
  }

  /** Get events for a session within a sequence range (inclusive). */
  getEventsInRange(
    sessionId: string,
    from: number,
    to: number,
  ): readonly BaseEvent[] {
    const events = this.sessions.get(sessionId) ?? [];
    return Object.freeze(
      events.filter((e) => e.sequence_number >= from && e.sequence_number <= to),
    );
  }

  /** Get the last event for a session. */
  getLastEvent(sessionId: string): BaseEvent | undefined {
    const events = this.sessions.get(sessionId);
    return events?.[events.length - 1];
  }

  /** Get the current sequence number for a session. */
  getCurrentSequence(sessionId: string): number {
    return (this.nextSequence.get(sessionId) ?? 1) - 1;
  }

  /** Check if a session exists. */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /** Get all session IDs. */
  getSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  /** Get the total number of events across all sessions. */
  get totalEvents(): number {
    let total = 0;
    for (const events of this.sessions.values()) {
      total += events.length;
    }
    return total;
  }

  /** Get the number of sessions. */
  get sessionCount(): number {
    return this.sessions.size;
  }
}
