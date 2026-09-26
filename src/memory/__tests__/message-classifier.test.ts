import { assertEquals, assertStrictEquals } from "@std/assert";
import { MessageClassifier } from "../message-classifier.ts";
import { MessagePriority, OutcomeScore } from "../provenance-context-types.ts";
import type { Message } from "../../runtime/model-provider.ts";
import type { ProvenanceGraphData } from "../../provenance/types.ts";
import { ProvenanceNodeType } from "../../provenance/types.ts";

// ============================================================================
// Helpers
// ============================================================================

function systemMsg(content = "system prompt"): Message {
  return { role: "system", content };
}

function userMsg(content: string): Message {
  return { role: "user", content };
}

function assistantMsg(content: string): Message {
  return { role: "assistant", content };
}

function toolMsg(content: string, toolCallId = "call-1"): Message {
  return { role: "tool", content, tool_call_id: toolCallId };
}

function makeGraph(
  nodes: { id: string; type: ProvenanceNodeType; meta?: Record<string, unknown> }[],
  edges: { from: string; to: string }[],
): ProvenanceGraphData {
  return {
    session_id: "session-1",
    nodes: nodes.map((n) => ({
      node_id: n.id,
      node_type: n.type,
      session_id: "session-1",
      timestamp: new Date().toISOString(),
      causal_parents: [],
      metadata: n.meta ?? {},
    })),
    edges: edges.map((e) => ({
      from: e.from,
      to: e.to,
      type: "causal" as const,
    })),
  };
}

// ============================================================================
// Base Priority Classification
// ============================================================================

Deno.test("MessageClassifier - getBasePriority", async (t) => {
  const classifier = new MessageClassifier();

  await t.step("system messages get SYSTEM priority", () => {
    assertEquals(classifier.getBasePriority(systemMsg()), MessagePriority.SYSTEM);
  });

  await t.step("user messages starting with 'goal:' get GOAL priority", () => {
    assertEquals(classifier.getBasePriority(userMsg("goal: implement auth")), MessagePriority.GOAL);
  });

  await t.step("user messages starting with 'task:' get GOAL priority", () => {
    assertEquals(classifier.getBasePriority(userMsg("task: fix bug")), MessagePriority.GOAL);
  });

  await t.step("user messages starting with 'request:' get GOAL priority", () => {
    assertEquals(classifier.getBasePriority(userMsg("request: add feature")), MessagePriority.GOAL);
  });

  await t.step("user messages without prefix get OTHER priority", () => {
    assertEquals(classifier.getBasePriority(userMsg("hello")), MessagePriority.OTHER);
  });

  await t.step("tool results with 'wrote' get COMMITMENT priority", () => {
    assertEquals(
      classifier.getBasePriority(toolMsg("wrote to file")),
      MessagePriority.COMMITMENT,
    );
  });

  await t.step("tool results with 'exit code' get VERIFICATION priority", () => {
    assertEquals(
      classifier.getBasePriority(toolMsg("exit code: 0")),
      MessagePriority.VERIFICATION,
    );
  });

  await t.step("tool results with 'passed' get VERIFICATION priority", () => {
    assertEquals(
      classifier.getBasePriority(toolMsg("All tests passed")),
      MessagePriority.VERIFICATION,
    );
  });

  await t.step("tool results with 'read' get EXPLORATION priority", () => {
    assertEquals(
      classifier.getBasePriority(toolMsg("read file content")),
      MessagePriority.EXPLORATION,
    );
  });

  await t.step("assistant messages get OTHER priority", () => {
    assertEquals(classifier.getBasePriority(assistantMsg("thinking...")), MessagePriority.OTHER);
  });
});

// ============================================================================
// Message Type Heuristics
// ============================================================================

