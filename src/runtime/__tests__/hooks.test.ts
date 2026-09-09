import { assertEquals, assertExists } from "@std/assert";
import { HookRegistry, HookPoint } from "../hooks.ts";

Deno.test("HookRegistry", async (t) => {
  await t.step("registers and retrieves hooks", () => {
    const registry = new HookRegistry();
    const fn = () => {};

    const id = registry.register(HookPoint.BeforeModelCall, fn);

    assertExists(id);
    assertEquals(registry.size, 1);

    const hooks = registry.getHooks(HookPoint.BeforeModelCall);
    assertEquals(hooks.length, 1);
    assertEquals(hooks[0].id, id);
  });

  await t.step("unregisters hooks", () => {
    const registry = new HookRegistry();
    const fn = () => {};

    const id = registry.register(HookPoint.BeforeModelCall, fn);
    assertEquals(registry.size, 1);

    const removed = registry.unregister(id);
    assertEquals(removed, true);
    assertEquals(registry.size, 0);

    const hooks = registry.getHooks(HookPoint.BeforeModelCall);
    assertEquals(hooks.length, 0);
  });

  await t.step("dispatches hooks in registration order", async () => {
    const registry = new HookRegistry();
    const order: number[] = [];

    registry.register(HookPoint.BeforeModelCall, () => { order.push(1); });
    registry.register(HookPoint.BeforeModelCall, () => { order.push(2); });
    registry.register(HookPoint.BeforeModelCall, () => { order.push(3); });

    await registry.dispatch(HookPoint.BeforeModelCall, {
      sessionId: "test",
      messages: [],
      model: "test",
      tools: [],
    });

    assertEquals(order, [1, 2, 3]);
  });

  await t.step("isolates hook errors", async () => {
    const registry = new HookRegistry();
    const callOrder: number[] = [];

    registry.register(HookPoint.BeforeModelCall, () => { callOrder.push(1); });
    registry.register(HookPoint.BeforeModelCall, () => {
      callOrder.push(2);
      throw new Error("Hook error");
    });
    registry.register(HookPoint.BeforeModelCall, () => { callOrder.push(3); });

    await registry.dispatch(HookPoint.BeforeModelCall, {
      sessionId: "test",
      messages: [],
      model: "test",
      tools: [],
    });

    // All hooks should be called despite the error
    assertEquals(callOrder, [1, 2, 3]);
  });

  await t.step("filters session-scoped hooks", () => {
    const registry = new HookRegistry();
    const fn = () => {};

    // Global hook
    registry.register(HookPoint.BeforeModelCall, fn);

    // Session-scoped hook
    registry.register(HookPoint.BeforeModelCall, fn, { sessionId: "session1" });

    // Get hooks for session1
    const session1Hooks = registry.getHooks(HookPoint.BeforeModelCall, "session1");
    assertEquals(session1Hooks.length, 2); // Both global and session-scoped

    // Get hooks for session2
    const session2Hooks = registry.getHooks(HookPoint.BeforeModelCall, "session2");
    assertEquals(session2Hooks.length, 1); // Only global
  });

  await t.step("clears all hooks", () => {
    const registry = new HookRegistry();
    const fn = () => {};

    registry.register(HookPoint.BeforeModelCall, fn);
    registry.register(HookPoint.AfterToolExecution, fn);
    assertEquals(registry.size, 2);

    registry.clear();
    assertEquals(registry.size, 0);
  });
});
