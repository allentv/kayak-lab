/**
 * Custom test assertions for common patterns.
 */

import { assertEquals, assertExists } from "@std/assert";
import type { BaseEvent } from "../../types/events.ts";
import type { CapabilityResult } from "../../capabilities/capability.ts";

/**
 * Asserts that two events are equal (ignoring auto-generated fields).
 */
export function assertEventEquals(
  actual: BaseEvent,
  expected: Partial<BaseEvent>,
): void {
  if (expected.session_id !== undefined) {
    assertEquals(actual.session_id, expected.session_id);
  }
  if (expected.sequence_number !== undefined) {
    assertEquals(actual.sequence_number, expected.sequence_number);
  }
  if (expected.event_type !== undefined) {
    assertEquals(actual.event_type, expected.event_type);
  }
  if (expected.schema_version !== undefined) {
    assertEquals(actual.schema_version, expected.schema_version);
  }
  if (expected.payload !== undefined) {
    assertEquals(actual.payload, expected.payload);
  }
  if (expected.metadata !== undefined) {
    assertEquals(actual.metadata, expected.metadata);
  }
  // Always verify auto-generated fields exist
  assertExists(actual.event_id);
  assertExists(actual.timestamp);
}

/**
 * Asserts that a capability result is successful with expected data.
 */
export function assertCapabilitySuccess<T>(
  result: CapabilityResult<T>,
  expectedData?: T,
): void {
  assertEquals(result.success, true);
  if (expectedData !== undefined) {
    assertEquals(result.data, expectedData);
  }
}

/**
 * Asserts that a capability result is a failure.
 */
export function assertCapabilityFailure(
  result: CapabilityResult,
  expectedError?: string,
): void {
  assertEquals(result.success, false);
  if (expectedError !== undefined) {
    assertExists(result.error);
    const errorMsg = String(result.error);
    assertEquals(errorMsg.includes(expectedError), true);
  }
}

/**
 * Asserts that an event has the correct sequence number ordering.
 */
export function assertEventsInOrder(events: readonly BaseEvent[]): void {
  for (let i = 1; i < events.length; i++) {
    assertEquals(
      events[i].sequence_number > events[i - 1].sequence_number,
      true,
      `Event at index ${i} has sequence ${events[i].sequence_number} ` +
        `which is not greater than ${events[i - 1].sequence_number}`,
    );
  }
}

/**
 * Asserts that all events belong to the same session.
 */
export function assertSameSession(events: readonly BaseEvent[]): void {
  if (events.length === 0) return;
  const sessionId = events[0].session_id;
  for (const event of events) {
    assertEquals(
      event.session_id,
      sessionId,
      `Event ${event.event_id} belongs to session ${event.session_id} ` +
        `instead of ${sessionId}`,
    );
  }
}
