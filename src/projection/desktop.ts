/**
 * Desktop application projection (Tauri).
 *
 * Provides native OS integration: system tray, notifications, and
 * global keyboard shortcuts. The projection logic is decoupled from
 * Tauri APIs for testability.
 */

import { BaseEvent } from "../types/events.ts";

// ============================================================================
// Desktop Projection Types
// ============================================================================

/** Notification type for native OS notifications. */
export interface DesktopNotification {
  title: string;
  body: string;
  icon?: string;
  action?: () => void;
}

/** System tray menu item. */
export interface TrayMenuItem {
  id: string;
  label: string;
  enabled?: boolean;
  action?: () => void;
}

/** Keyboard shortcut definition. */
export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: string[];
  action: () => void;
}

/** Desktop projection state. */
export type DesktopProjectionState = "active" | "idle" | "error";

// ============================================================================
// Desktop API Abstraction (for testability)
// ============================================================================

/** Abstracts native system tray API. */
export interface ISystemTray {
  /** Set the tray icon. */
  setIcon(path: string): void;
  /** Set the tray tooltip. */
  setTooltip(text: string): void;
  /** Show the tray icon. */
  show(): void;
  /** Hide the tray icon. */
  hide(): void;
  /** Set the context menu. */
  setContextMenu(items: TrayMenuItem[]): void;
  /** Dispose the tray. */
  dispose(): void;
}

/** Abstracts native notification API. */
export interface INotificationService {
  /** Show a notification. */
  show(notification: DesktopNotification): void;
  /** Request permission to show notifications. */
  requestPermission(): Promise<boolean>;
  /** Check if notifications are supported. */
  isSupported(): boolean;
}

/** Abstracts global keyboard shortcut API. */
export interface IKeyboardShortcutService {
  /** Register a global shortcut. */
  register(shortcut: KeyboardShortcut): void;
  /** Unregister a global shortcut. */
  unregister(id: string): void;
  /** Unregister all shortcuts. */
  unregisterAll(): void;
}

// ============================================================================
// Desktop Projection Interface
// ============================================================================

/**
 * Interface for desktop projection operations.
 */
export interface IDesktopProjection {
  /** Set up the system tray with quick actions. */
  setupTray(sessionActions: {
    open: () => void;
    newSession: () => void;
    quit: () => void;
  }): void;

  /** Show a native notification for an agent event. */
  showNotification(event: BaseEvent): void;

  /** Register global keyboard shortcuts. */
  registerShortcuts(actions: {
    newSession: () => void;
    quickInput: () => void;
  }): void;

  /** Update the desktop projection state. */
  setState(state: DesktopProjectionState, details?: string): void;

  /** Dispose all resources. */
  dispose(): void;
}

// ============================================================================
// Desktop Notification Formatter
// ============================================================================

/**
 * Formats events into native notifications.
 */
export class DesktopNotificationFormatter {
  format(event: BaseEvent): DesktopNotification {
    switch (event.event_type) {
      case "session.completed":
        return {
          title: "Session Completed",
          body: `Session ${event.session_id.slice(0, 8)} finished successfully`,
        };
      case "session.failed":
        return {
          title: "Session Failed",
          body: `Session ${event.session_id.slice(0, 8)} failed: ${JSON.stringify(event.payload)}`,
        };
      case "tool.execution.completed":
        return {
          title: "Tool Execution Complete",
          body: `Tool ${event.payload?.tool_name || "unknown"} completed`,
        };
      case "tool.execution.failed":
        return {
          title: "Tool Execution Failed",
          body: `Tool ${event.payload?.tool_name || "unknown"} failed: ${event.payload?.error || "unknown error"}`,
        };
      default:
        return {
          title: `Agent Event: ${event.event_type}`,
          body: JSON.stringify(event.payload),
        };
    }
  }
}

// ============================================================================
// Desktop Projection Implementation
// ============================================================================

/**
 * Desktop projection that provides native OS integration for agent interactions.
 */
export class DesktopProjection implements IDesktopProjection {
  private tray: ISystemTray | null;
  private notificationService: INotificationService | null;
  private shortcutService: IKeyboardShortcutService | null;
  private notificationFormatter: DesktopNotificationFormatter;
  constructor(
    tray: ISystemTray | null = null,
    notificationService: INotificationService | null = null,
    shortcutService: IKeyboardShortcutService | null = null,
  ) {
    this.tray = tray;
    this.notificationService = notificationService;
    this.shortcutService = shortcutService;
    this.notificationFormatter = new DesktopNotificationFormatter();
  }

  /** Set up the system tray with quick actions. */
  setupTray(sessionActions: {
    open: () => void;
    newSession: () => void;
    quit: () => void;
  }): void {
    if (!this.tray) return;

    this.tray.setTooltip("Kayak Lab Agent");
    this.tray.setContextMenu([
      { id: "open", label: "Open", action: sessionActions.open },
      { id: "new-session", label: "New Session", action: sessionActions.newSession },
      { id: "quit", label: "Quit", action: sessionActions.quit },
    ]);
    this.tray.show();
  }

  /** Show a native notification for an agent event. */
  showNotification(event: BaseEvent): void {
    if (!this.notificationService?.isSupported()) return;

    const notification = this.notificationFormatter.format(event);
    this.notificationService.show(notification);
  }

  /** Register global keyboard shortcuts. */
  registerShortcuts(actions: {
    newSession: () => void;
    quickInput: () => void;
  }): void {
    if (!this.shortcutService) return;

    // Register Ctrl+Shift+A (Cmd+Shift+A on macOS) for new session
    this.shortcutService.register({
      id: "new-session",
      key: "a",
      modifiers: ["ctrl", "shift"],
      action: actions.newSession,
    });

    // Register Ctrl+Shift+I (Cmd+Shift+I on macOS) for quick input
    this.shortcutService.register({
      id: "quick-input",
      key: "i",
      modifiers: ["ctrl", "shift"],
      action: actions.quickInput,
    });
  }

  /** Update the desktop projection state. */
  setState(state: DesktopProjectionState, details?: string): void {
    if (this.tray) {
      const tooltip = state === "active"
        ? `Kayak Lab Agent - Active${details ? ` (${details})` : ""}`
        : state === "error"
          ? `Kayak Lab Agent - Error${details ? `: ${details}` : ""}`
          : "Kayak Lab Agent - Idle";
      this.tray.setTooltip(tooltip);
    }
  }

  /** Dispose all resources. */
  dispose(): void {
    this.tray?.dispose();
    this.shortcutService?.unregisterAll();
  }
}

// ============================================================================
// Desktop Projection Factory
// ============================================================================

/**
 * Creates a fully wired desktop projection with tray, notifications, and shortcuts.
 */
export function createDesktopProjection(
  tray: ISystemTray | null,
  notificationService: INotificationService | null,
  shortcutService: IKeyboardShortcutService | null,
): DesktopProjection {
  return new DesktopProjection(tray, notificationService, shortcutService);
}