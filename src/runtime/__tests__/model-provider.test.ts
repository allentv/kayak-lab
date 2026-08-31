import {
  assertEquals,
} from "@std/assert";
import {
  ModelManager,
  ProviderNotFoundError,
  ModelError,
} from "../model-provider.ts";
import { MockModelProvider } from "../../__test-utils__/mocks/mock-model.ts";

Deno.test("ModelManager", async (t) => {
  await t.step("registers a provider", () => {
    const manager = new ModelManager();
    const provider = new MockModelProvider("test", {
      responses: [{
        content: "Hello",
        tool_calls: [],
        finish_reason: "stop",
      }],
    });

    manager.register(provider);
    const retrieved = manager.getProvider("test");
    assertEquals(retrieved.name, "test");
  });

  await t.step("sets default provider", () => {
    const manager = new ModelManager();
    const provider = new MockModelProvider("test", {
      responses: [{
        content: "Hello",
        tool_calls: [],
        finish_reason: "stop",
      }],
    });

    manager.register(provider);
    manager.setDefaultProvider("test");
    const retrieved = manager.getProvider();
    assertEquals(retrieved.name, "test");
  });

  await t.step("throws for unknown provider", () => {
    const manager = new ModelManager();
    let threw = false;
    try {
      manager.getProvider("unknown");
    } catch (e) {
      threw = e instanceof ProviderNotFoundError;
    }
    assertEquals(threw, true);
  });

  await t.step("invokes default provider", async () => {
    const manager = new ModelManager();
    const provider = new MockModelProvider("test", {
      responses: [{
        content: "Hello",
        tool_calls: [],
        finish_reason: "stop",
      }],
    });

    manager.register(provider);
    const response = await manager.invoke({
      messages: [{ role: "user", content: "Hi" }],
    });

    assertEquals(response.content, "Hello");
    assertEquals(provider.invokeCount, 1);
  });

  await t.step("invokes specified provider", async () => {
    const manager = new ModelManager();
    const provider1 = new MockModelProvider("p1", {
      responses: [{
        content: "From P1",
        tool_calls: [],
        finish_reason: "stop",
      }],
    });
    const provider2 = new MockModelProvider("p2", {
      responses: [{
        content: "From P2",
        tool_calls: [],
        finish_reason: "stop",
      }],
    });

    manager.register(provider1);
    manager.register(provider2);

    const response = await manager.invoke(
      { messages: [{ role: "user", content: "Hi" }] },
      "p2",
    );

    assertEquals(response.content, "From P2");
    assertEquals(provider2.invokeCount, 1);
    assertEquals(provider1.invokeCount, 0);
  });

  await t.step("falls back to default on failure", async () => {
    const manager = new ModelManager();
    const failingProvider = new MockModelProvider("failing", {
      responses: [{ content: "", tool_calls: [], finish_reason: "stop" }],
      shouldFail: true,
    });
    const fallbackProvider = new MockModelProvider("fallback", {
      responses: [{
        content: "Fallback response",
        tool_calls: [],
        finish_reason: "stop",
      }],
    });

    manager.register(failingProvider);
    manager.register(fallbackProvider);
    manager.setDefaultProvider("failing");
    manager.setFallbackProviders(["fallback"]);

    const response = await manager.invoke({
      messages: [{ role: "user", content: "Hi" }],
    });

    assertEquals(response.content, "Fallback response");
    assertEquals(failingProvider.invokeCount, 1);
    assertEquals(fallbackProvider.invokeCount, 1);
  });

  await t.step("sets fallback providers", async () => {
    const manager = new ModelManager();
    const primary = new MockModelProvider("primary", {
      responses: [{ content: "", tool_calls: [], finish_reason: "stop" }],
      shouldFail: true,
    });
    const fallback1 = new MockModelProvider("fallback1", {
      responses: [{ content: "", tool_calls: [], finish_reason: "stop" }],
      shouldFail: true,
    });
    const fallback2 = new MockModelProvider("fallback2", {
      responses: [{
        content: "Success",
        tool_calls: [],
        finish_reason: "stop",
      }],
    });

    manager.register(primary);
    manager.register(fallback1);
    manager.register(fallback2);
    manager.setDefaultProvider("primary");
    manager.setFallbackProviders(["fallback1", "fallback2"]);

    const response = await manager.invoke({
      messages: [{ role: "user", content: "Hi" }],
    });

    assertEquals(response.content, "Success");
    assertEquals(primary.invokeCount, 1);
    assertEquals(fallback1.invokeCount, 1);
    assertEquals(fallback2.invokeCount, 1);
  });

  await t.step("throws when all providers fail", async () => {
    const manager = new ModelManager();
    const provider1 = new MockModelProvider("p1", {
      responses: [{ content: "", tool_calls: [], finish_reason: "stop" }],
      shouldFail: true,
    });
    const provider2 = new MockModelProvider("p2", {
      responses: [{ content: "", tool_calls: [], finish_reason: "stop" }],
      shouldFail: true,
    });

    manager.register(provider1);
    manager.register(provider2);
    manager.setDefaultProvider("p1");

    let threw = false;
    try {
      await manager.invoke({
        messages: [{ role: "user", content: "Hi" }],
      });
    } catch (e) {
      threw = e instanceof ModelError && e.message.includes("All providers failed");
    }
    assertEquals(threw, true);
  });

  await t.step("streams from provider", async () => {
    const manager = new ModelManager();
    const provider = new MockModelProvider("test", {
      responses: [{
        content: "Hello World",
        tool_calls: [],
        finish_reason: "stop",
      }],
      streamDeltas: [
        { content: "Hello ", finish_reason: undefined },
        { content: "World ", finish_reason: "stop" },
      ],
    });

    manager.register(provider);

    const chunks: string[] = [];
    for await (const delta of manager.stream({
      messages: [{ role: "user", content: "Hi" }],
    })) {
      if (delta.content) {
        chunks.push(delta.content);
      }
    }

    assertEquals(chunks.length, 2);
    assertEquals(chunks.join(""), "Hello World ");
  });
});
