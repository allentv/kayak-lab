/**
 * Unit tests for the memory subsystem.
 *
 * Covers: provider, types, storage, retrieval, update, shared, search, config.
 */

import {
  assertEquals,
  assertExists,
} from "@std/assert";
import {
  MemoryProvider,
  InMemoryStorage,
  PersistentStorage,
  DistributedStorage,
  FallbackStorage,
  MemoryRetrieval,
  MemoryUpdate,
  SharedMemory,
  MemorySearch,
  createMemoryConfig,
  validateMemoryConfig,
  DEFAULT_MEMORY_CONFIG,
} from "../mod.ts";
import type { AnyMemory } from "../mod.ts";
import { TypedEmitter } from "../emitter.ts";

// ============================================================================
// Helper: create a test memory
// ============================================================================

function makeMemory(overrides?: Partial<AnyMemory>): AnyMemory {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type: "short_term",
    content: "test memory content",
    session_id: "session-1",
    created_at: now,
    updated_at: now,
    status: "active",
    metadata: {},
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  } as AnyMemory;
}

// ============================================================================
// Provider Tests
// ============================================================================

Deno.test("MemoryProvider", async (t) => {
  await t.step("retain creates a memory entry", async () => {
    const provider = new MemoryProvider({ provider: "custom", settings: {} });
    const memory = await provider.retain({
      type: "short_term",
      content: "hello",
      session_id: "s1",
    });
    assertExists(memory.id);
    assertEquals(memory.type, "short_term");
    assertEquals(memory.content, "hello");
    assertEquals(memory.session_id, "s1");
    assertEquals(memory.status, "active");
  });

  await t.step("retain creates long-term memory with defaults", async () => {
    const provider = new MemoryProvider({ provider: "custom", settings: {} });
    const memory = await provider.retain({
      type: "long_term",
      content: "important fact",
      session_id: "s1",
    });
    assertEquals(memory.type, "long_term");
    if (memory.type === "long_term") {
      assertEquals(memory.importance, 0.5);
      assertEquals(memory.access_count, 0);
    }
  });

  await t.step("retain creates episodic memory", async () => {
    const provider = new MemoryProvider({ provider: "custom", settings: {} });
    const memory = await provider.retain({
      type: "episodic",
      content: "user asked about X",
      session_id: "s1",
      interaction_summary: "User inquired about X",
      direction: "user_to_agent",
    });
    assertEquals(memory.type, "episodic");
    if (memory.type === "episodic") {
      assertEquals(memory.direction, "user_to_agent");
      assertEquals(memory.interaction_summary, "User inquired about X");
    }
  });

  await t.step("retain creates semantic memory", async () => {
    const provider = new MemoryProvider({ provider: "custom", settings: {} });
    const memory = await provider.retain({
      type: "semantic",
      content: "The sky is blue",
      session_id: "s1",
      fact: "The sky is blue",
      confidence: 0.95,
      source: "observation",
    });
    assertEquals(memory.type, "semantic");
    if (memory.type === "semantic") {
      assertEquals(memory.fact, "The sky is blue");
      assertEquals(memory.confidence, 0.95);
      assertEquals(memory.source, "observation");
    }
  });

  await t.step("recall returns null for non-existent ID", async () => {
    const provider = new MemoryProvider({ provider: "custom", settings: {} });
    const result = await provider.recall("non-existent");
    assertEquals(result, null);
  });

  await t.step("reflect returns empty array by default", async () => {
    const provider = new MemoryProvider({ provider: "custom", settings: {} });
    const results = await provider.reflect("query");
    assertEquals(results.length, 0);
  });

  await t.step("delete returns false by default", async () => {
    const provider = new MemoryProvider({ provider: "custom", settings: {} });
    const result = await provider.delete("some-id");
    assertEquals(result, false);
  });

  await t.step("list returns empty array by default", async () => {
    const provider = new MemoryProvider({ provider: "custom", settings: {} });
    const results = await provider.list();
    assertEquals(results.length, 0);
  });

  await t.step("emits memory_operation events", async () => {
    const provider = new MemoryProvider({ provider: "custom", settings: {} });
    const events: string[] = [];
    provider.on("memory_operation", (e) => events.push(e.operation));

    await provider.retain({ type: "short_term", content: "x", session_id: "s1" });
    await provider.recall("id");
    await provider.reflect("q");
    await provider.delete("id");
    await provider.list();

    assertEquals(events, ["retain", "recall", "reflect", "delete", "list"]);
  });

  await t.step("providerType returns configured provider", () => {
    const provider = new MemoryProvider({ provider: "mem0", settings: {} });
    assertEquals(provider.providerType, "mem0");
  });

  await t.step("config returns a copy", () => {
    const provider = new MemoryProvider({ provider: "custom", settings: { key: "val" } });
    const config = provider.config;
    config.settings.key = "changed";
    assertEquals(provider.config.settings.key, "val");
  });
});

