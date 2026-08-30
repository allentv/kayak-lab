import {
  assertEquals,
} from "@std/assert";
import { CapabilityRegistry } from "../capability.ts";
import { GitCapability } from "../git.ts";
import { ShellCapability } from "../shell.ts";
import type { CapabilityContext } from "../capability.ts";

Deno.test("CapabilityRegistry", async (t) => {
  const context: CapabilityContext = {
    session_id: "test-session",
    working_directory: "/tmp",
  };

  await t.step("registers capabilities", () => {
    const registry = new CapabilityRegistry();
    const git = new GitCapability();
    const shell = new ShellCapability();

    registry.register(git);
    registry.register(shell);

    assertEquals(registry.getAll().length, 2);
  });

  await t.step("gets capability by name", () => {
    const registry = new CapabilityRegistry();
    const git = new GitCapability();

    registry.register(git);
    const retrieved = registry.get("git");
    assertEquals(retrieved?.definition.name, "git");
  });

  await t.step("returns undefined for unknown capability", () => {
    const registry = new CapabilityRegistry();
    const retrieved = registry.get("unknown");
    assertEquals(retrieved, undefined);
  });

  await t.step("unregisters capability", () => {
    const registry = new CapabilityRegistry();
    const git = new GitCapability();

    registry.register(git);
    assertEquals(registry.getAll().length, 1);

    registry.unregister("git");
    assertEquals(registry.getAll().length, 0);
  });

  await t.step("initializes all capabilities", async () => {
    const registry = new CapabilityRegistry();
    const git = new GitCapability();
    const shell = new ShellCapability();

    registry.register(git);
    registry.register(shell);

    await registry.initializeAll(context);

    assertEquals(registry.isInitialized("git"), true);
    assertEquals(registry.isInitialized("shell"), true);
  });

  await t.step("disposes all capabilities", async () => {
    const registry = new CapabilityRegistry();
    const git = new GitCapability();
    const shell = new ShellCapability();

    registry.register(git);
    registry.register(shell);

    await registry.initializeAll(context);
    assertEquals(registry.isInitialized("git"), true);

    await registry.disposeAll();
    assertEquals(registry.isInitialized("git"), false);
    assertEquals(registry.isInitialized("shell"), false);
  });

  await t.step("tracks initialization state", async () => {
    const registry = new CapabilityRegistry();
    const git = new GitCapability();

    registry.register(git);

    assertEquals(registry.isInitialized("git"), false);

    await registry.initializeAll(context);
    assertEquals(registry.isInitialized("git"), true);

    await registry.disposeAll();
    assertEquals(registry.isInitialized("git"), false);
  });
});
