/**
 * Session builder for creating test sessions.
 *
 * Fluent API with default values for easy test session creation.
 */

import type { BaseEvent } from "../../types/events.ts";
import { EventTypes, type EventType } from "../../types/events.ts";

export interface TestSession {
  id: string;
  events: BaseEvent[];
}

export interface TestSessionBuilder {
  /** Set custom session ID. */
  withId(id: string): TestSessionBuilder;

  /** Add an event to the session. */
  addEvent(
    type: EventType,
    payload?: Record<string, unknown>,
    sequenceNumber?: number,
  ): TestSessionBuilder;

  /** Add multiple events in sequence. */
  addEventSequence(
    types: EventType[],
    payloads?: Record<string, unknown>[],
  ): TestSessionBuilder;

  /** Build and return the test session. */
  build(): TestSession;
}

class TestSessionBuilderImpl implements TestSessionBuilder {
  private sessionId: string;
  private events: BaseEvent[] = [];
  private nextSequence = 1;

  constructor(sessionId?: string) {
    this.sessionId = sessionId ?? `test-session-${crypto.randomUUID().slice(0, 8)}`;
  }

  withId(id: string): TestSessionBuilder {
    this.sessionId = id;
    return this;
  }

  addEvent(
    type: EventType,
    payload: Record<string, unknown> = {},
    sequenceNumber?: number,
  ): TestSessionBuilder {
    const seq = sequenceNumber ?? this.nextSequence++;
    this.events.push({
      event_id: crypto.randomUUID(),
      session_id: this.sessionId,
      sequence_number: seq,
      timestamp: new Date().toISOString(),
      event_type: type,
      schema_version: 1,
      payload,
      metadata: { source: "test" },
    });
    return this;
  }

  addEventSequence(
    types: EventType[],
    payloads?: Record<string, unknown>[],
  ): TestSessionBuilder {
    for (let i = 0; i < types.length; i++) {
      this.addEvent(types[i], payloads?.[i] ?? {});
    }
    return this;
  }

  build(): TestSession {
    return {
      id: this.sessionId,
      events: [...this.events],
    };
  }
}

/**
 * Creates a new test session builder.
 *
 * @example
 * ```ts
 * const session = createTestSession()
 *   .withId("my-session")
 *   .addEvent(EventTypes.SESSION_CREATED)
 *   .addEvent(EventTypes.SESSION_PAUSED)
 *   .build();
 * ```
 */
export function createTestSession(sessionId?: string): TestSessionBuilder {
  return new TestSessionBuilderImpl(sessionId);
}

/**
 * Creates a quick session with default events (created → paused → resumed → completed).
 */
export function createDefaultTestSession(
  sessionId?: string,
): TestSession {
  return createTestSession(sessionId)
    .addEvent(EventTypes.SESSION_CREATED, { initial_state: "active" })
    .addEvent(EventTypes.SESSION_PAUSED, {
      previous_state: "active",
      new_state: "paused",
    })
    .addEvent(EventTypes.SESSION_RESUMED, {
      previous_state: "paused",
      new_state: "active",
    })
    .addEvent(EventTypes.SESSION_COMPLETED, {
      previous_state: "active",
      new_state: "completed",
    })
    .build();
}
