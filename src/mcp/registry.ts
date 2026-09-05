/**
 * MCP tool registry implementation.
 *
 * Central registry for managing tools discovered from external MCP servers.
 * Tools can be registered, unregistered, enabled, and disabled.
 */

import { EventEmitter } from "node:events";
import type {
  IMCPRegistry,
  MCPRegistryEvents,
  MCPToolRegistration,
} from "./types.ts";
// Types re-exported via MCPToolRegistration

// ============================================================================
// MCP Registry Implementation
// ============================================================================

/**
 * Central registry for MCP tool discovery and management.
 * Stores tools from external MCP servers with state management.
 */
export class MCPRegistry extends EventEmitter implements IMCPRegistry {
  private _tools = new Map<string, MCPToolRegistration>();

  register(registration: MCPToolRegistration): void {
    const key = this.toolKey(registration.tool.name, registration.serverName);
    const existing = this._tools.get(key);

    if (existing) {
      // Update existing registration
      existing.tool = registration.tool;
      existing.capabilities = registration.capabilities;
      existing.category = registration.category;
    } else {
      this._tools.set(key, {
        ...registration,
        enabled: registration.enabled,
        registeredAt: Date.now(),
      });
      this.emit("toolRegistered", registration.tool.name, registration.serverName);
    }
  }

  unregister(toolName: string, serverName: string): void {
    const key = this.toolKey(toolName, serverName);
    if (this._tools.delete(key)) {
      this.emit("toolUnregistered", toolName, serverName);
    }
  }

  list(): MCPToolRegistration[] {
    return Array.from(this._tools.values()).filter((r) => r.enabled);
  }

  get(toolName: string): MCPToolRegistration | undefined {
    // Search across all servers
    for (const registration of this._tools.values()) {
      if (registration.tool.name === toolName && registration.enabled) {
        return registration;
      }
    }
    return undefined;
  }

  enable(toolName: string, serverName: string): void {
    const key = this.toolKey(toolName, serverName);
    const registration = this._tools.get(key);
    if (registration && !registration.enabled) {
      registration.enabled = true;
      this.emit("toolStateChanged", toolName, false, true);
    }
  }

  disable(toolName: string, serverName: string): void {
    const key = this.toolKey(toolName, serverName);
    const registration = this._tools.get(key);
    if (registration && registration.enabled) {
      registration.enabled = false;
      this.emit("toolStateChanged", toolName, true, false);
    }
  }

  findByCapability(capabilityId: string): MCPToolRegistration[] {
    return this.list().filter((r) =>
      r.capabilities.some((c) => c.id === capabilityId)
    );
  }

  findByCategory(categoryId: string): MCPToolRegistration[] {
    return this.list().filter((r) => r.category?.id === categoryId);
  }

  private toolKey(toolName: string, serverName: string): string {
    return `${serverName}::${toolName}`;
  }

  override on<K extends keyof MCPRegistryEvents>(event: K, listener: MCPRegistryEvents[K]): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  override off<K extends keyof MCPRegistryEvents>(event: K, listener: MCPRegistryEvents[K]): this {
    return super.off(event, listener as (...args: unknown[]) => void);
  }
}
