/**
 * Shared causal graph utilities for EventStore and PersistentEventStore.
 *
 * Extracted to avoid duplicating graph construction and traversal logic
 * across in-memory and persistent store implementations.
 */

import type { BaseEvent } from "../types/events.ts";

// ============================================================================
// Types
// ============================================================================

/** A node in the causal graph adjacency list. */
export interface CausalGraphNode {
  event: BaseEvent;
  children: string[];
}

// ============================================================================
// Graph Construction
// ============================================================================

/**
 * Build a causal graph from events using their causal_parents fields.
 * Events without causal_parents are treated as roots.
 */
export function buildCausalGraph(
  events: readonly BaseEvent[],
): Map<string, CausalGraphNode> {
  const graph = new Map<string, CausalGraphNode>();

  // Initialize all nodes
  for (const event of events) {
    graph.set(event.event_id, { event, children: [] });
  }

  // Build edges: causal_parent -> child
  for (const event of events) {
    const parents = getCausalParents(event);
    for (const parentId of parents) {
      const parent = graph.get(parentId);
      if (parent) {
        parent.children.push(event.event_id);
      }
    }
  }

  return graph;
}

// ============================================================================
// Traversal
// ============================================================================

/**
 * Find all events downstream of a given event (transitive closure).
 * Uses BFS for O(v + e) traversal.
 */
export function findDownstream(
  eventId: string,
  events: readonly BaseEvent[],
): BaseEvent[] {
  const downstream: BaseEvent[] = [];
  const visited = new Set<string>();
  const graph = buildCausalGraph(events);
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

/**
 * Find independent (causally disconnected) event chains in a session.
 * Returns arrays of event IDs, each forming a connected component.
 */
export function findIndependentChains(
  events: readonly BaseEvent[],
): string[][] {
  if (events.length === 0) return [];

  const graph = buildCausalGraph(events);

  // Find roots: events with no causal_parents (or parents not in graph)
  const roots: string[] = [];
  for (const event of events) {
    const parents = getCausalParents(event);
    const hasGraphParent = parents.some((p) => graph.has(p));
    if (!hasGraphParent) {
      roots.push(event.event_id);
    }
  }

  // BFS from each root to find connected components
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

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract causal_parents from an event, defaulting to empty array.
 * Handles both present and missing fields for backward compatibility.
 */
export function getCausalParents(event: BaseEvent): string[] {
  const parents = event.causal_parents;
  if (!Array.isArray(parents)) return [];
  return parents;
}
