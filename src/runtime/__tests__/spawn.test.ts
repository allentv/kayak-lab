import {
  assertEquals,
  assertExists,
} from "@std/assert";
import { EventStream } from "../../core/event-stream.ts";
import { SessionManager } from "../../core/session-manager.ts";
import { ModelManager } from "../model-provider.ts";
import { ToolRegistry } from "../tool-registry.ts";
import { ProfileRegistry } from "../profile-registry.ts";
import { createSpawnConfig } from "../spawn-config.ts";
import { spawn } from "../spawn.ts";
import { MockModelProvider } from "../../__test-utils__/mocks/mock-model.ts";
import type { SpawnDependencies } from "../spawn.ts";

function createDeps(): SpawnDependencies {
  const eventStream = new EventStream();
  const sessionManager = new SessionManager(eventStream);
  const modelManager = new ModelManager();
  const toolRegistry = new ToolRegistry();
  return { eventStream, sessionManager, modelManager, toolRegistry };
}

function makeRegistry(): ProfileRegistry {
  const registry = new ProfileRegistry();
  registry.register({
    name: "reviewer",
    model: "mock-reviewer",
    tools: ["read", "grep"],
    context: "You are a code reviewer.",
    temperature: 0.3,
    maxIterations: 3,
  });
  registry.register({
    name: "quick",
    extends: "reviewer",
    model: "mock-quick",
    maxIterations: 2,
    streaming: false,
  });
  return registry;
}

Deno.test("spawn", async (t) => {
  await t.step("spawns sub-agent with profile config", async () => {
    const deps = createDeps();
    const registry = makeRegistry();
    const provider = new MockModelProvider("mock-reviewer", {
      responses: [{ content: "Review complete", tool_calls: [], finish_reason: "stop" }],
    });
    deps.modelManager.register(provider);

    const config = createSpawnConfig(registry)
      .fromProfile("reviewer")
      .build();

    const result = await spawn(deps, config, "Review this code");

    assertEquals(result, "Review complete");
    assertEquals(provider.requests[0].model, "mock-reviewer");
    assertEquals(provider.requests[0].temperature, 0.3);
  });

  await t.step("spawns with profile + overrides", async () => {
    const deps = createDeps();
    const registry = makeRegistry();
    const provider = new MockModelProvider("mock-override", {
      responses: [{ content: "Done", tool_calls: [], finish_reason: "stop" }],
    });
    deps.modelManager.register(provider);

    const config = createSpawnConfig(registry)
      .fromProfile("reviewer")
      .withModel("mock-override")
      .withTemperature(0.9)
      .build();

    const result = await spawn(deps, config, "Do something");

    assertEquals(result, "Done");
    assertEquals(provider.requests[0].model, "mock-override");
    assertEquals(provider.requests[0].temperature, 0.9);
  });

  await t.step("injects context into task", async () => {
    const deps = createDeps();
    const registry = makeRegistry();
    const provider = new MockModelProvider("mock-reviewer", {
      responses: [{ content: "Got it", tool_calls: [], finish_reason: "stop" }],
    });
    deps.modelManager.register(provider);

    const config = createSpawnConfig(registry)
      .fromProfile("reviewer")
      .build();

    await spawn(deps, config, "Review this");

    // The task should have context prepended
    const userMsg = provider.requests[0].messages.find(
      (m) => m.role === "user",
    );
    assertExists(userMsg);
    assertEquals(
      (userMsg.content as string).includes("You are a code reviewer"),
      true,
    );
  });

  await t.step("spawns without profile", async () => {
    const deps = createDeps();
    const registry = makeRegistry();
    const provider = new MockModelProvider("mock-default", {
      responses: [{ content: "ok", tool_calls: [], finish_reason: "stop" }],
    });
    deps.modelManager.register(provider);

    const config = createSpawnConfig(registry)
      .withModel("mock-default")
      .build();

    const result = await spawn(deps, config, "test");

    assertEquals(result, "ok");
    assertEquals(provider.requests[0].model, "mock-default");
  });

  await t.step("inherits from parent profile", async () => {
    const deps = createDeps();
    const registry = makeRegistry();
    const provider = new MockModelProvider("mock-quick", {
      responses: [{ content: "fast", tool_calls: [], finish_reason: "stop" }],
    });
    deps.modelManager.register(provider);

    const config = createSpawnConfig(registry)
      .fromProfile("quick")
      .build();

    const result = await spawn(deps, config, "quick task");

    assertEquals(result, "fast");
    // quick extends reviewer, model overridden
    assertEquals(provider.requests[0].model, "mock-quick");
    // temperature inherited from reviewer
    assertEquals(provider.requests[0].temperature, 0.3);
  });

  await t.step("respects maxIterations from profile", async () => {
    const deps = createDeps();
    const registry = makeRegistry();

    deps.toolRegistry.register({
      name: "loop_tool",
      description: "Loops forever",
      parameters: { type: "object" },
      handler: () => "result",
    });

    const provider = new MockModelProvider("mock-reviewer", {
      responses: [
        {
          content: null,
          tool_calls: [{ id: "tc1", name: "loop_tool", arguments: {} }],
          finish_reason: "tool_calls",
        },
        {
          content: null,
          tool_calls: [{ id: "tc2", name: "loop_tool", arguments: {} }],
          finish_reason: "tool_calls",
        },
        {
          content: null,
          tool_calls: [{ id: "tc3", name: "loop_tool", arguments: {} }],
          finish_reason: "tool_calls",
        },
        {
          content: "should not reach",
          tool_calls: [],
          finish_reason: "stop",
        },
      ],
    });
    deps.modelManager.register(provider);

    const config = createSpawnConfig(registry)
      .fromProfile("reviewer") // maxIterations: 3
      .build();

    // Should throw because maxIterations=3 is exceeded
    let threw = false;
    try {
      await spawn(deps, config, "loop test");
    } catch {
      threw = true;
    }
    assertEquals(threw, true);
  });
});
