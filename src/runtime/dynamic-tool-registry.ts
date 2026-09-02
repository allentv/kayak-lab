/**
 * Dynamic tool registry for pattern-driven tool management.
 *
 * Enables, disables, or updates tools based on pattern analysis.
 * Records state changes as events in the event stream.
 */

import { IEventStream } from "../core/event-stream.ts";
import { ToolRegistry } from "./tool-registry.ts";
import { AnalysisReport, ToolTrend, ErrorCluster } from "./pattern-analyzer.ts";

// ============================================================================
// Dynamic Registry Types
// ============================================================================

/** Tool state in the dynamic registry. */
export interface ToolState {
  name: string;
  enabled: boolean;
  reason: string;
  lastChanged: string;
  critical: boolean;
}

/** Tool action triggered by a pattern. */
export interface ToolAction {
  toolName: string;
  action: "enable" | "disable" | "update";
  reason: string;
  patternId: string;
}

/** Pattern-to-action mapping rule. */
export interface PatternMapping {
  patternType: string;
  action: "enable" | "disable" | "update";
  condition: (pattern: ToolTrend | ErrorCluster) => boolean;
}

/** Tool lifecycle hooks. */
export interface ToolLifecycleHooks {
  onEnable?: (toolName: string, reason: string) => void | Promise<void>;
  onDisable?: (toolName: string, reason: string) => void | Promise<void>;
  onUpdate?: (toolName: string, changes: Record<string, unknown>) => void | Promise<void>;
}

// ============================================================================
// Dynamic Tool Registry Interface
// ============================================================================

export interface IDynamicToolRegistry {
  evaluatePatterns(report: AnalysisReport): Promise<ToolAction[]>;
  enableTool(name: string, reason: string): Promise<void>;
  disableTool(name: string, reason: string): Promise<void>;
  updateTool(name: string, changes: Record<string, unknown>): Promise<void>;
  getToolState(name: string): ToolState | undefined;
  getAllToolStates(): ToolState[];
}

// ============================================================================
// Dynamic Tool Registry Implementation
// ============================================================================

export class DynamicToolRegistry implements IDynamicToolRegistry {
  private toolStates: Map<string, ToolState> = new Map();
  private hooks: ToolLifecycleHooks;

  private static readonly DEFAULT_MAPPINGS: PatternMapping[] = [
    {
      patternType: "repeated_failure",
      action: "disable",
      condition: (p) => "count" in p && (p as ErrorCluster).count >= 3,
    },
    {
      patternType: "low_success_rate",
      action: "update",
      condition: (p) => "currentSuccessRate" in p && (p as ToolTrend).currentSuccessRate < 0.5,
    },
    {
      patternType: "improving",
      action: "enable",
      condition: (p) => "direction" in p && (p as ToolTrend).direction === "improving",
    },
  ];

  constructor(
    private readonly eventStream: IEventStream,
    _toolRegistry: ToolRegistry,
    hooks: ToolLifecycleHooks = {},
  ) {
    this.hooks = hooks;
  }

  async evaluatePatterns(report: AnalysisReport): Promise<ToolAction[]> {
    const actions: ToolAction[] = [];

    // Evaluate tool trends
    for (const trend of report.toolTrends) {
      for (const mapping of DynamicToolRegistry.DEFAULT_MAPPINGS) {
        if (mapping.condition(trend)) {
          actions.push({
            toolName: trend.toolName,
            action: mapping.action,
            reason: `Pattern: ${trend.direction} trend (${(trend.currentSuccessRate * 100).toFixed(0)}% success rate)`,
            patternId: `trend_${trend.toolName}_${trend.direction}`,
          });
        }
      }
    }

    // Evaluate error clusters
    for (const cluster of report.errorClusters) {
      if (cluster.count >= 3) {
        actions.push({
          toolName: cluster.toolName,
          action: "disable",
          reason: `Pattern: ${cluster.count} errors (${(cluster.percentage * 100).toFixed(0)}% of total)`,
          patternId: `error_${cluster.toolName}_${cluster.errorPattern}`,
        });
      }
    }

    // Execute actions
    for (const action of actions) {
      await this.executeAction(action);
    }

    return actions;
  }

  async enableTool(name: string, reason: string): Promise<void> {
    const state: ToolState = {
      name,
      enabled: true,
      reason,
      lastChanged: new Date().toISOString(),
      critical: false,
    };

    this.toolStates.set(name, state);

    // Record event
    this.eventStream.append({
      session_id: "dynamic-registry",
      sequence_number: this.eventStream.getCurrentSequence("dynamic-registry") + 1,
      event_type: "agent.self_observed" as const,
      payload: {
        observation_type: "tool.enabled",
        data: { toolName: name, reason },
        source_session_id: "dynamic-registry",
      },
      metadata: { source: "dynamic-tool-registry" },
    });

    // Fire hook
    await this.hooks.onEnable?.(name, reason);
  }

  async disableTool(name: string, reason: string): Promise<void> {
    // Check if tool is critical
    const existingState = this.toolStates.get(name);
    if (existingState?.critical) {
      return; // Don't disable critical tools
    }

    const state: ToolState = {
      name,
      enabled: false,
      reason,
      lastChanged: new Date().toISOString(),
      critical: false,
    };

    this.toolStates.set(name, state);

    // Record event
    this.eventStream.append({
      session_id: "dynamic-registry",
      sequence_number: this.eventStream.getCurrentSequence("dynamic-registry") + 1,
      event_type: "agent.self_observed" as const,
      payload: {
        observation_type: "tool.disabled",
        data: { toolName: name, reason },
        source_session_id: "dynamic-registry",
      },
      metadata: { source: "dynamic-tool-registry" },
    });

    // Fire hook
    await this.hooks.onDisable?.(name, reason);
  }

  async updateTool(name: string, changes: Record<string, unknown>): Promise<void> {
    // Record event
    this.eventStream.append({
      session_id: "dynamic-registry",
      sequence_number: this.eventStream.getCurrentSequence("dynamic-registry") + 1,
      event_type: "agent.self_observed" as const,
      payload: {
        observation_type: "tool.updated",
        data: { toolName: name, changes },
        source_session_id: "dynamic-registry",
      },
      metadata: { source: "dynamic-tool-registry" },
    });

    // Fire hook
    await this.hooks.onUpdate?.(name, changes);
  }

  getToolState(name: string): ToolState | undefined {
    return this.toolStates.get(name);
  }

  getAllToolStates(): ToolState[] {
    return Array.from(this.toolStates.values());
  }

  private async executeAction(action: ToolAction): Promise<void> {
    switch (action.action) {
      case "enable":
        await this.enableTool(action.toolName, action.reason);
        break;
      case "disable":
        await this.disableTool(action.toolName, action.reason);
        break;
      case "update":
        await this.updateTool(action.toolName, { reason: action.reason });
        break;
    }
  }
}