// ============================================================================
// Storage Tests
// ============================================================================

Deno.test("InMemoryStorage", async (t) => {
  await t.step("store and retrieve memory", async () => {
    const storage = new InMemoryStorage();
    const memory = makeMemory();
    await storage.store(memory);
    const retrieved = await storage.retrieve(memory.id);
    assertExists(retrieved);
    assertEquals(retrieved.id, memory.id);
    assertEquals(retrieved.content, memory.content);
  });

  await t.step("retrieve returns null for non-existent", async () => {
    const storage = new InMemoryStorage();
    const result = await storage.retrieve("non-existent");
    assertEquals(result, null);
  });

  await t.step("delete removes memory", async () => {
    const storage = new InMemoryStorage();
    const memory = makeMemory();
    await storage.store(memory);
    const deleted = await storage.delete(memory.id);
    assertEquals(deleted, true);
    const retrieved = await storage.retrieve(memory.id);
    assertEquals(retrieved, null);
  });

  await t.step("delete returns false for non-existent", async () => {
    const storage = new InMemoryStorage();
    const deleted = await storage.delete("non-existent");
    assertEquals(deleted, false);
  });

  await t.step("list returns memories sorted by created_at desc", async () => {
    const storage = new InMemoryStorage();
    const m1 = makeMemory({ content: "first", created_at: "2024-01-01T00:00:00Z" });
    const m2 = makeMemory({ content: "second", created_at: "2024-01-02T00:00:00Z" });
    await storage.store(m1);
    await storage.store(m2);
    const results = await storage.list();
    assertEquals(results.length, 2);
    assertEquals(results[0].content, "second");
    assertEquals(results[1].content, "first");
  });

  await t.step("list filters by type", async () => {
    const storage = new InMemoryStorage();
    await storage.store(makeMemory({ type: "short_term" }));
    await storage.store(makeMemory({ type: "long_term" }));
    await storage.store(makeMemory({ type: "short_term" }));
    const results = await storage.list({ type: "short_term" });
    assertEquals(results.length, 2);
    for (const r of results) {
      assertEquals(r.type, "short_term");
    }
  });

  await t.step("list respects max_results", async () => {
    const storage = new InMemoryStorage();
    for (let i = 0; i < 5; i++) {
      await storage.store(makeMemory({ content: `mem-${i}` }));
    }
    const results = await storage.list({ max_results: 3 });
    assertEquals(results.length, 3);
  });

  await t.step("isAvailable returns true", async () => {
    const storage = new InMemoryStorage();
    assertEquals(await storage.isAvailable(), true);
  });

  await t.step("size tracks stored count", async () => {
    const storage = new InMemoryStorage();
    assertEquals(storage.size, 0);
    await storage.store(makeMemory());
    assertEquals(storage.size, 1);
  });

  await t.step("emits memory_stored event", async () => {
    const storage = new InMemoryStorage();
    let emitted = false;
    storage.on("memory_stored", () => emitted = true);
    await storage.store(makeMemory());
    assertEquals(emitted, true);
  });
});

