/**
 * Tool registry with lifecycle management.
 *
 * Central registry for tool discovery and management with enable/disable
 * state, capability/category discovery, and event emission.
 */

import type {
  IToolDefinition,
  ToolHandler,
  ToolHandlerContext,
  ToolRegistration,
  ToolResult,
} from "./types.ts";
import { ToolDefinition } from "./tool-definition.ts";
import { ToolCallingEngine } from "./calling-engine.ts";

// ============================================================================
// Errors
// ============================================================================

export class ToolRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolRegistryError";
  }
}

export class ToolNotRegisteredError extends ToolRegistryError {
  constructor(name: string) {
    super(`Tool not registered: ${name}`);
    this.name = "ToolNotRegisteredError";
  }
}

// ============================================================================
// Events
// ============================================================================

/** Events emitted by the tool registry. */
export interface ToolRegistryEvents {
  /** A tool was registered. */
  onToolRegistered?: (toolName: string, timestamp: number) => void;
  /** A tool was unregistered. */
  onToolUnregistered?: (toolName: string, timestamp: number) => void;
  /** A tool's enabled state changed. */
  onToolStateChanged?: (
    toolName: string,
    oldState: boolean,
    newState: boolean,
    timestamp: number,
  ) => void;
}

// ============================================================================
// Tool Registry Interface
// ============================================================================

/**
 * Interface for tool registry operations.
 */
export interface IToolRegistry {
  register(definition: IToolDefinition, handler: ToolHandler): void;
  unregister(name: string): boolean;
  list(): ToolRegistration[];
  get(name: string): ToolRegistration;
  has(name: string): boolean;
  enable(name: string): void;
  disable(name: string): void;
  isEnabled(name: string): boolean;
  findByCapability(capabilityId: string): ToolRegistration[];
  findByCategory(categoryId: string): ToolRegistration[];
  invoke(
    toolCallId: string,
    toolName: string,
    params: Record<string, unknown>,
    context: Omit<ToolHandlerContext, "tool_call_id" | "timeout_ms">,
  ): Promise<ToolResult>;
}

// ============================================================================
// Tool Registry Implementation
// ============================================================================

/**
 * Central registry for tool discovery and management.
 * Tools are registered with handlers and can be invoked through the registry.
 */
export class ToolRegistry implements IToolRegistry {
  private tools: Map<string, ToolRegistration> = new Map();
  private engine: ToolCallingEngine;
  private events: ToolRegistryEvents;

  constructor(events?: ToolRegistryEvents) {
    this.engine = new ToolCallingEngine();
    this.events = events ?? {};
  }

  register(definition: IToolDefinition, handler: ToolHandler): void {
    const validated = ToolDefinition.create(definition);

    const registration: ToolRegistration = {
      ...validated.toJSON(),
      handler,
      enabled: true,
      registered_at: Date.now(),
    };

    this.tools.set(validated.name, registration);
    this.events.onToolRegistered?.(validated.name, Date.now());
  }

  unregister(name: string): boolean {
    const removed = this.tools.delete(name);
    if (removed) {
      this.events.onToolUnregistered?.(name, Date.now());
    }
    return removed;
  }

  list(): ToolRegistration[] {
    return Array.from(this.tools.values());
  }

  get(name: string): ToolRegistration {
    const reg = this.tools.get(name);
    if (!reg) {
      throw new ToolNotRegisteredError(name);
    }
    return reg;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  enable(name: string): void {
    const reg = this.tools.get(name);
    if (!reg) {
      throw new ToolNotRegisteredError(name);
    }
    if (!reg.enabled) {
      reg.enabled = true;
      this.events.onToolStateChanged?.(name, false, true, Date.now());
    }
  }

  disable(name: string): void {
    const reg = this.tools.get(name);
    if (!reg) {
      throw new ToolNotRegisteredError(name);
    }
    if (reg.enabled) {
      reg.enabled = false;
      this.events.onToolStateChanged?.(name, true, false, Date.now());
    }
  }

  isEnabled(name: string): boolean {
    const reg = this.tools.get(name);
    return reg?.enabled ?? false;
  }

  findByCapability(capabilityId: string): ToolRegistration[] {
    return Array.from(this.tools.values()).filter(
      (reg) =>
        reg.enabled &&
        reg.capabilities?.some((cap) => cap.id === capabilityId),
    );
  }

  findByCategory(categoryId: string): ToolRegistration[] {
    return Array.from(this.tools.values()).filter(
      (reg) => reg.enabled && reg.category?.id === categoryId,
    );
  }

  async invoke(
    toolCallId: string,
    toolName: string,
    params: Record<string, unknown>,
    context: Omit<ToolHandlerContext, "tool_call_id" | "timeout_ms">,
  ): Promise<ToolResult> {
    const reg = this.tools.get(toolName);
    if (!reg) {
      return {
        tool_call_id: toolCallId,
        tool_name: toolName,
        exit_code: 1,
        stdout: "",
        stderr: `Tool not found: ${toolName}`,
        duration_ms: 0,
        success: false,
      };
    }

    if (!reg.enabled) {
      return {
        tool_call_id: toolCallId,
        tool_name: toolName,
        exit_code: 1,
        stdout: "",
        stderr: `Tool is disabled: ${toolName}`,
        duration_ms: 0,
        success: false,
      };
    }

    return this.engine.invoke(
      reg,
      reg.handler,
      params,
      { ...context, tool_call_id: toolCallId },
    );
  }
}
