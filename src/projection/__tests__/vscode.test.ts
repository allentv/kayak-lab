/**
 * Unit tests for VS Code projection.
 */

import { assertEquals } from "@std/assert";
import { BaseEvent, EventTypes } from "../../types/events.ts";
import {
  VSCodeProjection,
  SessionTreeDataProvider,
  EventFormatter,
} from "../vscode.ts";

// ============================================================================
// Mock Implementations
// ============================================================================

class MockOutputChannel {
  lines: Array<{ text: string; color?: string }> = [];
  cleared = false;

  appendLine(text: string, color?: string): void {
    this.lines.push({ text, color });
  }

  clear(): void {
    this.cleared = true;
  }

  show(): void {}
  hide(): void {}
  dispose(): void {}
}

class MockStatusBarItem {
  text = "";
  tooltip?: string;
  color?: string;
  command?: string;
  shown = false;

  show(): void {
    this.shown = true;
  }
  hide(): void {}
  dispose(): void {}
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
// VSCodeProjection Tests
// ============================================================================

Deno.test("VSCodeProjection - renderEvent adds line to output channel", () => {
  const outputChannel = new MockOutputChannel();
  const statusBar = new MockStatusBarItem();
  const treeProvider = new SessionTreeDataProvider();

  const projection = new VSCodeProjection(
    treeProvider,
    outputChannel as unknown as import("../vscode.ts").IOutputChannel,
    statusBar as unknown as import("../vscode.ts").IStatusBarItem,
  );

  const event = createTestEvent();
  projection.renderEvent(event);

  assertEquals(outputChannel.lines.length, 1);
  assertEquals(outputChannel.lines[0].color, "#4EC9B0"); // Session created color
});

Deno.test("VSCodeProjection - renderEvent respects filters", () => {
  const outputChannel = new MockOutputChannel();
  const statusBar = new MockStatusBarItem();
  const treeProvider = new SessionTreeDataProvider();

  const projection = new VSCodeProjection(
    treeProvider,
    outputChannel as unknown as import("../vscode.ts").IOutputChannel,
    statusBar as unknown as import("../vscode.ts").IStatusBarItem,
  );

  // Set filter to only include tool events
  projection.setFilters(new Set(["tool.execution.started"]));

  const sessionEvent = createTestEvent(EventTypes.SESSION_CREATED);
  const toolEvent = createTestEvent(EventTypes.TOOL_EXECUTION_STARTED);

  projection.renderEvent(sessionEvent);
  projection.renderEvent(toolEvent);

  assertEquals(outputChannel.lines.length, 1); // Only tool event
});

Deno.test("VSCodeProjection - updateStatusBar shows correct state", () => {
  const outputChannel = new MockOutputChannel();
  const statusBar = new MockStatusBarItem();
  const treeProvider = new SessionTreeDataProvider();

  const projection = new VSCodeProjection(
    treeProvider,
    outputChannel as unknown as import("../vscode.ts").IOutputChannel,
    statusBar as unknown as import("../vscode.ts").IStatusBarItem,
  );

  projection.updateStatusBar("active", "Session 1");
  assertEquals(statusBar.shown, true);
  assertEquals(statusBar.text.includes("Session 1"), true);

  projection.updateStatusBar("idle");
  assertEquals(statusBar.text.includes("Idle"), true);

  projection.updateStatusBar("error");
  assertEquals(statusBar.color, "#F44747");
});

Deno.test("VSCodeProjection - clearOutput clears the channel", () => {
  const outputChannel = new MockOutputChannel();
  const statusBar = new MockStatusBarItem();
  const treeProvider = new SessionTreeDataProvider();

  const projection = new VSCodeProjection(
    treeProvider,
    outputChannel as unknown as import("../vscode.ts").IOutputChannel,
    statusBar as unknown as import("../vscode.ts").IStatusBarItem,
  );

  projection.renderEvent(createTestEvent());
  assertEquals(outputChannel.lines.length, 1);

  projection.clearOutput();
  assertEquals(outputChannel.cleared, true);
});

// ============================================================================
// SessionTreeDataProvider Tests
// ============================================================================

Deno.test("SessionTreeDataProvider - refresh updates tree items", () => {
  const provider = new SessionTreeDataProvider();

  const sessions = [
    { id: "s1", state: "active" as const, created_at: "2024-01-01", updated_at: "2024-01-01", description: "Test Session" },
    { id: "s2", state: "completed" as const, created_at: "2024-01-02", updated_at: "2024-01-02" },
  ];
  const eventCounts = new Map([["s1", 5], ["s2", 10]]);

  provider.refresh(sessions, eventCounts);

  const children = provider.getChildren();
  assertEquals(children.length, 2);
  assertEquals(children[0].label, "Test Session");
  assertEquals(children[0].eventCount, 5);
});

Deno.test("SessionTreeDataProvider - getTreeItem formats correctly", () => {
  const provider = new SessionTreeDataProvider();
  const item = {
    id: "s1",
    label: "Session 1",
    state: "active" as const,
    eventCount: 5,
    createdAt: "2024-01-01",
  };

  const treeItem = provider.getTreeItem(item);
  assertEquals(treeItem.id, "s1");
  assertEquals(treeItem.label, "Session 1");
  assertEquals(treeItem.description, "active — 5 events");
});

// ============================================================================
// EventFormatter Tests
// ============================================================================

Deno.test("EventFormatter - format event correctly", () => {
  const formatter = new EventFormatter();
  const event = createTestEvent();

  const formatted = formatter.format(event);
  assertEquals(formatted.includes("session.created"), true);
  assertEquals(formatted.includes("test"), true);
});

Deno.test("EventFormatter - getColor returns correct color", () => {
  const formatter = new EventFormatter();

  assertEquals(formatter.getColor(EventTypes.SESSION_CREATED), "#4EC9B0");
  assertEquals(formatter.getColor(EventTypes.SESSION_FAILED), "#F44747");
  assertEquals(formatter.getColor(EventTypes.TOOL_EXECUTION_COMPLETED), "#6A9955");
});