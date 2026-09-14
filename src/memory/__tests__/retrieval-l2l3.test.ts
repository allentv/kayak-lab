/**
 * Tests for MemoryRetrieval L2/L3 integration.
 */

import { assertEquals, assertExists } from "@std/assert";
import { MemoryRetrieval } from "../retrieval.ts";
import { SQLitePersistenceBackend } from "../../store/sqlite-backend.ts";

// ============================================================================
// Test Helpers
// ============================================================================

function createBackend(): SQLitePersistenceBackend {
  return new SQLitePersistenceBackend({ dbPath: ":memory:" });
}

function createMockRetrieveFn() {
  return async () => [];
}

// ============================================================================
// MemoryRetrieval L2/L3 Tests
// ============================================================================

Deno.test("MemoryRetrieval - returns L2/L3 alongside standard memories", async () => {
  const backend = createBackend();
  const retrieval = new MemoryRetrieval(
    createMockRetrieveFn(),
    {},
    0.3,
    backend,
  );

  // Write L2/L3 data
  await backend.writeScenario("agent-1", "git.workflow", "Use feature branches", "Git Workflow");
  await backend.writeCore("agent-1", { name: "Kayak", goals: "Assist users" });

  const results = await retrieval.retrieve({ agentId: "agent-1" });

  // Should have 2 results (L2 + L3)
  assertEquals(results.length, 2);

  // Check that both types are present
  const types = results.map((r) => r.memory.type);
  assertEquals(types.includes("scenario"), true);
  assertEquals(types.includes("core"), true);

  // Check scores are set
  for (const result of results) {
    assertEquals(result.relevance_score > 0, true);
    assertEquals(typeof result.final_score, "number");
  }

  backend.close();
});

Deno.test("MemoryRetrieval - type filter returns only matching type", async () => {
  const backend = createBackend();
  const retrieval = new MemoryRetrieval(
    createMockRetrieveFn(),
    {},
    0.3,
    backend,
  );

  await backend.writeScenario("agent-1", "git.workflow", "Use feature branches", "Git Workflow");
  await backend.writeCore("agent-1", { name: "Kayak" });

  // Filter by scenario type
  const scenarioResults = await retrieval.retrieve({ agentId: "agent-1", type: "scenario" });
  assertEquals(scenarioResults.length, 1);
  assertEquals(scenarioResults[0].memory.type, "scenario");

  // Filter by core type
  const coreResults = await retrieval.retrieve({ agentId: "agent-1", type: "core" });
  assertEquals(coreResults.length, 1);
  assertEquals(coreResults[0].memory.type, "core");

  // Filter by semantic type (no L2/L3)
  const semanticResults = await retrieval.retrieve({ agentId: "agent-1", type: "semantic" });
  assertEquals(semanticResults.length, 0);

  backend.close();
});

Deno.test("MemoryRetrieval - without agentId skips L2/L3", async () => {
  const backend = createBackend();
  const retrieval = new MemoryRetrieval(
    createMockRetrieveFn(),
    {},
    0.3,
    backend,
  );

  await backend.writeScenario("agent-1", "git.workflow", "Use feature branches", "Git Workflow");
  await backend.writeCore("agent-1", { name: "Kayak" });

  // No agentId — should not return L2/L3
  const results = await retrieval.retrieve({});
  assertEquals(results.length, 0);

  backend.close();
});

Deno.test("MemoryRetrieval - L2/L3 scores are reasonable", async () => {
  const backend = createBackend();
  const retrieval = new MemoryRetrieval(
    createMockRetrieveFn(),
    {},
    0.3,
    backend,
  );

  await backend.writeScenario("agent-1", "git.workflow", "Use feature branches", "Git Workflow");
  await backend.writeCore("agent-1", { name: "Kayak" });

  const results = await retrieval.retrieve({ agentId: "agent-1" });

  // Core should have higher base score than scenario
  const coreResult = results.find((r) => r.memory.type === "core");
  const scenarioResult = results.find((r) => r.memory.type === "scenario");

  assertExists(coreResult);
  assertExists(scenarioResult);

  // Core base score (0.9) > Scenario base score (0.85)
  assertEquals(coreResult.relevance_score > scenarioResult.relevance_score, true);

  backend.close();
});

Deno.test("MemoryRetrieval - works without storage (backward compatible)", async () => {
  const retrieval = new MemoryRetrieval(
    createMockRetrieveFn(),
    {},
    0.3,
    // No storage — backward compatible
  );

  // Should not throw
  const results = await retrieval.retrieve({ agentId: "agent-1" });
  assertEquals(results.length, 0);
});
