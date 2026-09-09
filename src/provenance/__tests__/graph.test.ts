import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { ProvenanceGraph } from "../graph.ts";
import { ProvenanceNodeType } from "../types.ts";
import type { ProvenanceNode } from "../types.ts";

// ============================================================================
// Helpers
// ============================================================================

function goalNode(overrides?: Partial<Omit<ProvenanceNode, "node_id" | "timestamp">>) {
  return {
    node_type: ProvenanceNodeType.Goal as const,
    session_id: "s1",
    causal_parents: [],
    metadata: {},
    request_text: "test goal",
    ...overrides,
  };
}

function explorationNode(overrides?: Partial<Omit<ProvenanceNode, "node_id" | "timestamp">>) {
  return {
    node_type: ProvenanceNodeType.Exploration as const,
    session_id: "s1",
    causal_parents: [],
    metadata: {},
    tool_name: "grep",
    tool_parameters: {},
    tool_call_id: "tc1",
    ...overrides,
  };
}

function commitmentNode(overrides?: Partial<Omit<ProvenanceNode, "node_id" | "timestamp">>) {
  return {
    node_type: ProvenanceNodeType.Commitment as const,
    session_id: "s1",
    causal_parents: [],
    metadata: {},
    tool_name: "edit",
    files_modified: ["src/a.ts"],
    tool_call_id: "tc2",
    ...overrides,
  };
}

function verificationNode(overrides?: Partial<Omit<ProvenanceNode, "node_id" | "timestamp">>) {
  return {
    node_type: ProvenanceNodeType.Verification as const,
    session_id: "s1",
    causal_parents: [],
    metadata: {},
    command: "deno check",
    exit_code: 0,
    tool_call_id: "tc3",
    ...overrides,
  };
}

function patchNode(overrides?: Partial<Omit<ProvenanceNode, "node_id" | "timestamp">>) {
  return {
    node_type: ProvenanceNodeType.PatchProposal as const,
    session_id: "s1",
    causal_parents: [],
    metadata: {},
    files_changed: 1,
    tool_calls_made: 2,
    turn_number: 1,
    summary: "patch",
    ...overrides,
  };
}

// ============================================================================
// addNode
// ============================================================================

Deno.test("addNode auto-generates id and timestamp", () => {
  const graph = new ProvenanceGraph("s1");
  const node = graph.addNode(goalNode());

  assertExists(node.node_id);
  assertEquals(typeof node.node_id, "string");
  assertEquals(node.node_id.length > 0, true);

  assertExists(node.timestamp);
  // Valid ISO-8601
  assertEquals(Number.isNaN(Date.parse(node.timestamp)), false);

  assertEquals(node.session_id, "s1");
  assertEquals(node.node_type, ProvenanceNodeType.Goal);
});

// ============================================================================
// addEdge
// ============================================================================

Deno.test("addEdge validates source node exists", () => {
  const graph = new ProvenanceGraph("s1");
  const n2 = graph.addNode(goalNode());

  assertThrows(
    () => graph.addEdge("nonexistent", n2.node_id),
    Error,
    "Source node not found",
  );
});

Deno.test("addEdge validates target node exists", () => {
  const graph = new ProvenanceGraph("s1");
  const n1 = graph.addNode(goalNode());

  assertThrows(
    () => graph.addEdge(n1.node_id, "nonexistent"),
    Error,
    "Target node not found",
  );
});

Deno.test("addEdge succeeds for existing nodes", () => {
  const graph = new ProvenanceGraph("s1");
  const n1 = graph.addNode(goalNode());
  const n2 = graph.addNode(explorationNode());

  graph.addEdge(n1.node_id, n2.node_id, "causal");
  // No throw = success
  assertEquals(true, true);
});

// ============================================================================
// getChildren / getParents
// ============================================================================

Deno.test("getChildren returns direct children", () => {
  const graph = new ProvenanceGraph("s1");
  const g = graph.addNode(goalNode());
  const e1 = graph.addNode(explorationNode());
  const e2 = graph.addNode(explorationNode());

  graph.addEdge(g.node_id, e1.node_id);
  graph.addEdge(g.node_id, e2.node_id);

  const children = graph.getChildren(g.node_id);
  assertEquals(children.length, 2);
  const ids = children.map((c) => c.node_id).sort();
  assertEquals(ids, [e1.node_id, e2.node_id].sort());
});

Deno.test("getChildren returns empty for leaf node", () => {
  const graph = new ProvenanceGraph("s1");
  const n = graph.addNode(goalNode());
  assertEquals(graph.getChildren(n.node_id).length, 0);
});

Deno.test("getChildren returns empty for nonexistent node", () => {
  const graph = new ProvenanceGraph("s1");
  assertEquals(graph.getChildren("nope").length, 0);
});

