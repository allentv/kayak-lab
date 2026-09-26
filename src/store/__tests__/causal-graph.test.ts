import { assertEquals, assertArrayIncludes } from "@std/assert";
import {
  buildCausalGraph,
  findDownstream,
  findIndependentChains,
  getCausalParents,
} from "../causal-graph.ts";
import type { BaseEvent } from "../../types/events.ts";

// ============================================================================
// Helpers
// ============================================================================

function makeEvent(
  id: string,
  causalParents: string[] = [],
  overrides: Partial<BaseEvent> = {},
): BaseEvent {
  return {
    event_id: id,
    session_id: "session-1",
    sequence_number: 0,
    timestamp: new Date().toISOString(),
    event_type: "session.created",
    schema_version: 1,
    payload: {},
    metadata: { source: "test" },
    causal_parents: causalParents,
    ...overrides,
  };
}

// ============================================================================
// getCausalParents
// ============================================================================

Deno.test("getCausalParents", async (t) => {
  await t.step("returns causal_parents when present", () => {
    const event = makeEvent("a", ["p1", "p2"]);
    assertEquals(getCausalParents(event), ["p1", "p2"]);
  });

  await t.step("returns empty array when absent", () => {
    const event = makeEvent("a");
    assertEquals(getCausalParents(event), []);
  });
});

// ============================================================================
// buildCausalGraph
// ============================================================================

Deno.test("buildCausalGraph", async (t) => {
  await t.step("creates nodes for all events", () => {
    const events = [makeEvent("a"), makeEvent("b"), makeEvent("c")];
    const graph = buildCausalGraph(events);
    assertEquals(graph.size, 3);
    assertEquals(graph.has("a"), true);
    assertEquals(graph.has("b"), true);
    assertEquals(graph.has("c"), true);
  });

  await t.step("builds edges from causal_parents", () => {
    const events = [
      makeEvent("a"),
      makeEvent("b", ["a"]),
      makeEvent("c", ["b"]),
    ];
    const graph = buildCausalGraph(events);

    assertEquals(graph.get("a")!.children, ["b"]);
    assertEquals(graph.get("b")!.children, ["c"]);
    assertEquals(graph.get("c")!.children, []);
  });

  await t.step("handles multiple children", () => {
    const events = [
      makeEvent("a"),
      makeEvent("b", ["a"]),
      makeEvent("c", ["a"]),
    ];
    const graph = buildCausalGraph(events);
    assertArrayIncludes(graph.get("a")!.children, ["b", "c"]);
  });

  await t.step("ignores parents not in graph", () => {
    const events = [makeEvent("b", ["nonexistent"])];
    const graph = buildCausalGraph(events);
    assertEquals(graph.get("b")!.children, []);
  });
});

// ============================================================================
// findDownstream
// ============================================================================

Deno.test("findDownstream", async (t) => {
  await t.step("returns empty for leaf node", () => {
    const events = [makeEvent("a")];
    assertEquals(findDownstream("a", events), []);
  });

  await t.step("returns direct children", () => {
    const events = [
      makeEvent("a"),
      makeEvent("b", ["a"]),
    ];
    const downstream = findDownstream("a", events);
    assertEquals(downstream.length, 1);
    assertEquals(downstream[0].event_id, "b");
  });

  await t.step("returns transitive closure", () => {
    const events = [
      makeEvent("a"),
      makeEvent("b", ["a"]),
      makeEvent("c", ["b"]),
      makeEvent("d", ["c"]),
    ];
    const downstream = findDownstream("a", events);
    assertEquals(downstream.length, 3);
    const ids = downstream.map((e) => e.event_id);
    assertArrayIncludes(ids, ["b", "c", "d"]);
  });

  await t.step("handles diamond graphs without duplicates", () => {
    const events = [
      makeEvent("a"),
      makeEvent("b", ["a"]),
      makeEvent("c", ["a"]),
      makeEvent("d", ["b", "c"]),
    ];
    const downstream = findDownstream("a", events);
    assertEquals(downstream.length, 3);
    const ids = downstream.map((e) => e.event_id);
    assertArrayIncludes(ids, ["b", "c", "d"]);
  });

  await t.step("returns empty for nonexistent event", () => {
    assertEquals(findDownstream("nonexistent", []), []);
  });
});

// ============================================================================
// findIndependentChains
// ============================================================================

Deno.test("findIndependentChains", async (t) => {
  await t.step("returns empty for no events", () => {
    assertEquals(findIndependentChains([]), []);
  });

  await t.step("single chain returns one array", () => {
    const events = [
      makeEvent("a"),
      makeEvent("b", ["a"]),
      makeEvent("c", ["b"]),
    ];
    const chains = findIndependentChains(events);
    assertEquals(chains.length, 1);
    assertArrayIncludes(chains[0], ["a", "b", "c"]);
  });

  await t.step("two disconnected chains returns two arrays", () => {
    const events = [
      makeEvent("a"),
      makeEvent("b", ["a"]),
      makeEvent("x"),
      makeEvent("y", ["x"]),
    ];
    const chains = findIndependentChains(events);
    assertEquals(chains.length, 2);

    const chainA = chains.find((c) => c.includes("a"))!;
    const chainX = chains.find((c) => c.includes("x"))!;
    assertArrayIncludes(chainA, ["a", "b"]);
    assertArrayIncludes(chainX, ["x", "y"]);
  });

  await t.step("single event returns one chain with one element", () => {
    const events = [makeEvent("a")];
    const chains = findIndependentChains(events);
    assertEquals(chains.length, 1);
    assertEquals(chains[0], ["a"]);
  });
});
