/**
 * Tool self-improvement loop.
 *
 * Analyzes tool usage patterns to suggest and automatically create new tools,
 * improving the harness's capabilities over time.
 */

import type { IToolDefinition, ToolHandler } from "./types.ts";
import type { IToolRegistry } from "./registry.ts";
import type { ToolAuthoring } from "./authoring.ts";

// ============================================================================
// Configuration
// ============================================================================

/** Configuration for the self-improvement loop. */
export interface SelfImprovementConfig {
  /** Enable automatic tool creation based on usage patterns. */
  auto_create: boolean;
  /** Enable automatic tool improvement based on usage patterns. */
  auto_improve: boolean;
  /** Minimum number of invocations before analyzing patterns. */
  min_invocations: number;
}

const DEFAULT_CONFIG: SelfImprovementConfig = {
  auto_create: false,
  auto_improve: false,
  min_invocations: 10,
};

// ============================================================================
// Types
// ============================================================================

/** A suggestion for a new or improved tool. */
export interface ToolSuggestion {
  /** Suggested tool definition. */
  definition: IToolDefinition;
  /** Why this tool is suggested. */
  reason: string;
  /** Usage patterns that triggered the suggestion. */
  patterns: string[];
  /** Whether this is an improvement to an existing tool. */
  is_improvement: boolean;
  /** Name of the existing tool being improved (if applicable). */
  existing_tool?: string;
}

/** Tool usage record for analysis. */
export interface ToolUsageRecord {
  tool_name: string;
  parameters: Record<string, unknown>;
  success: boolean;
  duration_ms: number;
  timestamp: number;
}

// ============================================================================
// Events
// ============================================================================

/** Events emitted by the self-improvement system. */
export interface SelfImprovementEvents {
  onToolSuggested?: (suggestion: ToolSuggestion, timestamp: number) => void;
  onToolAutoCreated?: (toolName: string, timestamp: number) => void;
  onToolAutoImproved?: (toolName: string, timestamp: number) => void;
}

// ============================================================================
// Interface
// ============================================================================

/**
 * Interface for tool self-improvement operations.
 */
export interface IToolSelfImprovement {
  /** Record a tool usage event for analysis. */
  recordUsage(record: ToolUsageRecord): void;
  /** Analyze usage patterns and generate suggestions. */
  analyze(): ToolSuggestion[];
  /** Get current configuration. */
  getConfig(): SelfImprovementConfig;
  /** Update configuration. */
  setConfig(config: Partial<SelfImprovementConfig>): void;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Analyzes tool usage patterns to suggest and auto-create/improve tools.
 */
export class ToolSelfImprovement implements IToolSelfImprovement {
  private usageRecords: ToolUsageRecord[] = [];
  private registry: IToolRegistry;
  private authoring: ToolAuthoring;
  private events: SelfImprovementEvents;
  private config: SelfImprovementConfig;