Deno.test("getParents returns direct parents", () => {
  const graph = new ProvenanceGraph("s1");
  const g = graph.addNode(goalNode());
  const c1 = graph.addNode(commitmentNode());
  const c2 = graph.addNode(commitmentNode());

  graph.addEdge(g.node_id, c1.node_id);
  graph.addEdge(g.node_id, c2.node_id);

  const parentsOfC1 = graph.getParents(c1.node_id);
  assertEquals(parentsOfC1.length, 1);
  assertEquals(parentsOfC1[0].node_id, g.node_id);

  const parentsOfC2 = graph.getParents(c2.node_id);
  assertEquals(parentsOfC2.length, 1);
  assertEquals(parentsOfC2[0].node_id, g.node_id);
});

Deno.test("getParents returns multiple parents", () => {
  const graph = new ProvenanceGraph("s1");
  const g = graph.addNode(goalNode());
  const v = graph.addNode(verificationNode());
  const c = graph.addNode(commitmentNode());

  graph.addEdge(g.node_id, c.node_id);
  graph.addEdge(v.node_id, c.node_id);

  const parents = graph.getParents(c.node_id);
  assertEquals(parents.length, 2);
  const ids = parents.map((p) => p.node_id).sort();
  assertEquals(ids, [g.node_id, v.node_id].sort());
});

// ============================================================================
// getReachable
// ============================================================================

Deno.test("getReachable returns transitive closure", () => {
  const graph = new ProvenanceGraph("s1");
  const n1 = graph.addNode(goalNode());
  const n2 = graph.addNode(explorationNode());
  const n3 = graph.addNode(commitmentNode());
  const n4 = graph.addNode(verificationNode());

  // n1 -> n2 -> n3 -> n4 (linear chain)
  graph.addEdge(n1.node_id, n2.node_id);
  graph.addEdge(n2.node_id, n3.node_id);
  graph.addEdge(n3.node_id, n4.node_id);

  const reachable = graph.getReachable(n1.node_id);
  assertEquals(reachable.length, 4);
  const ids = reachable.map((n) => n.node_id);
  assertEquals(ids.includes(n1.node_id), true);
  assertEquals(ids.includes(n2.node_id), true);
  assertEquals(ids.includes(n3.node_id), true);
  assertEquals(ids.includes(n4.node_id), true);
});

Deno.test("getReachable handles diamond graph", () => {
  const graph = new ProvenanceGraph("s1");
  const n1 = graph.addNode(goalNode());
  const n2 = graph.addNode(explorationNode());
  const n3 = graph.addNode(explorationNode());
  const n4 = graph.addNode(commitmentNode());

  // n1 -> n2 -> n4, n1 -> n3 -> n4
  graph.addEdge(n1.node_id, n2.node_id);
  graph.addEdge(n1.node_id, n3.node_id);
  graph.addEdge(n2.node_id, n4.node_id);
  graph.addEdge(n3.node_id, n4.node_id);

  const reachable = graph.getReachable(n1.node_id);
  assertEquals(reachable.length, 4);
});

Deno.test("getReachable returns empty for nonexistent node", () => {
  const graph = new ProvenanceGraph("s1");
  assertEquals(graph.getReachable("nope").length, 0);
});

Deno.test("getReachable returns only start if no outgoing edges", () => {
  const graph = new ProvenanceGraph("s1");
  const n = graph.addNode(goalNode());
  const reachable = graph.getReachable(n.node_id);
  assertEquals(reachable.length, 1);
  assertEquals(reachable[0].node_id, n.node_id);
});

// ============================================================================
// getNodesByType
// ============================================================================

Deno.test("getNodesByType filters correctly", () => {
  const graph = new ProvenanceGraph("s1");
  graph.addNode(goalNode());
  graph.addNode(goalNode());
  graph.addNode(explorationNode());
  graph.addNode(commitmentNode());
  graph.addNode(verificationNode());
  graph.addNode(patchNode());

  assertEquals(graph.getNodesByType(ProvenanceNodeType.Goal).length, 2);
  assertEquals(graph.getNodesByType(ProvenanceNodeType.Exploration).length, 1);
  assertEquals(graph.getNodesByType(ProvenanceNodeType.Commitment).length, 1);
  assertEquals(graph.getNodesByType(ProvenanceNodeType.Verification).length, 1);
  assertEquals(graph.getNodesByType(ProvenanceNodeType.PatchProposal).length, 1);
});

Deno.test("getNodesByType returns empty when no nodes of type", () => {
  const graph = new ProvenanceGraph("s1");
  graph.addNode(goalNode());
  assertEquals(graph.getNodesByType(ProvenanceNodeType.PatchProposal).length, 0);
});