Deno.test("PersistentStorage", async (t) => {
  const testPath = `/tmp/memory-test-${crypto.randomUUID()}.json`;

  await t.step("store and retrieve memory", async () => {
    const storage = new PersistentStorage(testPath);
    const memory = makeMemory();
    await storage.store(memory);
    const retrieved = await storage.retrieve(memory.id);
    assertExists(retrieved);
    assertEquals(retrieved.id, memory.id);
  });

  await t.step("data persists across instances", async () => {
    const memory = makeMemory({ content: "persistent-data" });
    const s1 = new PersistentStorage(testPath);
    await s1.store(memory);

    const s2 = new PersistentStorage(testPath);
    const retrieved = await s2.retrieve(memory.id);
    assertExists(retrieved);
    assertEquals(retrieved.content, "persistent-data");
  });

  // Cleanup
  try {
    await Deno.remove(testPath);
  } catch {
    // ignore
  }
});

Deno.test("DistributedStorage", async (t) => {
  await t.step("isAvailable returns false by default", async () => {
    const storage = new DistributedStorage();
    assertEquals(await storage.isAvailable(), false);
  });

  await t.step("store throws when not available", async () => {
    const storage = new DistributedStorage();
    let threw = false;
    try {
      await storage.store(makeMemory());
    } catch {
      threw = true;
    }
    assertEquals(threw, true);
  });

  await t.step("enable makes storage available", async () => {
    const storage = new DistributedStorage();
    storage.enable();
    assertEquals(await storage.isAvailable(), true);
  });
});

Deno.test("FallbackStorage", async (t) => {
  await t.step("uses first available backend", async () => {
    const primary = new InMemoryStorage();
    const fallback = new InMemoryStorage();
    const fs = new FallbackStorage([primary, fallback]);

    const memory = makeMemory();
    await fs.store(memory);
    const retrieved = await primary.retrieve(memory.id);
    assertExists(retrieved);
  });

  await t.step("falls back to second backend on failure", async () => {
    const failing = new DistributedStorage(); // not available
    const fallback = new InMemoryStorage();
    const fs = new FallbackStorage([failing, fallback]);

    const memory = makeMemory();
    await fs.store(memory);
    const retrieved = await fallback.retrieve(memory.id);
    assertExists(retrieved);
  });

  await t.step("emits memory_fallback event on fallback", async () => {
    const failing = new DistributedStorage();
    const fallback = new InMemoryStorage();
    const fs = new FallbackStorage([failing, fallback]);
    let fallbackEmitted = false;
    fs.on("memory_fallback", () => fallbackEmitted = true);

    await fs.store(makeMemory());
    assertEquals(fallbackEmitted, true);
  });

  await t.step("throws when all backends fail", async () => {
    const failing1 = new DistributedStorage();
    const failing2 = new DistributedStorage();
    const fs = new FallbackStorage([failing1, failing2]);
    let threw = false;
    try {
      await fs.store(makeMemory());
    } catch {
      threw = true;
    }
    assertEquals(threw, true);
  });

  await t.step("throws with empty backends array", () => {
    let threw = false;
    try {
      new FallbackStorage([]);
    } catch {
      threw = true;
    }
    assertEquals(threw, true);
  });
});

// ============================================================================
// Retrieval Tests
// ============================================================================

