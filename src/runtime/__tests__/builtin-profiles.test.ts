import {
  assertEquals,
} from "@std/assert";
import { ProfileRegistry } from "../profile-registry.ts";
import {
  builtinProfiles,
  reviewerProfile,
  scoutProfile,
  coderProfile,
  quickProfile,
} from "../profiles.ts";
import { createSpawnConfig } from "../spawn-config.ts";
import { EventStream } from "../../core/event-stream.ts";
import { SessionManager } from "../../core/session-manager.ts";
import { ModelManager } from "../model-provider.ts";
import { ToolRegistry } from "../tool-registry.ts";
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

function registerBuiltinProfiles(): ProfileRegistry {
  const registry = new ProfileRegistry();
  for (const profile of builtinProfiles) {
    registry.register(profile);
  }
  return registry;
}

Deno.test("Built-in profiles", async (t) => {
  await t.step("all built-in profiles are defined", () => {
    assertEquals(builtinProfiles.length, 4);
    assertEquals(builtinProfiles.map((p) => p.name).sort(), [
      "coder",
      "quick",
      "reviewer",
      "scout",
    ]);
  });

  await t.step("reviewer profile has correct defaults", () => {
    assertEquals(reviewerProfile.name, "reviewer");
    assertEquals(reviewerProfile.tools, ["read", "grep", "glob", "find"]);
    assertEquals(reviewerProfile.maxIterations, 5);
    assertEquals(reviewerProfile.temperature, 0.3);
  });

  await t.step("scout profile has correct defaults", () => {
    assertEquals(scoutProfile.name, "scout");
    assertEquals(scoutProfile.tools, ["read", "grep", "glob", "find"]);
    assertEquals(scoutProfile.maxIterations, 3);
    assertEquals(scoutProfile.streaming, true);
  });

  await t.step("coder profile has full tool access", () => {
    assertEquals(coderProfile.name, "coder");
    assertEquals(coderProfile.tools, [
      "read", "grep", "glob", "find",
      "edit", "write", "bash",
    ]);
    assertEquals(coderProfile.maxIterations, 15);
  });

  await t.step("quick profile inherits from reviewer", () => {
    assertEquals(quickProfile.extends, "reviewer");
    assertEquals(quickProfile.maxIterations, 3);
  });

  await t.step("quick profile resolves with reviewer defaults", () => {
    const registry = registerBuiltinProfiles();
    const resolved = registry.resolve("quick");

    assertEquals(resolved.name, "quick");
    assertEquals(resolved.model, reviewerProfile.model); // inherited
    assertEquals(resolved.tools, reviewerProfile.tools); // inherited
    assertEquals(resolved.temperature, 0.5); // overridden by quick
    assertEquals(resolved.maxIterations, 3); // overridden by quick
    assertEquals(resolved.streaming, true); // quick-only
  });

  await t.step("spawns with reviewer profile", async () => {
    const deps = createDeps();
    const registry = registerBuiltinProfiles();
    const provider = new MockModelProvider("mock", {
      responses: [{ content: "LGTM", tool_calls: [], finish_reason: "stop" }],
    });
    deps.modelManager.register(provider);

    const config = createSpawnConfig(registry)
      .fromProfile("reviewer")
      .build();

    const result = await spawn(deps, config, "Review this code");

    assertEquals(result, "LGTM");
    assertEquals(provider.requests[0].temperature, 0.3);
  });

  await t.step("spawns with quick profile", async () => {
    const deps = createDeps();
    const registry = registerBuiltinProfiles();
    const provider = new MockModelProvider("mock-default", {
      streamDeltas: [
        { content: "done", finish_reason: "stop" },
      ],
    });
    deps.modelManager.register(provider);

    const config = createSpawnConfig(registry)
      .fromProfile("quick")
      .build();

    const result = await spawn(deps, config, "Quick task");

    assertEquals(result, "done");
    // Temperature from quick (0.5), not reviewer (0.3)
    assertEquals(provider.requests[0].temperature, 0.5);
  });

  await t.step("orchestrator can select profile and override fields", async () => {
    const deps = createDeps();
    const registry = registerBuiltinProfiles();
    const provider = new MockModelProvider("mock", {
      responses: [{ content: "reviewed", tool_calls: [], finish_reason: "stop" }],
    });
    deps.modelManager.register(provider);

    const config = createSpawnConfig(registry)
      .fromProfile("reviewer")
      .withModel("custom-model")
      .withContext("Focus on security")
      .build();

    const result = await spawn(deps, config, "Security review");

    assertEquals(result, "reviewed");
    assertEquals(provider.requests[0].model, "custom-model");
  });
});
