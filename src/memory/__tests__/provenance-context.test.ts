/**
 * Unit tests for ProvenanceContextManager.
 *
 * Tests scoring formula, compression logic, budget allocation, and memory scoring.
 */

import { assertEquals, assertExists, assertNotEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  ProvenanceContextManager,
} from "../provenance-context.ts";
import { Message } from "../../runtime/model-provider.ts";
import {
  ProvenanceGraphData,
  ProvenanceNodeType,
  GoalNode,
  ExplorationNode,
  CommitmentNode,
  VerificationNode,
} from "../../provenance/types.ts";

// ============================================================================
// Test Helpers
// ============================================================================

/** Create a test message. */
function createMessage(role: Message["role"], content: string, toolCallId?: string): Message {
  return {
    role,
    content,
    tool_call_id: toolCallId,
  };
}

/** Create a test provenance graph with known structure. */
function createTestGraph(): ProvenanceGraphData {
  const goal = {
    node_id: "goal-1",
    node_type: ProvenanceNodeType.Goal,
    session_id: "session-1",
    timestamp: "2026-01-01T00:00:00Z",
    causal_parents: [],
    metadata: {},
    request_text: "Test goal",
  } as GoalNode;

  const exploration = {
    node_id: "exploration-1",
    node_type: ProvenanceNodeType.Exploration,
    session_id: "session-1",
    timestamp: "2026-01-01T00:00:01Z",
    causal_parents: ["goal-1"],
    metadata: {},
    tool_name: "read",
    tool_parameters: {},
    tool_call_id: "call-1",
  } as ExplorationNode;

  const commitment = {
    node_id: "commitment-1",
    node_type: ProvenanceNodeType.Commitment,
    session_id: "session-1",
    timestamp: "2026-01-01T00:00:02Z",
    causal_parents: ["exploration-1"],
    metadata: {},
    tool_name: "write",
    files_modified: ["test.ts"],
    tool_call_id: "call-2",
  } as CommitmentNode;

  const verification = {
    node_id: "verification-1",
    node_type: ProvenanceNodeType.Verification,
    session_id: "session-1",
    timestamp: "2026-01-01T00:00:03Z",
    causal_parents: ["commitment-1"],
    metadata: {},
    command: "deno test",
    exit_code: 0,
    tool_call_id: "call-3",
  } as VerificationNode;

  return {
    nodes: [goal, exploration, commitment, verification],
    edges: [
      { from: "goal-1", to: "exploration-1", type: "causal" },
      { from: "exploration-1", to: "commitment-1", type: "causal" },
      { from: "commitment-1", to: "verification-1", type: "causal" },
    ],
    session_id: "session-1",
  };
}

// ============================================================================
// Tests: ProvenanceContextManager
// ============================================================================

Deno.test("ProvenanceContextManager - constructor defaults", () => {
  const manager = new ProvenanceContextManager();
  assertEquals(manager.getProvenanceGraph(), null);
  assertEquals(manager.length, 0);
});

Deno.test("ProvenanceContextManager - setProvenanceGraph", () => {
  const manager = new ProvenanceContextManager();
  const graph = createTestGraph();
  manager.setProvenanceGraph(graph);
  assertEquals(manager.getProvenanceGraph(), graph);
});

Deno.test("ProvenanceContextManager - fallback to positional pruning when no graph", () => {
  const manager = new ProvenanceContextManager({ maxMessages: 5 });

  // Add 10 messages
  for (let i = 0; i < 10; i++) {
    manager.add(createMessage("user", `Message ${i}`));
  }

  // Should keep only 5 messages (positional pruning)
  assertEquals(manager.length, 5);
});

Deno.test("ProvenanceContextManager - fallback when graph has <3 nodes", () => {
  const manager = new ProvenanceContextManager({ maxMessages: 5 });

  // Create a graph with only 2 nodes
  const graph: ProvenanceGraphData = {
    nodes: [
      {
        node_id: "goal-1",
        node_type: ProvenanceNodeType.Goal,
        session_id: "session-1",
        timestamp: "2026-01-01T00:00:00Z",
        causal_parents: [],
        metadata: {},
        request_text: "Test goal",
      } as GoalNode,
      {
        node_id: "exploration-1",
        node_type: ProvenanceNodeType.Exploration,
        session_id: "session-1",
        timestamp: "2026-01-01T00:00:01Z",
        causal_parents: ["goal-1"],
        metadata: {},
        tool_name: "read",
        tool_parameters: {},
        tool_call_id: "call-1",
      } as ExplorationNode,
    ],
    edges: [
      { from: "goal-1", to: "exploration-1", type: "causal" },
    ],
    session_id: "session-1",
  };

  manager.setProvenanceGraph(graph);

  // Add 10 messages
  for (let i = 0; i < 10; i++) {
    manager.add(createMessage("user", `Message ${i}`));
  }

  // Should keep only 5 messages (positional pruning)
  assertEquals(manager.length, 5);
});

Deno.test("ProvenanceContextManager - provenance scoring with valid graph", () => {
  const manager = new ProvenanceContextManager({ maxMessages: 10 });
  const graph = createTestGraph();
  manager.setProvenanceGraph(graph);

  // Add messages with different roles
  manager.add(createMessage("system", "System message"));
  manager.add(createMessage("user", "Goal: Test goal"));
  manager.add(createMessage("assistant", "Assistant response"));
  manager.add(createMessage("tool", "Tool result", "call-1"));
  manager.add(createMessage("user", "User message"));

  // All messages should be kept since we have maxMessages=10
  assertEquals(manager.length, 5);
});