Deno.test("MemoryRetrieval", async (t) => {
  await t.step("retrieve calls the provided function", async () => {
    const memories = [makeMemory({ content: "mem1" }), makeMemory({ content: "mem2" })];
    const retrieval = new MemoryRetrieval(async () => memories);
    const results = await retrieval.retrieve();
    assertEquals(results.length, 2);
  });

  await t.step("retrieve with query passes options", async () => {
    let receivedQuery: string | undefined;
    const retrieval = new MemoryRetrieval(async (opts) => {
      receivedQuery = opts?.query;
      return [];
    });
    await retrieval.retrieve({ query: "test-query" });
    assertEquals(receivedQuery, "test-query");
  });

  await t.step("session scope returns empty without session_id", async () => {
    const retrieval = new MemoryRetrieval(async () => [makeMemory()], {
      scope: "session",
    });
    const results = await retrieval.retrieve();
    assertEquals(results.length, 0);
  });

  await t.step("emits memory_retrieved event", async () => {
    const retrieval = new MemoryRetrieval(async () => [makeMemory()]);
    let emitted = false;
    retrieval.on("memory_retrieved", () => emitted = true);
    await retrieval.retrieve();
    assertEquals(emitted, true);
  });

  await t.step("configure updates config", async () => {
    const retrieval = new MemoryRetrieval(async () => []);
    retrieval.configure({ max_results: 5, relevance_threshold: 0.3 });
    const config = retrieval.getConfig();
    assertEquals(config.max_results, 5);
    assertEquals(config.relevance_threshold, 0.3);
  });
});

// ============================================================================
// Update Tests
// ============================================================================

Deno.test("MemoryUpdate", async (t) => {
  await t.step("autoStore calls storeFn and emits event", async () => {
    let storeCalled = false;
    const update = new MemoryUpdate(
      async (input) => {
        storeCalled = true;
        return makeMemory({ content: input.content });
      },
      async () => null,
    );
    let emitted = false;
    update.on("memory_updated", (e) => {
      emitted = true;
      assertEquals(e.automatic, true);
      assertEquals(e.operation, "store");
    });
    await update.autoStore({ type: "short_term", content: "auto", session_id: "s1" });
    assertEquals(storeCalled, true);
    assertEquals(emitted, true);
  });

  await t.step("manualStore calls storeFn with automatic=false", async () => {
    const update = new MemoryUpdate(
      async (input) => makeMemory({ content: input.content }),
      async () => null,
    );
    let automatic: boolean | undefined;
    update.on("memory_updated", (e) => automatic = e.automatic);
    await update.manualStore({ type: "short_term", content: "manual", session_id: "s1" });
    assertEquals(automatic, false);
  });

  await t.step("update calls updateFn and emits event", async () => {
    const updatedMemory = makeMemory({ content: "updated" });
    const update = new MemoryUpdate(
      async () => makeMemory(),
      async () => updatedMemory,
    );
    let emitted = false;
    update.on("memory_updated", (e) => {
      emitted = true;
      assertEquals(e.operation, "update");
    });
    const result = await update.update("mem-id", { content: "updated" });
    assertExists(result);
    assertEquals(result.content, "updated");
    assertEquals(emitted, true);
  });

  await t.step("update returns null when not found", async () => {
    const update = new MemoryUpdate(
      async () => makeMemory(),
      async () => null,
    );
    const result = await update.update("non-existent", { content: "x" });
    assertEquals(result, null);
  });
});

// ============================================================================
// Shared Memory Tests
// ============================================================================

