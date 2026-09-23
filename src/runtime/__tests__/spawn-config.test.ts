import {
  assertEquals,
} from "@std/assert";
import { ProfileRegistry } from "../profile-registry.ts";
import { createSpawnConfig } from "../spawn-config.ts";

function makeRegistry(): ProfileRegistry {
  const registry = new ProfileRegistry();
  registry.register({
    name: "reviewer",
    model: "gpt-4",
    tools: ["read", "grep", "glob"],
    context: "You are a code reviewer.",
    temperature: 0.3,
    maxIterations: 5,
  });
  registry.register({
    name: "quick",
    extends: "reviewer",
    model: "gpt-4o-mini",
    maxIterations: 3,
    streaming: true,
  });
  return registry;
}

Deno.test("SpawnConfigBuilder", async (t) => {
  await t.step("builds from profile with defaults", () => {
    const registry = makeRegistry();
    const config = createSpawnConfig(registry)
      .fromProfile("reviewer")
      .build();

    assertEquals(config.profile, "reviewer");
    assertEquals(config.model, "gpt-4");
    assertEquals(config.tools, ["read", "grep", "glob"]);
    assertEquals(config.context, "You are a code reviewer.");
    assertEquals(config.temperature, 0.3);
    assertEquals(config.maxIterations, 5);
  });

  await t.step("overrides profile fields", () => {
    const registry = makeRegistry();
    const config = createSpawnConfig(registry)
      .fromProfile("reviewer")
      .withModel("claude-sonnet")
      .withTemperature(0.7)
      .build();

    assertEquals(config.model, "claude-sonnet");
    assertEquals(config.temperature, 0.7);
    // Profile defaults preserved
    assertEquals(config.tools, ["read", "grep", "glob"]);
    assertEquals(config.maxIterations, 5);
  });

  await t.step("builds without profile (session defaults only)", () => {
    const registry = makeRegistry();
    const config = createSpawnConfig(registry)
      .withModel("gpt-4")
      .build();

    assertEquals(config.profile, undefined);
    assertEquals(config.model, "gpt-4");
    assertEquals(config.tools, undefined);
    assertEquals(config.temperature, undefined);
  });

  await t.step("overrides take precedence over profile", () => {
    const registry = makeRegistry();
    const config = createSpawnConfig(registry)
      .fromProfile("reviewer")
      .withTools(["read"])
      .withMaxIterations(10)
      .build();

    assertEquals(config.tools, ["read"]);
    assertEquals(config.maxIterations, 10);
  });

  await t.step("inherits from parent profile", () => {
    const registry = makeRegistry();
    const config = createSpawnConfig(registry)
      .fromProfile("quick")
      .build();

    // quick extends reviewer
    assertEquals(config.model, "gpt-4o-mini"); // quick overrides
    assertEquals(config.tools, ["read", "grep", "glob"]); // from reviewer
    assertEquals(config.temperature, 0.3); // from reviewer
    assertEquals(config.maxIterations, 3); // quick overrides
    assertEquals(config.streaming, true); // quick-only
  });

  await t.step("overrides record tracks explicit overrides", () => {
    const registry = makeRegistry();
    const config = createSpawnConfig(registry)
      .fromProfile("reviewer")
      .withModel("claude")
      .withContext("Focus on security")
      .build();

    assertEquals(config.overrides.model, "claude");
    assertEquals(config.overrides.context, "Focus on security");
    assertEquals(config.overrides.tools, undefined); // not overridden
  });

  await t.step("chained with* methods work correctly", () => {
    const registry = makeRegistry();
    const config = createSpawnConfig(registry)
      .fromProfile("reviewer")
      .withModel("test")
      .withThinking("high")
      .withTools(["a", "b"])
      .withContext("ctx")
      .withSystemPrompt("sys")
      .withMaxContextMessages(50)
      .withMaxTokens(1024)
      .withTemperature(0.9)
      .withStreaming(true)
      .withMaxIterations(7)
      .withToolTimeout(5000)
      .build();

    assertEquals(config.model, "test");
    assertEquals(config.thinkingLevel, "high");
    assertEquals(config.tools, ["a", "b"]);
    assertEquals(config.context, "ctx");
    assertEquals(config.systemPrompt, "sys");
    assertEquals(config.maxContextMessages, 50);
    assertEquals(config.maxTokens, 1024);
    assertEquals(config.temperature, 0.9);
    assertEquals(config.streaming, true);
    assertEquals(config.maxIterations, 7);
    assertEquals(config.toolTimeoutMs, 5000);
  });
});
