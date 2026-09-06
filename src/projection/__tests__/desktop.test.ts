/**
 * Unit tests for Desktop projection.
 */

import { assertEquals } from "@std/assert";
import { BaseEvent, EventTypes } from "../../types/events.ts";
import {
  DesktopProjection,
  DesktopNotificationFormatter,
} from "../desktop.ts";

// ============================================================================
// Mock Implementations
// ============================================================================

class MockSystemTray {
  icon?: string;
  tooltip?: string;
  menuItems: Array<{ id: string; label: string; action?: () => void }> = [];
  visible = false;

  setIcon(path: string): void { this.icon = path; }
  setTooltip(text: string): void { this.tooltip = text; }
  show(): void { this.visible = true; }
  hide(): void { this.visible = false; }
  setContextMenu(items: Array<{ id: string; label: string; action?: () => void }>): void {
    this.menuItems = items;
  }
  dispose(): void {}
}

class MockNotificationService {
  notifications: Array<{ title: string; body: string }> = [];

  show(notification: { title: string; body: string }): void {
    this.notifications.push(notification);
  }

  async requestPermission(): Promise<boolean> {
    return true;
  }

  isSupported(): boolean {
    return true;
  }
}

class MockKeyboardShortcutService {
  registered: Array<{ id: string; key: string; modifiers: string[]; action: () => void }> = [];

  register(shortcut: { id: string; key: string; modifiers: string[]; action: () => void }): void {
    this.registered.push(shortcut);
  }

  unregister(id: string): void {
    this.registered = this.registered.filter((s) => s.id !== id);
  }

  unregisterAll(): void {
    this.registered = [];
  }
}

// ============================================================================
// Test Helpers
// ============================================================================

function createTestEvent(
  type: string = EventTypes.SESSION_CREATED,
  sessionId = "test-session",
): BaseEvent {
  return {
    event_id: crypto.randomUUID(),
    session_id: sessionId,
    sequence_number: 1,
    event_type: type as BaseEvent["event_type"],
    timestamp: new Date().toISOString(),
    schema_version: 1,
    payload: { message: "test" },
    metadata: { source: "test" },
  };
}

// ============================================================================
// DesktopProjection Tests
// ============================================================================

Deno.test("DesktopProjection - setupTray sets up tray", () => {
  const tray = new MockSystemTray();
  const notificationService = new MockNotificationService();
  const shortcutService = new MockKeyboardShortcutService();

  const projection = new DesktopProjection(
    tray as unknown as import("../desktop.ts").ISystemTray,
    notificationService as unknown as import("../desktop.ts").INotificationService,
    shortcutService as unknown as import("../desktop.ts").IKeyboardShortcutService,
  );

  const openFn = () => {};
  const newSessionFn = () => {};
  const quitFn = () => {};

  projection.setupTray({ open: openFn, newSession: newSessionFn, quit: quitFn });

  assertEquals(tray.visible, true);
  assertEquals(tray.tooltip, "Kayak Lab Agent");
  assertEquals(tray.menuItems.length, 3);
  assertEquals(tray.menuItems[0].label, "Open");
  assertEquals(tray.menuItems[1].label, "New Session");
  assertEquals(tray.menuItems[2].label, "Quit");
});

Deno.test("DesktopProjection - showNotification sends notification", () => {
  const tray = new MockSystemTray();
  const notificationService = new MockNotificationService();
  const shortcutService = new MockKeyboardShortcutService();

  const projection = new DesktopProjection(
    tray as unknown as import("../desktop.ts").ISystemTray,
    notificationService as unknown as import("../desktop.ts").INotificationService,
    shortcutService as unknown as import("../desktop.ts").IKeyboardShortcutService,
  );

  const event = createTestEvent(EventTypes.SESSION_COMPLETED);
  projection.showNotification(event);

  assertEquals(notificationService.notifications.length, 1);
  assertEquals(notificationService.notifications[0].title, "Session Completed");
});

Deno.test("DesktopProjection - registerShortcuts registers shortcuts", () => {
  const tray = new MockSystemTray();
  const notificationService = new MockNotificationService();
  const shortcutService = new MockKeyboardShortcutService();

  const projection = new DesktopProjection(
    tray as unknown as import("../desktop.ts").ISystemTray,
    notificationService as unknown as import("../desktop.ts").INotificationService,
    shortcutService as unknown as import("../desktop.ts").IKeyboardShortcutService,
  );

  const newSessionFn = () => {};
  const quickInputFn = () => {};

  projection.registerShortcuts({ newSession: newSessionFn, quickInput: quickInputFn });

  assertEquals(shortcutService.registered.length, 2);
  assertEquals(shortcutService.registered[0].id, "new-session");
  assertEquals(shortcutService.registered[1].id, "quick-input");
});

Deno.test("DesktopProjection - setState updates tray tooltip", () => {
  const tray = new MockSystemTray();
  const notificationService = new MockNotificationService();
  const shortcutService = new MockKeyboardShortcutService();

  const projection = new DesktopProjection(
    tray as unknown as import("../desktop.ts").ISystemTray,
    notificationService as unknown as import("../desktop.ts").INotificationService,
    shortcutService as unknown as import("../desktop.ts").IKeyboardShortcutService,
  );

  projection.setState("active", "Processing");
  assertEquals(tray.tooltip, "Kayak Lab Agent - Active (Processing)");

  projection.setState("idle");
  assertEquals(tray.tooltip, "Kayak Lab Agent - Idle");

  projection.setState("error", "Connection lost");
  assertEquals(tray.tooltip, "Kayak Lab Agent - Error: Connection lost");
});

// ============================================================================
// DesktopNotificationFormatter Tests
// ============================================================================

Deno.test("DesktopNotificationFormatter - format session completed", () => {
  const formatter = new DesktopNotificationFormatter();
  const event = createTestEvent(EventTypes.SESSION_COMPLETED);
  const notification = formatter.format(event);
  assertEquals(notification.title, "Session Completed");
  assertEquals(notification.body.includes("finished successfully"), true);
});

Deno.test("DesktopNotificationFormatter - format session failed", () => {
  const formatter = new DesktopNotificationFormatter();
  const event = createTestEvent(EventTypes.SESSION_FAILED);
  const notification = formatter.format(event);
  assertEquals(notification.title, "Session Failed");
});

Deno.test("DesktopNotificationFormatter - format tool execution completed", () => {
  const formatter = new DesktopNotificationFormatter();
  const event = createTestEvent(EventTypes.TOOL_EXECUTION_COMPLETED);
  event.payload = { tool_name: "read" };
  const notification = formatter.format(event);
  assertEquals(notification.title, "Tool Execution Complete");
  assertEquals(notification.body.includes("read"), true);
});