Deno.test("SharedMemory", async (t) => {
  await t.step("addMemory and getAllMemories", () => {
    const shared = new SharedMemory();
    const m1 = makeMemory({ content: "shared-1" });
    const m2 = makeMemory({ content: "shared-2" });
    shared.addMemory(m1);
    shared.addMemory(m2);
    assertEquals(shared.getAllMemories().length, 2);
  });

  await t.step("shareContext shares memories with agent", async () => {
    const shared = new SharedMemory();
    const m1 = makeMemory({ content: "shared-1" });
    shared.addMemory(m1);
    await shared.shareContext("agent-1", [m1.id]);
    assertEquals(shared.getSharedAgents().includes("agent-1"), true);
  });

  await t.step("reference returns memory by ID after shareContext", async () => {
    const shared = new SharedMemory();
    const m1 = makeMemory({ content: "referenced" });
    shared.addMemory(m1);
    await shared.shareContext("agent-1", [m1.id]);
    const result = await shared.reference("agent-1", m1.id);
    assertExists(result);
    assertEquals(result.content, "referenced");
  });

  await t.step("reference returns null for non-existent", async () => {
    const shared = new SharedMemory();
    const result = await shared.reference("agent-1", "non-existent");
    assertEquals(result, null);
  });

  await t.step("reference returns null without shareContext", async () => {
    const shared = new SharedMemory();
    const m = makeMemory();
    shared.addMemory(m);
    const result = await shared.reference("agent-1", m.id);
    assertEquals(result, null);
  });

  await t.step("getSnapshot returns all memories", async () => {
    const shared = new SharedMemory();
    shared.addMemory(makeMemory({ content: "snap-1" }));
    shared.addMemory(makeMemory({ content: "snap-2" }));
    const snapshot = await shared.getSnapshot("agent-1");
    assertEquals(snapshot.memories.length, 2);
    assertExists(snapshot.id);
    assertExists(snapshot.timestamp);
    assertEquals(snapshot.agent_id, "agent-1");
  });

  await t.step("getSnapshot filters by type", async () => {
    const shared = new SharedMemory();
    shared.addMemory(makeMemory({ type: "short_term" }));
    shared.addMemory(makeMemory({ type: "long_term" }));
    const snapshot = await shared.getSnapshot("agent-1", { type: "short_term" });
    assertEquals(snapshot.memories.length, 1);
    assertEquals(snapshot.memories[0].type, "short_term");
  });

  await t.step("emits shared_memory events", async () => {
    const shared = new SharedMemory();
    const m = makeMemory();
    shared.addMemory(m);
    const ops: string[] = [];
    shared.on("shared_memory", (e) => ops.push(e.operation));

    await shared.shareContext("agent-1", [m.id]);
    await shared.reference("agent-1", m.id);
    await shared.getSnapshot("agent-1");

    assertEquals(ops, ["share", "reference", "snapshot"]);
  });

  await t.step("removeMemory removes from pool", () => {
    const shared = new SharedMemory();
    const m = makeMemory();
    shared.addMemory(m);
    assertEquals(shared.getAllMemories().length, 1);
    shared.removeMemory(m.id);
    assertEquals(shared.getAllMemories().length, 0);
  });
});

// ============================================================================
// Search Tests
// ============================================================================

Deno.test("MemorySearch", async (t) => {
  const memories: AnyMemory[] = [
    makeMemory({ content: "The quick brown fox jumps over the lazy dog", type: "semantic" }),
    makeMemory({ content: "TypeScript is a typed superset of JavaScript", type: "semantic" }),
    makeMemory({ content: "The fox was very quick and brown", type: "episodic" }),
  ];

  await t.step("keywordSearch finds matching memories", async () => {
    const search = new MemorySearch(memories);
    const results = await search.keywordSearch("fox");
    assertEquals(results.length, 3);
    // Top results have score > 0 (keyword match)
    assertEquals(results[0].score > 0, true);
    assertEquals(results[1].score > 0, true);
  });

  await t.step("semanticSearch finds similar memories", async () => {
    const search = new MemorySearch(memories);
    const results = await search.semanticSearch("quick brown animal");
    assertEquals(results.length >= 1, true);
  });

  await t.step("combinedSearch merges results", async () => {
    const search = new MemorySearch(memories);
    const results = await search.combinedSearch("fox quick");
    assertEquals(results.length >= 1, true);
  });

  await t.step("search with type filter", async () => {
    const search = new MemorySearch(memories);
    const results = await search.search("fox", {
      filters: { type: "semantic" },
    });
    for (const r of results) {
      assertEquals(r.memory.type, "semantic");
    }
  });

  await t.step("search respects max_results", async () => {
    const search = new MemorySearch(memories);
    const results = await search.search("fox", { max_results: 1 });
    assertEquals(results.length, 1);
  });

  await t.step("search respects relevance_threshold", async () => {
    const search = new MemorySearch(memories, { relevance_threshold: 0.99 });
    const results = await search.search("xyz nonexistent");
    assertEquals(results.length, 0);
  });

  await t.step("emits memory_search and memory_search_result events", async () => {
    const search = new MemorySearch(memories);
    const events: string[] = [];
    search.on("memory_search", () => events.push("search"));
    search.on("memory_search_result", () => events.push("result"));
    await search.search("fox");
    assertEquals(events.includes("search"), true);
    assertEquals(events.includes("result"), true);
  });

  await t.step("configure updates config", () => {
    const search = new MemorySearch();
    search.configure({ max_results: 20, default_type: "keyword" });
    const config = search.getConfig();
    assertEquals(config.max_results, 20);
    assertEquals(config.default_type, "keyword");
  });

  await t.step("addMemory and removeMemory update pool", async () => {
    const search = new MemorySearch();
    const m = makeMemory({ content: "test content" });
    search.addMemory(m);
    let results = await search.keywordSearch("test");
    assertEquals(results.length, 1);
    search.removeMemory(m.id);
    results = await search.keywordSearch("test");
    assertEquals(results.length, 0);
  });
});

