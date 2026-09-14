/**
 * Tests for L2 Scenario and L3 Core memory in SQLitePersistenceBackend.
 */

import { assertEquals, assertExists } from "@std/assert";
import { SQLitePersistenceBackend } from "../sqlite-backend.ts";

// ============================================================================
// Test Helpers
// ============================================================================

function createBackend(): SQLitePersistenceBackend {
  return new SQLitePersistenceBackend({ dbPath: ":memory:" });
}

// ============================================================================
// L2 Scenario Memory Tests
// ============================================================================

Deno.test("ScenarioMemory - write and read", async () => {
  const backend = createBackend();

  const scenario = await backend.writeScenario(
    "agent-1",
    "git.workflow",
    "# Git Workflow\n\nUse feature branches.",
    "Git Workflow",
  );

  assertEquals(scenario.type, "scenario");
  assertEquals(scenario.path, "git.workflow");
  assertEquals(scenario.name, "Git Workflow");
  assertEquals(scenario.agent_id, "agent-1");
  assertEquals(scenario.content, "# Git Workflow\n\nUse feature branches.");
  assertExists(scenario.id);
  assertExists(scenario.created_at);
  assertExists(scenario.updated_at);

  const read = await backend.readScenario("agent-1", "git.workflow");
  assertExists(read);
  assertEquals(read?.path, "git.workflow");
  assertEquals(read?.content, "# Git Workflow\n\nUse feature branches.");

  backend.close();
});

Deno.test("ScenarioMemory - overwrite preserves created_at", async () => {
  const backend = createBackend();

  const first = await backend.writeScenario("agent-1", "git.workflow", "v1", "Git");
  const second = await backend.writeScenario("agent-1", "git.workflow", "v2", "Git Updated");

  assertEquals(second.id, first.id);
  assertEquals(second.content, "v2");
  assertEquals(second.name, "Git Updated");
  assertEquals(second.created_at, first.created_at);
  assertEquals(second.updated_at >= first.updated_at, true);

  backend.close();
});

Deno.test("ScenarioMemory - read returns null for missing", async () => {
  const backend = createBackend();

  const result = await backend.readScenario("agent-1", "nonexistent");
  assertEquals(result, null);

  backend.close();
});

Deno.test("ScenarioMemory - delete", async () => {
  const backend = createBackend();

  await backend.writeScenario("agent-1", "git.workflow", "content", "Git");
  const deleted = await backend.deleteScenario("agent-1", "git.workflow");
  assertEquals(deleted, true);

  const read = await backend.readScenario("agent-1", "git.workflow");
  assertEquals(read, null);

  // Deleting non-existent returns true (already gone)
  const deletedAgain = await backend.deleteScenario("agent-1", "git.workflow");
  assertEquals(deletedAgain, true);

  backend.close();
});

Deno.test("ScenarioMemory - list all", async () => {
  const backend = createBackend();

  await backend.writeScenario("agent-1", "git.workflow", "content1", "Git");
  await backend.writeScenario("agent-1", "error-handling.retry", "content2", "Retry");
  await backend.writeScenario("agent-1", "deployment.full-guide", "content3", "Deploy");

  const all = await backend.listScenarios("agent-1");
  assertEquals(all.length, 3);

  // Sorted by path
  assertEquals(all[0].path, "deployment.full-guide");
  assertEquals(all[1].path, "error-handling.retry");
  assertEquals(all[2].path, "git.workflow");

  backend.close();
});

Deno.test("ScenarioMemory - list with prefix", async () => {
  const backend = createBackend();

  await backend.writeScenario("agent-1", "git.workflow", "content1", "Git");
  await backend.writeScenario("agent-1", "git.branching", "content2", "Branching");
  await backend.writeScenario("agent-1", "error-handling.retry", "content3", "Retry");

  const gitScenarios = await backend.listScenarios("agent-1", "git.");
  assertEquals(gitScenarios.length, 2);
  assertEquals(gitScenarios[0].path, "git.branching");
  assertEquals(gitScenarios[1].path, "git.workflow");

  backend.close();
});

Deno.test("ScenarioMemory - count", async () => {
  const backend = createBackend();

  await backend.writeScenario("agent-1", "git.workflow", "content1", "Git");
  await backend.writeScenario("agent-1", "error-handling.retry", "content2", "Retry");

  const count = await backend.countScenarios("agent-1");
  assertEquals(count, 2);

  // Different agent has zero
  const count2 = await backend.countScenarios("agent-2");
  assertEquals(count2, 0);

  backend.close();
});

// ============================================================================
// L3 Core Memory Tests
// ============================================================================

