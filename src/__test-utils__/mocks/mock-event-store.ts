/**
 * Mock Event Store for testing.
 *
 * Pre-loaded events and event capture.
 */

import type { BaseEvent } from "../../types/events.ts";
import type { IEventStore, Snapshot } from "../../store/event-store.ts";

export interface MockEventStoreConfig {
  events?: BaseEvent[];
  snapshots?: Snapshot[];
}

export class MockEventStore implements IEventStore {
  private events: BaseEvent[] = [];
  private snapshots: Map<string, Snapshot[]> = new Map();

  // Call tracking
  public calls: Array<{ method: string; args: unknown[] }> = [];
  public storedEvents: BaseEvent[] = [];

  constructor(config: MockEventStoreConfig = {}) {
    if (config.events) {
      this.events = [...config.events];
    }
    if (config.snapshots) {
      for (const snapshot of config.snapshots) {
        const existing = this.snapshots.get(snapshot.session_id) ?? [];
        existing.push(snapshot);
        this.snapshots.set(snapshot.session_id, existing);
      }
    }
  }

  store(event: BaseEvent): void {
    this.calls.push({ method: "store", args: [event] });
    this.events.push(event);
    this.storedEvents.push(event);
  }

  getEvents(sessionId: string): readonly BaseEvent[] {
    this.calls.push({ method: "getEvents", args: [sessionId] });
    return Object.freeze(
      this.events.filter((e) => e.session_id === sessionId),
    );
  }

  getEventsInRange(
    sessionId: string,
    from: number,
    to: number,
  ): readonly BaseEvent[] {
    this.calls.push({ method: "getEventsInRange", args: [sessionId, from, to] });
    return Object.freeze(
      this.events.filter(
        (e) =>
          e.session_id === sessionId &&
          e.sequence_number >= from &&
          e.sequence_number <= to,
      ),
    );
  }

  getLastEvent(sessionId: string): BaseEvent | undefined {
    this.calls.push({ method: "getLastEvent", args: [sessionId] });
    const sessionEvents = this.events.filter(
      (e) => e.session_id === sessionId,
    );
    return sessionEvents[sessionEvents.length - 1];
  }

  hasSession(sessionId: string): boolean {
    this.calls.push({ method: "hasSession", args: [sessionId] });
    return this.events.some((e) => e.session_id === sessionId);
  }

  getSessionIds(): string[] {
    this.calls.push({ method: "getSessionIds", args: [] });
    return [...new Set(this.events.map((e) => e.session_id))];
  }

  createSnapshot(
    sessionId: string,
    state: Record<string, unknown>,
  ): Snapshot {
    this.calls.push({ method: "createSnapshot", args: [sessionId, state] });
    const sessionEvents = this.events.filter(
      (e) => e.session_id === sessionId,
    );
    const snapshot: Snapshot = {
      session_id: sessionId,
      sequence_number: sessionEvents.length > 0
        ? sessionEvents[sessionEvents.length - 1].sequence_number
        : 0,
      timestamp: new Date().toISOString(),
      state,
    };
    const existing = this.snapshots.get(sessionId) ?? [];
    existing.push(snapshot);
    this.snapshots.set(sessionId, existing);
    return snapshot;
  }

  getLatestSnapshot(sessionId: string): Snapshot | undefined {
    this.calls.push({ method: "getLatestSnapshot", args: [sessionId] });
    const snapshots = this.snapshots.get(sessionId) ?? [];
    return snapshots[snapshots.length - 1];
  }

  getEventsAfterSnapshot(
    sessionId: string,
    snapshot: Snapshot,
  ): readonly BaseEvent[] {
    this.calls.push({
      method: "getEventsAfterSnapshot",
      args: [sessionId, snapshot],
    });
    return Object.freeze(
      this.events.filter(
        (e) =>
          e.session_id === sessionId &&
          e.sequence_number > snapshot.sequence_number,
      ),
    );
  }

  flush(): void {
    // No-op for mock
  }

  buildCausalGraph(
    sessionId: string,
  ): Map<string, { event: BaseEvent; children: string[] }> {
    this.calls.push({ method: "buildCausalGraph", args: [sessionId] });
    const sessionEvents = this.events.filter((e) => e.session_id === sessionId);
    const graph = new Map<string, { event: BaseEvent; children: string[] }>();

    for (const event of sessionEvents) {
      graph.set(event.event_id, { event, children: [] });
    }

    for (const event of sessionEvents) {
      const parents = (event.causal_parents as string[] | undefined) ?? [];
      for (const parentId of parents) {
        const parent = graph.get(parentId);
        if (parent) {
          parent.children.push(event.event_id);
        }
      }
    }

    return graph;
  }

  findDownstream(eventId: string): BaseEvent[] {
    this.calls.push({ method: "findDownstream", args: [eventId] });
    const event = this.events.find((e) => e.event_id === eventId);
    if (!event) return [];

    const graph = this.buildCausalGraph(event.session_id);
    const downstream: BaseEvent[] = [];
    const visited = new Set<string>();
    const queue = [eventId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = graph.get(current);
      if (!node) continue;

      if (current !== eventId) {
        downstream.push(node.event);
      }

      for (const childId of node.children) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }

    return downstream;
  }

  findIndependentChains(sessionId: string): string[][] {
    this.calls.push({ method: "findIndependentChains", args: [sessionId] });
    const sessionEvents = this.events.filter((e) => e.session_id === sessionId);
    if (sessionEvents.length === 0) return [];

    const graph = this.buildCausalGraph(sessionId);

    const roots: string[] = [];
    for (const event of sessionEvents) {
      const parents = (event.causal_parents as string[] | undefined) ?? [];
      const hasGraphParent = parents.some((p) => graph.has(p));
      if (!hasGraphParent) {
        roots.push(event.event_id);
      }
    }

    const visited = new Set<string>();
    const chains: string[][] = [];

    for (const root of roots) {
      if (visited.has(root)) continue;

      const chain: string[] = [];
      const queue = [root];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        chain.push(current);

        const node = graph.get(current);
        if (node) {
          for (const childId of node.children) {
            if (!visited.has(childId)) {
              queue.push(childId);
            }
          }
        }
      }
      chains.push(chain);
    }

    return chains;
  }

  reset(): void {
    this.events = [];
    this.snapshots.clear();
    this.calls = [];
    this.storedEvents = [];
  }
}
