/**
 * MCP tool search implementation.
 *
 * Provides search functionality for MCP tools by name, capability, and category.
 * Returns results with tool details and server status information.
 */

import { EventEmitter } from "node:events";
import type {
  IMCPSearch,
  MCPSearchEvents,
  MCPSearchQuery,
  MCPSearchResult,
  MCPSearchResultItem,
  MCPClientState,
} from "./types.ts";
import type { IMCPRegistry } from "./types.ts";
import type { IMCPClient } from "./types.ts";

// ============================================================================
// MCP Search Implementation
// ============================================================================

/**
 * Search interface for MCP tools.
 * Searches across the MCP registry and provides server status.
 */
export class MCPSearch extends EventEmitter implements IMCPSearch {
  private _registry: IMCPRegistry;
  private _clients: Map<string, IMCPClient>;

  constructor(
    registry: IMCPRegistry,
    clients: Map<string, IMCPClient>,
  ) {
    super();
    this._registry = registry;
    this._clients = clients;
  }

  search(query: MCPSearchQuery): MCPSearchResult {
    this.emit("search", query);

    let tools = this._registry.list();

    // Filter by name (substring match)
    if (query.name) {
      const nameLower = query.name.toLowerCase();
      tools = tools.filter((t) =>
        t.tool.name.toLowerCase().includes(nameLower)
      );
    }

    // Filter by capability
    if (query.capability) {
      tools = tools.filter((t) =>
        t.capabilities.some((c) => c.id === query.capability)
      );
    }

    // Filter by category
    if (query.category) {
      tools = tools.filter((t) => t.category?.id === query.category);
    }

    // Build result items
    const items: MCPSearchResultItem[] = tools.map((t) => ({
      tool: t.tool,
      serverName: t.serverName,
      serverStatus: this.getClientState(t.serverName),
    }));

    // Build server status summary
    const serverStatus: Record<string, { status: MCPClientState; toolCount: number }> = {};
    for (const [name, client] of this._clients) {
      const toolCount = tools.filter((t) => t.serverName === name).length;
      serverStatus[name] = {
        status: client.state,
        toolCount,
      };
    }

    const result: MCPSearchResult = {
      items,
      count: items.length,
      serverStatus,
    };

    this.emit("searchResult", query, result.count);
    return result;
  }

  private getClientState(serverName: string): MCPClientState {
    const client = this._clients.get(serverName);
    return client?.state ?? "disconnected";
  }

  override on<K extends keyof MCPSearchEvents>(event: K, listener: MCPSearchEvents[K]): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  override off<K extends keyof MCPSearchEvents>(event: K, listener: MCPSearchEvents[K]): this {
    return super.off(event, listener as (...args: unknown[]) => void);
  }
}