Deno.test("MessageClassifier - message type heuristics", async (t) => {
  const classifier = new MessageClassifier();

  await t.step("isGoalMessage detects goal prefix", () => {
    assertEquals(classifier.isGoalMessage(userMsg("goal: do something")), true);
    assertEquals(classifier.isGoalMessage(userMsg("GOAL: do something")), true);
    assertEquals(classifier.isGoalMessage(userMsg("not a goal")), false);
  });

  await t.step("isCommitmentMessage detects mutating keywords", () => {
    assertEquals(classifier.isCommitmentMessage(toolMsg("created file")), true);
    assertEquals(classifier.isCommitmentMessage(toolMsg("modified line 5")), true);
    assertEquals(classifier.isCommitmentMessage(toolMsg("deleted section")), true);
    assertEquals(classifier.isCommitmentMessage(toolMsg("applied patch")), true);
    assertEquals(classifier.isCommitmentMessage(toolMsg("wrote to disk")), true);
    assertEquals(classifier.isCommitmentMessage(toolMsg("read file")), false);
  });

  await t.step("isVerificationMessage detects verification keywords", () => {
    assertEquals(classifier.isVerificationMessage(toolMsg("exit code: 1")), true);
    assertEquals(classifier.isVerificationMessage(toolMsg("test failed")), true);
    assertEquals(classifier.isVerificationMessage(toolMsg("error: not found")), true);
    assertEquals(classifier.isVerificationMessage(toolMsg("test result: pass")), true);
    assertEquals(classifier.isVerificationMessage(toolMsg("read file")), false);
  });

  await t.step("isExplorationMessage detects read-only keywords", () => {
    assertEquals(classifier.isExplorationMessage(toolMsg("read file")), true);
    assertEquals(classifier.isExplorationMessage(toolMsg("searched for pattern")), true);
    assertEquals(classifier.isExplorationMessage(toolMsg("found 3 matches")), true);
    assertEquals(classifier.isExplorationMessage(toolMsg("file content follows")), true);
    assertEquals(classifier.isExplorationMessage(toolMsg("wrote file")), false);
  });

  await t.step("non-tool messages are not classified as tool types", () => {
    assertEquals(classifier.isCommitmentMessage(assistantMsg("created")), false);
    assertEquals(classifier.isVerificationMessage(userMsg("exit code")), false);
    assertEquals(classifier.isExplorationMessage(systemMsg("read")), false);
  });
});

// ============================================================================
// Score Calculation
// ============================================================================

Deno.test("MessageClassifier - scoreMessage combines priority and outcome", async (t) => {
  const classifier = new MessageClassifier();

  await t.step("score equals base priority when no graph", () => {
    const score = classifier.scoreMessage(systemMsg());
    assertEquals(score, MessagePriority.SYSTEM + OutcomeScore.NO_LINK);
  });

  await t.step("score includes base priority for goal messages", () => {
    const score = classifier.scoreMessage(userMsg("goal: implement"));
    assertEquals(score, MessagePriority.GOAL + OutcomeScore.NO_LINK);
  });
});

// ============================================================================
// Provenance Graph
// ============================================================================

Deno.test("MessageClassifier - provenance graph integration", async (t) => {
  const classifier = new MessageClassifier();

  await t.step("no graph by default", () => {
    assertStrictEquals(classifier.getProvenanceGraph(), null);
  });

  await t.step("setProvenanceGraph stores graph", () => {
    const graph = makeGraph(
      [{ id: "a", type: ProvenanceNodeType.Goal }],
      [],
    );
    classifier.setProvenanceGraph(graph);
    assertStrictEquals(classifier.getProvenanceGraph(), graph);
  });

  await t.step("isGraphSufficient requires >= 3 nodes", () => {
    classifier.setProvenanceGraph(makeGraph(
      [{ id: "a", type: ProvenanceNodeType.Goal }],
      [],
    ));
    assertEquals(classifier.isGraphSufficient(), false);

    classifier.setProvenanceGraph(makeGraph(
      [
        { id: "a", type: ProvenanceNodeType.Goal },
        { id: "b", type: ProvenanceNodeType.Commitment },
        { id: "c", type: ProvenanceNodeType.Verification },
      ],
      [],
    ));
    assertEquals(classifier.isGraphSufficient(), true);
  });
});