Deno.test("CoreMemory - write and read", async () => {
  const backend = createBackend();

  const sections = {
    name: "Kayak Agent",
    goals: "Assist users with code tasks",
    constraints: "Never fabricate",
  };

  const core = await backend.writeCore("agent-1", sections);

  assertEquals(core.type, "core");
  assertEquals(core.agent_id, "agent-1");
  assertEquals(core.sections, sections);
  assertExists(core.id);
  assertExists(core.created_at);
  assertExists(core.updated_at);

  const read = await backend.readCore("agent-1");
  assertExists(read);
  assertEquals(read?.sections, sections);

  backend.close();
});

Deno.test("CoreMemory - overwrite preserves created_at", async () => {
  const backend = createBackend();

  const sections1 = { name: "Kayak", goals: "v1" };
  const first = await backend.writeCore("agent-1", sections1);
  const sections2 = { name: "Kayak", goals: "v2" };
  const second = await backend.writeCore("agent-1", sections2);

  assertEquals(second.id, first.id);
  assertEquals(second.sections, sections2);
  assertEquals(second.created_at, first.created_at);
  assertEquals(second.updated_at >= first.updated_at, true);

  backend.close();
});

Deno.test("CoreMemory - singleton per agent", async () => {
  const backend = createBackend();

  await backend.writeCore("agent-1", { name: "Kayak" });
  await backend.writeCore("agent-2", { name: "Scout" });

  const core1 = await backend.readCore("agent-1");
  const core2 = await backend.readCore("agent-2");

  assertExists(core1);
  assertExists(core2);
  assertEquals(core1?.sections, { name: "Kayak" });
  assertEquals(core2?.sections, { name: "Scout" });

  backend.close();
});

Deno.test("CoreMemory - read returns null for missing", async () => {
  const backend = createBackend();

  const result = await backend.readCore("agent-nonexistent");
  assertEquals(result, null);

  backend.close();
});

// ============================================================================
// Agent Isolation Tests
// ============================================================================

Deno.test("Agent isolation - two agents with same path don't conflict", async () => {
  const backend = createBackend();

  await backend.writeScenario("agent-1", "git.workflow", "content-1", "Git (Agent 1)");
  await backend.writeScenario("agent-2", "git.workflow", "content-2", "Git (Agent 2)");

  const s1 = await backend.readScenario("agent-1", "git.workflow");
  const s2 = await backend.readScenario("agent-2", "git.workflow");

  assertExists(s1);
  assertExists(s2);
  assertEquals(s1?.content, "content-1");
  assertEquals(s2?.content, "content-2");

  // List returns only the agent's scenarios
  const list1 = await backend.listScenarios("agent-1");
  assertEquals(list1.length, 1);
  assertEquals(list1[0].content, "content-1");

  backend.close();
});

// ============================================================================
// Storage Independence Tests
// ============================================================================

Deno.test("Storage independence - existing memories table unaffected", async () => {
  const backend = createBackend();

  // Write to existing memories table
  const memory = {
    id: "mem-1",
    type: "semantic" as const,
    content: "test memory",
    session_id: "session-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "active" as const,
    metadata: {},
    fact: "a fact",
    confidence: 0.9,
  };
  await backend.store(memory);

  // Write L2/L3
  await backend.writeScenario("agent-1", "git.workflow", "content", "Git");
  await backend.writeCore("agent-1", { name: "Kayak" });

  // Existing memories still work
  const mem = await backend.retrieve("mem-1");
  assertExists(mem);
  assertEquals(mem?.type, "semantic");

  // L2/L3 don't interfere
  const scenario = await backend.readScenario("agent-1", "git.workflow");
  assertExists(scenario);
  const core = await backend.readCore("agent-1");
  assertExists(core);

  // List memories still returns only standard memories
  const memories = await backend.list();
  assertEquals(memories.length, 1);
  assertEquals(memories[0].type, "semantic");

  backend.close();
});

Deno.test("L2/L3 - throws after close", async () => {
  const backend = createBackend();
  await backend.writeScenario("agent-1", "test", "content", "Test");
  backend.close();

  let threw = false;
  try {
    await backend.writeScenario("agent-1", "test2", "content", "Test2");
  } catch {
    threw = true;
  }
  assertEquals(threw, true);

  threw = false;
  try {
    await backend.readScenario("agent-1", "test");
  } catch {
    threw = true;
  }
  assertEquals(threw, true);

  threw = false;
  try {
    await backend.writeCore("agent-1", { name: "Test" });
  } catch {
    threw = true;
  }
  assertEquals(threw, true);

  threw = false;
  try {
    await backend.readCore("agent-1");
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});