// ============================================================================
// toJSON / fromJSON round-trip
// ============================================================================

Deno.test("toJSON/fromJSON round-trips correctly", () => {
  const graph = new ProvenanceGraph("s1");
  const n1 = graph.addNode(goalNode());
  const n2 = graph.addNode(explorationNode());
  graph.addEdge(n1.node_id, n2.node_id, "causal");

  const data = graph.toJSON();
  assertEquals(data.session_id, "s1");
  assertEquals(data.nodes.length, 2);
  assertEquals(data.edges.length, 1);

  const restored = ProvenanceGraph.fromJSON(data);
  assertEquals(restored.toJSON().session_id, "s1");
  assertEquals(restored.toJSON().nodes.length, 2);
  assertEquals(restored.toJSON().edges.length, 1);

  const children = restored.getChildren(n1.node_id);
  assertEquals(children.length, 1);
  assertEquals(children[0].node_id, n2.node_id);
});

// ============================================================================
// 50-node performance test
// ============================================================================

Deno.test("50-node graph operations complete quickly", () => {
  const graph = new ProvenanceGraph("perf");
  const nodes: ProvenanceNode[] = [];

  for (let i = 0; i < 50; i++) {
    const type = i % 4;
    switch (type) {
      case 0: nodes.push(graph.addNode(goalNode())); break;
      case 1: nodes.push(graph.addNode(explorationNode())); break;
      case 2: nodes.push(graph.addNode(commitmentNode())); break;
      case 3: nodes.push(graph.addNode(verificationNode())); break;
    }
  }

  // Chain: 0->1->2->3->4->...->49
  for (let i = 0; i < 49; i++) {
    graph.addEdge(nodes[i].node_id, nodes[i + 1].node_id);
  }

  // Cross-links for density
  for (let i = 0; i < 48; i++) {
    graph.addEdge(nodes[i].node_id, nodes[i + 2].node_id);
  }

  // Verify traversal
  const reachable = graph.getReachable(nodes[0].node_id);
  assertEquals(reachable.length, 50);

  // Verify type filtering
  const goals = graph.getNodesByType(ProvenanceNodeType.Goal);
  assertEquals(goals.length, 13); // 0,4,8,...,48 = 13 goals

  // Verify serialization round-trip
  const data = graph.toJSON();
  const restored = ProvenanceGraph.fromJSON(data);
  assertEquals(restored.getReachable(nodes[0].node_id).length, 50);
});

// ============================================================================
// writeToDisk / loadFromDisk
// ============================================================================

Deno.test("writeToDisk and loadFromDisk round-trip", async () => {
  const graph = new ProvenanceGraph("session-persist");
  graph.addNode(goalNode());
  const exp = graph.addNode(explorationNode());
  const comm = graph.addNode(commitmentNode());
  graph.addEdge(exp.node_id, comm.node_id);

  const tmpDir = await Deno.makeTempDir({ prefix: "provenance-test-" });
  try {
    await graph.writeToDisk(tmpDir);
    const loaded = await ProvenanceGraph.loadFromDisk(tmpDir, "session-persist");
    assertExists(loaded);
    assertEquals(loaded.toJSON().nodes.length, 3);
    assertEquals(loaded.toJSON().edges.length, 1);
    assertEquals(loaded.toJSON().session_id, "session-persist");
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});

Deno.test("loadFromDisk returns undefined for missing file", async () => {
  const loaded = await ProvenanceGraph.loadFromDisk("/nonexistent/path", "missing");
  assertEquals(loaded, undefined);
});

Deno.test("writeToDisk handles empty graph", async () => {
  const graph = new ProvenanceGraph("session-empty");
  const tmpDir = await Deno.makeTempDir({ prefix: "provenance-test-" });
  try {
    await graph.writeToDisk(tmpDir);
    const loaded = await ProvenanceGraph.loadFromDisk(tmpDir, "session-empty");
    assertExists(loaded);
    assertEquals(loaded.toJSON().nodes.length, 0);
    assertEquals(loaded.toJSON().edges.length, 0);
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});

Deno.test("writeToDisk handles single-node graph", async () => {
  const graph = new ProvenanceGraph("session-single");
  graph.addNode(goalNode());

  const tmpDir = await Deno.makeTempDir({ prefix: "provenance-test-" });
  try {
    await graph.writeToDisk(tmpDir);
    const loaded = await ProvenanceGraph.loadFromDisk(tmpDir, "session-single");
    assertExists(loaded);
    assertEquals(loaded.toJSON().nodes.length, 1);
    assertEquals(loaded.toJSON().edges.length, 0);
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});