// ============================================================================
// Config Tests
// ============================================================================

Deno.test("MemoryConfig", async (t) => {
  await t.step("DEFAULT_MEMORY_CONFIG has valid defaults", () => {
    const errors = validateMemoryConfig(DEFAULT_MEMORY_CONFIG);
    assertEquals(errors.length, 0);
  });

  await t.step("createMemoryConfig merges overrides", () => {
    const config = createMemoryConfig({
      provider: { provider: "mem0", settings: {} },
      retrieval: { max_results: 20, relevance_threshold: 0.5, scope: "session" },
    });
    assertEquals(config.provider.provider, "mem0");
    assertEquals(config.retrieval.max_results, 20);
    // Non-overridden fields keep defaults
    assertEquals(config.storage.backend, "in_memory");
  });

  await t.step("validateMemoryConfig catches invalid provider", () => {
    const config = createMemoryConfig({
      provider: { provider: "invalid" as any, settings: {} },
    });
    const errors = validateMemoryConfig(config);
    assertEquals(errors.length > 0, true);
  });

  await t.step("validateMemoryConfig catches negative max_results", () => {
    const config = createMemoryConfig({
      retrieval: { max_results: -1, relevance_threshold: 0, scope: "all" },
    });
    const errors = validateMemoryConfig(config);
    assertEquals(errors.length > 0, true);
  });

  await t.step("validateMemoryConfig catches out-of-range threshold", () => {
    const config = createMemoryConfig({
      retrieval: { max_results: 10, relevance_threshold: 1.5, scope: "all" },
    });
    const errors = validateMemoryConfig(config);
    assertEquals(errors.length > 0, true);
  });
});

// ============================================================================
// TypedEmitter Tests
// ============================================================================

Deno.test("TypedEmitter", async (t) => {
  await t.step("on and emit deliver events", () => {
    const emitter = new TypedEmitter<{ test: string }>();
    let received: string | undefined;
    emitter.on("test", (data) => received = data);
    emitter.emit("test", "hello");
    assertEquals(received, "hello");
  });

  await t.step("off removes handler", () => {
    const emitter = new TypedEmitter<{ test: string }>();
    let count = 0;
    const handler = () => count++;
    emitter.on("test", handler);
    emitter.emit("test", "a");
    emitter.off("test", handler);
    emitter.emit("test", "b");
    assertEquals(count, 1);
  });

  await t.step("removeAllListeners clears all handlers", () => {
    const emitter = new TypedEmitter<{ a: string; b: string }>();
    let countA = 0;
    let countB = 0;
    emitter.on("a", () => countA++);
    emitter.on("b", () => countB++);
    emitter.removeAllListeners();
    emitter.emit("a", "x");
    emitter.emit("b", "y");
    assertEquals(countA, 0);
    assertEquals(countB, 0);
  });

  await t.step("multiple handlers per event", () => {
    const emitter = new TypedEmitter<{ test: number }>();
    const results: number[] = [];
    emitter.on("test", (n) => results.push(n));
    emitter.on("test", (n) => results.push(n * 2));
    emitter.emit("test", 5);
    assertEquals(results, [5, 10]);
  });
});
