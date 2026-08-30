/**
 * In-memory event store implementation.
 *
 * Provides persistence and replay capabilities for event streams.
 * Supports full and partial replay, snapshots, and crash recovery.
 */

import { BaseEvent } from "../types/events.ts";
import { EventStream } from "../core/event-stream.ts";

// ============================================================================
// Snapshot Types
// ============================================================================

/** A snapshot of session state at a specific point in time. */
export interface Snapshot {
  session_id: string;
  sequence_number: number;
  timestamp: string;
  state: Record<string, unknown>;
}

// ============================================================================
// Event Store Interface
// ============================================================================

export interface IEventStore {
  store(event: BaseEvent): void;
  getEvents(sessionId: string): readonly BaseEvent[];
  getEventsInRange(
    sessionId: string,
    from: number,
    to: number,
  ): readonly BaseEvent[];
  getLastEvent(sessionId: string): BaseEvent | undefined;
  hasSession(sessionId: string): boolean;
  getSessionIds(): string[];
  createSnapshot(
    sessionId: string,
    state: Record<string, unknown>,
  ): Snapshot;
  getLatestSnapshot(sessionId: string): Snapshot | undefined;
  getEventsAfterSnapshot(
    sessionId: string,
    snapshot: Snapshot,
  ): readonly BaseEvent[];
}

// ============================================================================
// In-Memory Event Store Implementation
// ============================================================================

export class EventStore implements IEventStore {
  private readonly events = new Map<string, BaseEvent[]>();
  private readonly snapshots = new Map<string, Snapshot[]>();

  store(event: BaseEvent): void {
    const sessionEvents = this.events.get(event.session_id) ?? [];
    sessionEvents.push(event);
    this.events.set(event.session_id, sessionEvents);
  }

  getEvents(sessionId: string): readonly BaseEvent[] {
    return Object.freeze([...(this.events.get(sessionId) ?? [])]);
  }

  getEventsInRange(
    sessionId: string,
    from: number,
    to: number,
  ): readonly BaseEvent[] {
    const events = this.events.get(sessionId) ?? [];
    return Object.freeze(
      events.filter((e) => e.sequence_number >= from && e.sequence_number <= to),
    );
  }

  getLastEvent(sessionId: string): BaseEvent | undefined {
    const events = this.events.get(sessionId);
    return events?.[events.length - 1];
  }

  hasSession(sessionId: string): boolean {
    return this.events.has(sessionId);
  }

  getSessionIds(): string[] {
    return Array.from(this.events.keys());
  }

  createSnapshot(
    sessionId: string,
    state: Record<string, unknown>,
  ): Snapshot {
    const lastEvent = this.getLastEvent(sessionId);
    const sequenceNumber = lastEvent?.sequence_number ?? 0;

    const snapshot: Snapshot = {
      session_id: sessionId,
      sequence_number: sequenceNumber,
      timestamp: new Date().toISOString(),
      state,
    };

    const sessionSnapshots = this.snapshots.get(sessionId) ?? [];
    sessionSnapshots.push(snapshot);
    this.snapshots.set(sessionId, sessionSnapshots);

    return snapshot;
  }

  getLatestSnapshot(sessionId: string): Snapshot | undefined {
    const sessionSnapshots = this.snapshots.get(sessionId);
    return sessionSnapshots?.[sessionSnapshots.length - 1];
  }

  getEventsAfterSnapshot(
    sessionId: string,
    snapshot: Snapshot,
  ): readonly BaseEvent[] {
    const events = this.events.get(sessionId) ?? [];
    return Object.freeze(
      events.filter((e) => e.sequence_number > snapshot.sequence_number),
    );
  }

  get totalEvents(): number {
    let total = 0;
    for (const events of this.events.values()) {
      total += events.length;
    }
    return total;
  }

  get sessionCount(): number {
    return this.events.size;
  }
}

// ============================================================================
// Event Store Bridge
// ============================================================================

/**
 * Bridges the EventStream to the EventStore.
 *
 * Features:
 * - Backfills existing events on connect
 * - Returns unsubscribe function for cleanup
 * - NOTE: New event subscription is not yet wired (EventStream lacks subscribe API)
 */
export class EventStoreBridge {
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly eventStream: EventStream,
    private readonly eventStore: EventStore,
  ) {}

  /**
   * Connect the bridge: backfill existing events into the EventStore.
   *
   * NOTE: EventStream currently lacks a subscribe/observe API, so events
   * appended after connect() are NOT automatically propagated. Use
   * `storeEvent()` to manually bridge new events until EventStream gains
   * subscription support. Returns an unsubscribe function (currently a
   * no-op placeholder).
   */
  connect(
    onEvent?: (event: BaseEvent) => void,
  ): () => void {
    // Backfill existing events from the EventStream into the EventStore
    for (const sessionId of this.eventStream.getSessionIds()) {
      const events = this.eventStream.getEvents(sessionId);
      for (const event of events) {
        this.eventStore.store(event);
        onEvent?.(event);
      }
    }

    // TODO: EventStream has no subscribe/observe API, so we cannot react to
    // new events. When EventStream gains a subscription mechanism (e.g.
    // `onAppend(callback): unsubscribe`), wire it here to call
    // `this.eventStore.store(event)` and `onEvent?.(event)` for each new event.
    this.unsubscribe = () => {
      this.unsubscribe = null;
    };

    return () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
    };
  }

  /**
   * Manually store an event (for use when auto-subscription is not available).
   */
  storeEvent(event: BaseEvent): void {
    this.eventStore.store(event);
  }
}