// ============================================================================
// Graph Traversal Helpers
// ============================================================================

Deno.test("MessageClassifier - graph traversal helpers", async (t) => {
  const classifier = new MessageClassifier();

  await t.step("getChildNodes returns direct children", () => {
    classifier.setProvenanceGraph(makeGraph(
      [
        { id: "a", type: ProvenanceNodeType.Goal },
        { id: "b", type: ProvenanceNodeType.Commitment },
        { id: "c", type: ProvenanceNodeType.Verification },
      ],
      [
        { from: "a", to: "b" },
        { from: "b", to: "c" },
      ],
    ));

    const children = classifier.getChildNodes("a");
    assertEquals(children.length, 1);
    assertEquals(children[0].node_id, "b");
  });

  await t.step("getChildNodes returns empty for leaf nodes", () => {
    classifier.setProvenanceGraph(makeGraph(
      [{ id: "a", type: ProvenanceNodeType.Verification }],
      [],
    ));
    assertEquals(classifier.getChildNodes("a").length, 0);
  });

  await t.step("hasDescendantOfType finds nested descendants", () => {
    classifier.setProvenanceGraph(makeGraph(
      [
        { id: "a", type: ProvenanceNodeType.Goal },
        { id: "b", type: ProvenanceNodeType.Exploration },
        { id: "c", type: ProvenanceNodeType.Verification, meta: { exit_code: 0 } },
      ],
      [
        { from: "a", to: "b" },
        { from: "b", to: "c" },
      ],
    ));

    assertEquals(
      classifier.hasDescendantOfType("a", [ProvenanceNodeType.Verification]),
      true,
    );
    assertEquals(
      classifier.hasDescendantOfType("a", [ProvenanceNodeType.Commitment]),
      false,
    );
  });

  await t.step("isSuccessfulOutcome detects exit code 0 in verification child", () => {
    classifier.setProvenanceGraph(makeGraph(
      [
        { id: "a", type: ProvenanceNodeType.Commitment },
        { id: "b", type: ProvenanceNodeType.Verification, meta: { exit_code: 0 } },
      ],
      [{ from: "a", to: "b" }],
    ));

    const node = classifier.getProvenanceGraph()!.nodes[0];
    assertEquals(classifier.isSuccessfulOutcome(node), true);
  });

  await t.step("isFailedOutcome detects non-zero exit code in verification child", () => {
    classifier.setProvenanceGraph(makeGraph(
      [
        { id: "a", type: ProvenanceNodeType.Commitment },
        { id: "b", type: ProvenanceNodeType.Verification, meta: { exit_code: 1 } },
      ],
      [{ from: "a", to: "b" }],
    ));

    const node = classifier.getProvenanceGraph()!.nodes[0];
    assertEquals(classifier.isFailedOutcome(node), true);
  });

  await t.step("isDeadEnd returns true when no commitment/verification descendants", () => {
    classifier.setProvenanceGraph(makeGraph(
      [
        { id: "a", type: ProvenanceNodeType.Exploration },
        { id: "b", type: ProvenanceNodeType.Exploration },
      ],
      [{ from: "a", to: "b" }],
    ));

    const node = classifier.getProvenanceGraph()!.nodes[0];
    assertEquals(classifier.isDeadEnd(node), true);
  });

  await t.step("isDeadEnd returns false when commitment descendant exists", () => {
    classifier.setProvenanceGraph(makeGraph(
      [
        { id: "a", type: ProvenanceNodeType.Exploration },
        { id: "b", type: ProvenanceNodeType.Commitment },
      ],
      [{ from: "a", to: "b" }],
    ));

    const node = classifier.getProvenanceGraph()!.nodes[0];
    assertEquals(classifier.isDeadEnd(node), false);
  });
});

// ============================================================================
// findNodeForMessage (currently stubbed)
// ============================================================================

Deno.test("MessageClassifier - findNodeForMessage returns null (stub)", () => {
  const classifier = new MessageClassifier();
  assertEquals(classifier.findNodeForMessage(toolMsg("test")), null);
});
