/**
 * Session analysis engine.
 *
 * Queries SQLite for captured events and generates improvement insights.
 */

import { EventStore } from "./store/event-store.ts";
import { BaseEvent } from "./types/events.ts";

// ============================================================================
// Analysis Types
// ============================================================================

export interface SessionSummary {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  durationMs: number;
  eventCount: number;
  state: string;
}

export interface CommandStats {
  command: string;
  count: number;
  totalDurationMs: number;
  avgDurationMs: number;
  maxDurationMs: number;
  errorCount: number;
}

export interface AnalysisResult {
  sessions: SessionSummary[];
  totalEvents: number;
  totalDurationMs: number;
  commandStats: CommandStats[];
  errorEvents: BaseEvent[];
  suggestions: string[];
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyze multiple sessions and generate insights.
 */
export async function analyzeSessions(
  sessions: { id: string; state: string }[],
  eventStore: EventStore,
): Promise<AnalysisResult> {
  const sessionSummaries: SessionSummary[] = [];
  const allEvents: BaseEvent[] = [];
  const commandMap = new Map<string, {
    count: number;
    totalDurationMs: number;
    maxDurationMs: number;
    errorCount: number;
  }>();
  const errorEvents: BaseEvent[] = [];

  // Analyze each session
  for (const session of sessions) {
    const events = await eventStore.getEvents(session.id);
    allEvents.push(...events);

    // Find session start/end
    const createdEvent = events.find((e) => e.event_type === "session.created");
    const endEvent = events.find((e) =>
      e.event_type === "session.completed" ||
      e.event_type === "session.failed" ||
      e.event_type === "session.cancelled"
    );

    const startTime = createdEvent
      ? new Date(createdEvent.timestamp)
      : new Date(events[0]?.timestamp || Date.now());
    const endTime = endEvent ? new Date(endEvent.timestamp) : undefined;
    const durationMs = endTime
      ? endTime.getTime() - startTime.getTime()
      : Date.now() - startTime.getTime();

    sessionSummaries.push({
      sessionId: session.id,
      startTime,
      endTime,
      durationMs,
      eventCount: events.length,
      state: session.state,
    });

    // Analyze tool executions
    const toolEvents = events.filter((e) =>
      e.event_type === "tool.execution.started" ||
      e.event_type === "tool.execution.completed" ||
      e.event_type === "tool.execution.failed"
    );

    // Group by command
    for (let i = 0; i < toolEvents.length; i++) {
      const event = toolEvents[i];
      if (event.event_type === "tool.execution.started") {
        const payload = event.payload as { tool?: string; command?: string };
        const command = payload.command || payload.tool || "unknown";

        // Find corresponding completion event
        const completionEvent = toolEvents.slice(i + 1).find((e) =>
          e.event_type === "tool.execution.completed" ||
          e.event_type === "tool.execution.failed"
        );

        const durationMs = completionEvent
          ? new Date(completionEvent.timestamp).getTime() - new Date(event.timestamp).getTime()
          : 0;

        const isError = completionEvent?.event_type === "tool.execution.failed";

        const stats = commandMap.get(command) || {
          count: 0,
          totalDurationMs: 0,
          maxDurationMs: 0,
          errorCount: 0,
        };

        stats.count++;
        stats.totalDurationMs += durationMs;
        stats.maxDurationMs = Math.max(stats.maxDurationMs, durationMs);
        if (isError) stats.errorCount++;
        commandMap.set(command, stats);
      }
    }

    // Collect error events
    const errors = events.filter((e) =>
      e.event_type === "tool.execution.failed" ||
      e.event_type === "session.failed"
    );
    errorEvents.push(...errors);
  }

  // Calculate total duration
  const totalDurationMs = sessionSummaries.reduce(
    (sum, s) => sum + s.durationMs,
    0,
  );

  // Build command stats
  const commandStats: CommandStats[] = Array.from(commandMap.entries())
    .map(([command, stats]) => ({
      command,
      count: stats.count,
      totalDurationMs: stats.totalDurationMs,
      avgDurationMs: stats.count > 0 ? stats.totalDurationMs / stats.count : 0,
      maxDurationMs: stats.maxDurationMs,
      errorCount: stats.errorCount,
    }))
    .sort((a, b) => b.count - a.count);

  // Generate suggestions
  const suggestions = generateSuggestions(
    sessionSummaries,
    commandStats,
  );

  return {
    sessions: sessionSummaries,
    totalEvents: allEvents.length,
    totalDurationMs,
    commandStats,
    errorEvents,
    suggestions,
  };
}

/**
 * Generate improvement suggestions based on analysis.
 */
function generateSuggestions(
  sessions: SessionSummary[],
  commandStats: CommandStats[],
): string[] {
  const suggestions: string[] = [];

  // Check for repeated commands
  const repeatedCommands = commandStats.filter((s) => s.count >= 3);
  if (repeatedCommands.length > 0) {
    const topRepeated = repeatedCommands[0];
    suggestions.push(
      `Frequent command detected: "${topRepeated.command}" used ${topRepeated.count} times. Consider creating a script or alias.`,
    );
  }

  // Check for slow commands
  const slowCommands = commandStats.filter((s) => s.avgDurationMs > 5000);
  if (slowCommands.length > 0) {
    const slowest = slowCommands[0];
    suggestions.push(
      `Slow command detected: "${slowest.command}" averages ${(slowest.avgDurationMs / 1000).toFixed(1)}s. Consider optimizing or parallelizing.`,
    );
  }

  // Check for error patterns
  const errorCommands = commandStats.filter((s) => s.errorCount > 0);
  if (errorCommands.length > 0) {
    const errorProne = errorCommands[0];
    suggestions.push(
      `Error-prone command: "${errorProne.command}" failed ${errorProne.errorCount}/${errorProne.count} times. Review error handling.`,
    );
  }

  // Check for session duration
  const longSessions = sessions.filter((s) => s.durationMs > 3600000); // > 1 hour
  if (longSessions.length > 0) {
    suggestions.push(
      `Long session detected: ${longSessions.length} session(s) exceeded 1 hour. Consider breaking into smaller tasks.`,
    );
  }

  // Check for command diversity
  const uniqueCommands = new Set(commandStats.map((s) => s.command)).size;
  if (uniqueCommands < 5 && commandStats.length > 10) {
    suggestions.push(
      `Low command diversity: ${uniqueCommands} unique commands across ${commandStats.length} executions. Consider using more varied tools.`,
    );
  }

  // Add general suggestions if no specific issues found
  if (suggestions.length === 0) {
    suggestions.push("Session looks healthy. No obvious improvement areas detected.");
  }

  return suggestions;
}

/**
 * Format analysis report for terminal display.
 */
export function formatAnalysisReport(result: AnalysisResult): string {
  const lines: string[] = [];

  lines.push("\x1b[1m═══════════════════════════════════════════════════\x1b[0m");
  lines.push("\x1b[1m              KAYAK SESSION ANALYSIS              \x1b[0m");
  lines.push("\x1b[1m═══════════════════════════════════════════════════\x1b[0m\n");

  // Session summary
  lines.push("\x1b[1mSession Summary\x1b[0m");
  lines.push(`  Sessions: ${result.sessions.length}`);
  lines.push(`  Total Events: ${result.totalEvents}`);
  lines.push(`  Total Duration: ${(result.totalDurationMs / 1000).toFixed(1)}s\n`);

  // Per-session details
  if (result.sessions.length > 0) {
    lines.push("\x1b[1mSessions\x1b[0m");
    for (const session of result.sessions) {
      const duration = (session.durationMs / 1000).toFixed(1);
      const stateColor = session.state === "completed" ? "\x1b[32m" : "\x1b[33m";
      lines.push(
        `  ${stateColor}${session.state.padEnd(12)}\x1b[0m ${session.sessionId.substring(0, 8)}  ${duration}s  ${session.eventCount} events`,
      );
    }
    lines.push("");
  }

  // Command statistics
  if (result.commandStats.length > 0) {
    lines.push("\x1b[1mCommand Usage\x1b[0m");
    lines.push("  " + "-".repeat(60));
    lines.push(
      `  ${"Command".padEnd(30)} ${"Count".padStart(6)} ${"Avg".padStart(8)} ${"Max".padStart(8)} ${"Errors".padStart(7)}`,
    );
    lines.push("  " + "-".repeat(60));

    for (const stat of result.commandStats.slice(0, 15)) {
      const cmd = stat.command.length > 28
        ? stat.command.substring(0, 25) + "..."
        : stat.command;
      lines.push(
        `  ${cmd.padEnd(30)} ${String(stat.count).padStart(6)} ${formatDuration(stat.avgDurationMs).padStart(8)} ${formatDuration(stat.maxDurationMs).padStart(8)} ${String(stat.errorCount).padStart(7)}`,
      );
    }
    lines.push("");
  }

  // Error summary
  if (result.errorEvents.length > 0) {
    lines.push("\x1b[31mErrors\x1b[0m");
    for (const event of result.errorEvents.slice(0, 5)) {
      const payload = event.payload as { error?: string; command?: string };
      lines.push(`  ✗ ${payload.command || event.event_type}: ${payload.error || "unknown error"}`);
    }
    if (result.errorEvents.length > 5) {
      lines.push(`  ... and ${result.errorEvents.length - 5} more`);
    }
    lines.push("");
  }

  // Suggestions
  lines.push("\x1b[1mSuggestions\x1b[0m");
  for (const suggestion of result.suggestions) {
    lines.push(`  💡 ${suggestion}`);
  }
  lines.push("");

  lines.push("\x1b[1m═══════════════════════════════════════════════════\x1b[0m");

  return lines.join("\n");
}

// ============================================================================
// Helpers
// ============================================================================

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}