  constructor(
    registry: IToolRegistry,
    authoring: ToolAuthoring,
    events?: SelfImprovementEvents,
    config?: Partial<SelfImprovementConfig>,
  ) {
    this.registry = registry;
    this.authoring = authoring;
    this.events = events ?? {};
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  recordUsage(record: ToolUsageRecord): void {
    this.usageRecords.push(record);
  }

  analyze(): ToolSuggestion[] {
    if (this.usageRecords.length < this.config.min_invocations) {
      return [];
    }

    const suggestions: ToolSuggestion[] = [];

    // Analyze failure patterns
    suggestions.push(...this.analyzeFailurePatterns());

    // Analyze slow tools
    suggestions.push(...this.analyzeSlowTools());

    // Analyze missing capabilities
    suggestions.push(...this.analyzeMissingCapabilities());

    // Auto-create or suggest
    for (const suggestion of suggestions) {
      const now = Date.now();
      this.events.onToolSuggested?.(suggestion, now);

      if (suggestion.is_improvement && this.config.auto_improve) {
        this.autoImprove(suggestion);
      } else if (!suggestion.is_improvement && this.config.auto_create) {
        this.autoCreate(suggestion);
      } else {
        // Present to user via authoring TUI
        this.authoring.propose(suggestion.definition, {
          current_task: "self-improvement analysis",
          gap_description: suggestion.reason,
          examples: suggestion.patterns,
        });
      }
    }

    return suggestions;
  }

  getConfig(): SelfImprovementConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<SelfImprovementConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private analyzeFailurePatterns(): ToolSuggestion[] {
    const suggestions: ToolSuggestion[] = [];
    const failuresByTool = new Map<string, number>();

    for (const record of this.usageRecords) {
      if (!record.success) {
        failuresByTool.set(
          record.tool_name,
          (failuresByTool.get(record.tool_name) ?? 0) + 1,
        );
      }
    }

    for (const [toolName, failureCount] of failuresByTool) {
      if (failureCount >= 3) {
        suggestions.push({
          definition: {
            name: `${toolName}-robust`,
            description: `Robust version of ${toolName} with better error handling`,
            parameters: { type: "object", properties: {} },
          },
          reason: `Tool '${toolName}' has failed ${failureCount} times`,
          patterns: [`${failureCount} failures for ${toolName}`],
          is_improvement: true,
          existing_tool: toolName,
        });
      }
    }

    return suggestions;
  }

  private analyzeSlowTools(): ToolSuggestion[] {
    const suggestions: ToolSuggestion[] = [];
    const avgDurationByTool = new Map<string, { total: number; count: number }>();

    for (const record of this.usageRecords) {
      const existing = avgDurationByTool.get(record.tool_name) ?? { total: 0, count: 0 };
      existing.total += record.duration_ms;
      existing.count += 1;
      avgDurationByTool.set(record.tool_name, existing);
    }

    for (const [toolName, stats] of avgDurationByTool) {
      const avgDuration = stats.total / stats.count;
      if (avgDuration > 5000 && stats.count >= 3) {
        suggestions.push({
          definition: {
            name: `${toolName}-fast`,
            description: `Optimized version of ${toolName}`,
            parameters: { type: "object", properties: {} },
          },
          reason: `Tool '${toolName}' averages ${Math.round(avgDuration)}ms per invocation`,
          patterns: [`Average duration: ${Math.round(avgDuration)}ms over ${stats.count} invocations`],
          is_improvement: true,
          existing_tool: toolName,
        });
      }
    }

    return suggestions;
  }

  private analyzeMissingCapabilities(): ToolSuggestion[] {
    // Look for repeated parameter patterns that suggest a missing tool
    const paramPatterns = new Map<string, number>();
    const suggestions: ToolSuggestion[] = [];

    for (const record of this.usageRecords) {
      if (!record.success) continue;
      const keys = Object.keys(record.parameters).sort().join(",");
      if (keys) {
        paramPatterns.set(keys, (paramPatterns.get(keys) ?? 0) + 1);
      }
    }

    for (const [pattern, count] of paramPatterns) {
      if (count >= 5) {
        suggestions.push({
          definition: {
            name: `auto-${pattern.replace(/,/g, "-")}`,
            description: `Auto-generated tool for common parameter pattern: ${pattern}`,
            parameters: { type: "object", properties: {} },
          },
          reason: `Parameter pattern '${pattern}' used ${count} times across different tools`,
          patterns: [`${count} invocations with pattern: ${pattern}`],
          is_improvement: false,
        });
      }
    }

    return suggestions;
  }

  private autoCreate(suggestion: ToolSuggestion): void {
    const now = Date.now();
    // Auto-creation registers a stub — real implementation would generate code
    const handler: ToolHandler = async () => ({
      tool_call_id: "auto",
      tool_name: suggestion.definition.name,
      exit_code: 0,
      stdout: "Auto-created stub",
      stderr: "",
      duration_ms: 0,
      success: true,
    });

    this.registry.register(suggestion.definition, handler);
    this.events.onToolAutoCreated?.(suggestion.definition.name, now);
  }

  private autoImprove(suggestion: ToolSuggestion): void {
    const now = Date.now();
    // Auto-improvement records the improvement — real implementation would modify existing tool
    this.events.onToolAutoImproved?.(suggestion.definition.name, now);
  }
}
