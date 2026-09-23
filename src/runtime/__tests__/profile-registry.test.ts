import {
  assertEquals,
  assertThrows,
} from "@std/assert";
import { ProfileRegistry, ProfileNotFoundError, ProfileCycleError } from "../profile-registry.ts";
import type { AgentProfile } from "../types.ts";

Deno.test("ProfileRegistry", async (t) => {
  await t.step("registers and retrieves a profile", () => {
    const registry = new ProfileRegistry();
    const profile: AgentProfile = {
      name: "reviewer",
      model: "gpt-4",
      tools: ["read", "grep"],
    };
    registry.register(profile);

    const got = registry.get("reviewer");
    assertEquals(got?.name, "reviewer");
    assertEquals(got?.model, "gpt-4");
    assertEquals(got?.tools, ["read", "grep"]);
  });

  await t.step("unregisters a profile", () => {
    const registry = new ProfileRegistry();
    registry.register({ name: "test" });

    assertEquals(registry.unregister("test"), true);
    assertEquals(registry.get("test"), undefined);
    assertEquals(registry.unregister("test"), false);
  });

  await t.step("lists all profiles", () => {
    const registry = new ProfileRegistry();
    registry.register({ name: "a" });
    registry.register({ name: "b" });
    registry.register({ name: "c" });

    const list = registry.list();
    assertEquals(list.length, 3);
    assertEquals(list.map((p) => p.name).sort(), ["a", "b", "c"]);
  });

  await t.step("returns undefined for unknown profile", () => {
    const registry = new ProfileRegistry();
    assertEquals(registry.get("nonexistent"), undefined);
  });

  await t.step("overwrites existing profile on re-register", () => {
    const registry = new ProfileRegistry();
    registry.register({ name: "test", model: "v1" });
    registry.register({ name: "test", model: "v2" });

    assertEquals(registry.get("test")?.model, "v2");
  });

  await t.step("resolves profile with inheritance", () => {
    const registry = new ProfileRegistry();
    registry.register({
      name: "base",
      model: "gpt-4",
      temperature: 0.7,
      tools: ["read"],
    });
    registry.register({
      name: "child",
      extends: "base",
      model: "claude-sonnet",
      maxTokens: 2048,
    });

    const resolved = registry.resolve("child");
    assertEquals(resolved.name, "child");
    assertEquals(resolved.model, "claude-sonnet"); // child overrides
    assertEquals(resolved.temperature, 0.7); // inherited from base
    assertEquals(resolved.tools, ["read"]); // inherited from base
    assertEquals(resolved.maxTokens, 2048); // child-only field
  });

  await t.step("resolves multi-level inheritance", () => {
    const registry = new ProfileRegistry();
    registry.register({ name: "root", model: "gpt-4", temperature: 0.5 });
    registry.register({ name: "mid", extends: "root", tools: ["read"] });
    registry.register({ name: "leaf", extends: "mid", model: "claude" });

    const resolved = registry.resolve("leaf");
    assertEquals(resolved.model, "claude"); // leaf overrides
    assertEquals(resolved.temperature, 0.5); // from root
    assertEquals(resolved.tools, ["read"]); // from mid
  });

  await t.step("throws on circular inheritance", () => {
    const registry = new ProfileRegistry();
    registry.register({ name: "a", extends: "b" });
    registry.register({ name: "b", extends: "a" });

    assertThrows(
      () => registry.resolve("a"),
      ProfileCycleError,
    );
  });

  await t.step("throws on self-referencing profile", () => {
    const registry = new ProfileRegistry();
    registry.register({ name: "self", extends: "self" });

    assertThrows(
      () => registry.resolve("self"),
      ProfileCycleError,
    );
  });

  await t.step("throws ProfileNotFoundError for missing profile", () => {
    const registry = new ProfileRegistry();
    assertThrows(
      () => registry.resolve("nonexistent"),
      ProfileNotFoundError,
    );
  });

  await t.step("resolve returns copy, not original", () => {
    const registry = new ProfileRegistry();
    registry.register({ name: "test", model: "gpt-4" });

    const resolved = registry.resolve("test");
    resolved.model = "modified";

    assertEquals(registry.get("test")?.model, "gpt-4");
  });
});
