/**
 * Event generators for creating test events.
 */

import type { BaseEvent } from "../../types/events.ts";
import { EventTypes, type EventType } from "../../types/events.ts";

/**
 * Generates a single test event.
 */
export function generateSessionEvent(
  sessionId: string,
  sequenceNumber: number,
  eventType: EventType = EventTypes.SESSION_CREATED,
  payload: Record<string, unknown> = {},
): BaseEvent {
  return {
    event_id: crypto.randomUUID(),
    session_id: sessionId,
    sequence_number: sequenceNumber,
    timestamp: new Date().toISOString(),
    event_type: eventType,
    schema_version: 1,
    payload,
    metadata: { source: "test" },
  };
}

/**
 * Generates a sequence of events for a session.
 */
export function generateEventSequence(
  sessionId: string,
  count: number,
  eventType: EventType = EventTypes.SESSION_CREATED,
): BaseEvent[] {
  const events: BaseEvent[] = [];
  for (let i = 1; i <= count; i++) {
    events.push(
      generateSessionEvent(sessionId, i, eventType, {
        sequence: i,
      }),
    );
  }
  return events;
}

/**
 * Generates a full session lifecycle event sequence.
 */
export function generateSessionLifecycleEvents(
  sessionId: string,
): BaseEvent[] {
  return [
    generateSessionEvent(sessionId, 1, EventTypes.SESSION_CREATED, {
      initial_state: "active",
    }),
    generateSessionEvent(sessionId, 2, EventTypes.SESSION_PAUSED, {
      previous_state: "active",
      new_state: "paused",
    }),
    generateSessionEvent(sessionId, 3, EventTypes.SESSION_RESUMED, {
      previous_state: "paused",
      new_state: "active",
    }),
    generateSessionEvent(sessionId, 4, EventTypes.SESSION_COMPLETED, {
      previous_state: "active",
      new_state: "completed",
    }),
  ];
}

/**
 * Generates multiple sessions with events.
 */
export function generateMultipleSessions(
  sessionCount: number,
  eventsPerSession: number,
): BaseEvent[] {
  const allEvents: BaseEvent[] = [];
  for (let s = 0; s < sessionCount; s++) {
    const sessionId = `session-${s + 1}`;
    for (let e = 1; e <= eventsPerSession; e++) {
      allEvents.push(
        generateSessionEvent(
          sessionId,
          e,
          e === 1 ? EventTypes.SESSION_CREATED : EventTypes.AGENT_THINKING,
        ),
      );
    }
  }
  return allEvents;
}