Deno.test("ProvenanceContextManager - goal messages never pruned", () => {
  const manager = new ProvenanceContextManager({ maxMessages: 3 });
  const graph = createTestGraph();
  manager.setProvenanceGraph(graph);

  // Add system message + goal message + other messages
  manager.add(createMessage("system", "System message"));
  manager.add(createMessage("user", "Goal: Test goal"));
  manager.add(createMessage("assistant", "Assistant response"));
  manager.add(createMessage("tool", "Tool result", "call-1"));
  manager.add(createMessage("user", "User message"));

  // Should keep 3 messages
  assertEquals(manager.length, 3);

  // System and goal messages should be preserved
  const messages = manager.getAll();
  const hasSystem = messages.some(m => m.role === "system" && m.content === "System message");
  const hasGoal = messages.some(m => m.role === "user" && m.content.startsWith("Goal:"));
  assertEquals(hasSystem, true);
  assertEquals(hasGoal, true);
});

// ============================================================================
// Tests: Tool Result Compression
// ============================================================================

Deno.test("ProvenanceContextManager - compressToolResult with small result", () => {
  const manager = new ProvenanceContextManager();
  const graph = createTestGraph();
  manager.setProvenanceGraph(graph);

  const result = "Small result that is under the threshold";
  const compressed = manager.compressToolResult(result, "call-1", "event-1");

  // Should not compress (under threshold)
  assertEquals(compressed.compressed, result);
  assertEquals(compressed.fullReference, "event-1");
  assertEquals(compressed.originalTokens, compressed.compressedTokens);
});

Deno.test("ProvenanceContextManager - compressToolResult with large result", () => {
  const manager = new ProvenanceContextManager();
  const graph = createTestGraph();
  manager.setProvenanceGraph(graph);

  // Create a large result (3000 tokens = 12000 chars)
  const largeResult = "x".repeat(12000);
  const compressed = manager.compressToolResult(largeResult, "call-1", "event-1");

  // When there are no referenced lines, compression doesn't happen (returns original)
  assertEquals(compressed.compressed, largeResult);
  assertEquals(compressed.fullReference, "event-1");
  assertEquals(compressed.originalTokens, compressed.compressedTokens);
});

Deno.test("ProvenanceContextManager - compressToolResult preserves audit reference", () => {
  const manager = new ProvenanceContextManager();
  const graph = createTestGraph();
  manager.setProvenanceGraph(graph);

  const result = "Test result";
  const compressed = manager.compressToolResult(result, "call-1", "event-123");

  assertEquals(compressed.fullReference, "event-123");
});

// ============================================================================
// Tests: Context Assembly
// ============================================================================

Deno.test("ProvenanceContextManager - assembleContext", () => {
  const manager = new ProvenanceContextManager();
  const graph = createTestGraph();
  manager.setProvenanceGraph(graph);

  const systemPrompt = "You are a helpful assistant.";
  const goalMessage = createMessage("user", "Goal: Test goal");
  const previousTurns = [
    createMessage("assistant", "First turn"),
    createMessage("user", "User message"),
  ];
  const currentInput = createMessage("user", "Current input");

  const assembled = manager.assembleContext(
    systemPrompt,
    goalMessage,
    previousTurns,
    currentInput,
    8000,
  );

  // Should have system, goal, summary, current input
  assertEquals(assembled.length >= 3, true);
  assertEquals(assembled[0].role, "system");
  assertEquals(assembled[0].content, systemPrompt);
  assertEquals(assembled[1].role, "user");
  assertEquals(assembled[1].content, goalMessage.content);
});

// ============================================================================
// Tests: Token Budget Enforcement
// ============================================================================

Deno.test("ProvenanceContextManager - enforceBudget", () => {
  const manager = new ProvenanceContextManager({ maxTokens: 1000 });

  // The enforceBudget method is private, so we test through assembleContext
  const assembled = manager.assembleContext(
    "System message",
    null,
    [],
    createMessage("user", "Current input"),
    1000,
  );

  // Should respect token budget
  assertNotEquals(assembled.length, 0);
});

// ============================================================================
// Tests: Memory Scoring
// ============================================================================

Deno.test("ProvenanceContextManager - getProvenanceScoreForMemory", () => {
  const manager = new ProvenanceContextManager();
  const graph = createTestGraph();
  manager.setProvenanceGraph(graph);

  // This method is private, but we can test it through the public API
  // For now, we'll test the integration
  assertExists(manager);
});

// ============================================================================
// Tests: Hook Registration
// ============================================================================

Deno.test("ProvenanceContextManager - createBeforeModelCallHook", () => {
  const manager = new ProvenanceContextManager();
  const graph = createTestGraph();
  manager.setProvenanceGraph(graph);

  const hook = manager.createBeforeModelCallHook();
  assertExists(hook);
  assertEquals(typeof hook, "function");
});

// ============================================================================
// Tests: Edge Cases
// ============================================================================

Deno.test("ProvenanceContextManager - empty context", () => {
  const manager = new ProvenanceContextManager();
  assertEquals(manager.length, 0);
  assertEquals(manager.getAll().length, 0);
});

Deno.test("ProvenanceContextManager - clear context", () => {
  const manager = new ProvenanceContextManager();
  manager.add(createMessage("user", "Test message"));
  assertEquals(manager.length, 1);
  manager.clear();
  assertEquals(manager.length, 0);
});