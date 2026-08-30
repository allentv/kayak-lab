import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ModelManager,
  ProviderNotFoundError,
  ModelError,
} from "../model-provider.ts";
import type {
  IModelProvider,
  ModelRequest,
  ModelResponse,
  StreamDelta,
} from "../model-provider.ts";

/** Mock model provider for testing. */
class MockProvider implements IModelProvider {
  name: string;
  private response: ModelResponse;
  private shouldFail: boolean;
  private invokeCount = 0;

  constructor(
    name: string,
    response: ModelResponse,
    shouldFail = false,
  ) {
    this.name = name;
    this.response = response;
    this.shouldFail = shouldFail;
  }

  getInvokeCount(): number {
    return this.invokeCount;
  }

  async invoke(_request: ModelRequest): Promise<ModelResponse> {
    this.invokeCount++;
    if (this.shouldFail) {
      throw new Error(`${this.name} failed`);
    }
    return this.response;
  }

  async *stream(_request: ModelRequest): AsyncIterable<StreamDelta> {
    this.invokeCount++;
    if (this.shouldFail) {
      throw new Error(`${this.name} failed`);
    }

    // Yield content in chunks
    if (this.response.content) {
      const chunks = this.response.content.split(" ");
      for (const chunk of chunks) {
        yield { content: chunk + " " };
      }
    }

    // Yield tool calls
    if (this.response.tool_calls.length > 0) {
      yield {
        tool_calls: this.response.tool_calls.map((tc) => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments,
        })),
        finish_reason: "tool_calls",
      };
    } else {
      yield { finish_reason: "stop" };
    }
  }
}

Deno.test("ModelManager", async (t) => {
  await t.step("registers a provider", () => {
    const manager = new ModelManager();
    const provider = new MockProvider("test", {
      content: "Hello",
      tool_calls: [],
      finish_reason: "stop",
    });

    manager.register(provider);
    const retrieved = manager.getProvider("test");
    assertEquals(retrieved.name, "test");
  });

  await t.step("sets default provider", () => {
    const manager = new ModelManager();
    const provider = new MockProvider("test", {
      content: "Hello",
      tool_calls: [],
      finish_reason: "stop",
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
    const provider = new MockProvider("test", {
      content: "Hello",
      tool_calls: [],
      finish_reason: "stop",
    });

    manager.register(provider);
    const response = await manager.invoke({
      messages: [{ role: "user", content: "Hi" }],
    });

    assertEquals(response.content, "Hello");
    assertEquals(provider.getInvokeCount(), 1);
  });

  await t.step("invokes specified provider", async () => {
    const manager = new ModelManager();
    const provider1 = new MockProvider("p1", {
      content: "From P1",
      tool_calls: [],
      finish_reason: "stop",
    });
    const provider2 = new MockProvider("p2", {
      content: "From P2",
      tool_calls: [],
      finish_reason: "stop",
    });

    manager.register(provider1);
    manager.register(provider2);

    const response = await manager.invoke(
      { messages: [{ role: "user", content: "Hi" }] },
      "p2",
    );

    assertEquals(response.content, "From P2");
    assertEquals(provider2.getInvokeCount(), 1);
    assertEquals(provider1.getInvokeCount(), 0);
  });

  await t.step("falls back to default on failure", async () => {
    const manager = new ModelManager();
    const failingProvider = new MockProvider(
      "failing",
      { content: "", tool_calls: [], finish_reason: "stop" },
      true,
    );
    const fallbackProvider = new MockProvider("fallback", {
      content: "Fallback response",
      tool_calls: [],
      finish_reason: "stop",
    });

    manager.register(failingProvider);
    manager.register(fallbackProvider);
    manager.setDefaultProvider("failing");
    manager.setFallbackProviders(["fallback"]);

    const response = await manager.invoke({
      messages: [{ role: "user", content: "Hi" }],
    });

    assertEquals(response.content, "Fallback response");
    assertEquals(failingProvider.getInvokeCount(), 1);
    assertEquals(fallbackProvider.getInvokeCount(), 1);
  });

  await t.step("sets fallback providers", async () => {
    const manager = new ModelManager();
    const primary = new MockProvider(
      "primary",
      { content: "", tool_calls: [], finish_reason: "stop" },
      true,
    );
    const fallback1 = new MockProvider(
      "fallback1",
      { content: "", tool_calls: [], finish_reason: "stop" },
      true,
    );
    const fallback2 = new MockProvider("fallback2", {
      content: "Success",
      tool_calls: [],
      finish_reason: "stop",
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
    assertEquals(primary.getInvokeCount(), 1);
    assertEquals(fallback1.getInvokeCount(), 1);
    assertEquals(fallback2.getInvokeCount(), 1);
  });

  await t.step("throws when all providers fail", async () => {
    const manager = new ModelManager();
    const provider1 = new MockProvider(
      "p1",
      { content: "", tool_calls: [], finish_reason: "stop" },
      true,
    );
    const provider2 = new MockProvider(
      "p2",
      { content: "", tool_calls: [], finish_reason: "stop" },
      true,
    );

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
    const provider = new MockProvider("test", {
      content: "Hello World",
      tool_calls: [],
      finish_reason: "stop",
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
