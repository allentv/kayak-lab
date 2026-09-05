/**
 * MCP server implementation.
 *
 * Exposes harness capabilities (only exposable tools) to external MCP clients.
 * Handles incoming MCP requests for tool discovery and invocation.
 */

import { EventEmitter } from "node:events";
import type {
  IMCPServer,
  MCPServerConfig,
  MCPServerEvents,
  MCPServerState,
  MCPToolCallParams,
  MCPToolCallResult,
  MCPToolDefinition,
} from "./types.ts";

// ============================================================================
// MCP Server Implementation
// ============================================================================

/**
 * MCP server that exposes harness tools to external clients.
 * Only tools marked as exposable are available for discovery and invocation.
 */
export class MCPServer extends EventEmitter implements IMCPServer {
  readonly config: MCPServerConfig;
  private _state: MCPServerState = "stopped";
  private _exposedTools: MCPToolDefinition[] = [];

  get state(): MCPServerState {
    return this._state;
  }

  constructor(config: MCPServerConfig) {
    super();
    this.config = config;
    this.refreshExposedTools();
  }

  /** Refresh the list of exposed tools from the tool registry. */
  private refreshExposedTools(): void {
    const exposable = this.config.toolRegistry.getExposableTools();
    this._exposedTools = exposable.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.parameters,
    }));
  }

  async start(): Promise<void> {
    if (this._state === "running") return;
    this._state = "starting";

    try {
      this.refreshExposedTools();
      this._state = "running";
      this.emit("started", this.config.transport.type);
    } catch (err) {
      this._state = "error";
      this.emit("error", err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  async stop(): Promise<void> {
    if (this._state === "stopped") return;
    this._state = "stopped";
    this._exposedTools = [];
    this.emit("stopped");
  }

  listTools(): MCPToolDefinition[] {
    return [...this._exposedTools];
  }

  getTool(name: string): MCPToolDefinition | undefined {
    return this._exposedTools.find((t) => t.name === name);
  }

  async handleToolCall(params: MCPToolCallParams): Promise<MCPToolCallResult> {

    // Check tool exists and is exposed
    const tool = this._exposedTools.find((t) => t.name === params.name);
    if (!tool) {
      this.emit("toolResult", params.name, false);
      return {
        content: [{ type: "text", text: `Tool not found: ${params.name}` }],
        isError: true,
      };
    }

    this.emit("toolInvoked", params.name, params.arguments ?? {});

    try {
      const result = await this.config.toolRegistry.invokeTool(
        params.name,
        params.arguments ?? {},
      );

      this.emit("toolResult", params.name, result.success);

      return {
        content: [{ type: "text", text: result.output }],
        isError: !result.success,
      };
    } catch (err) {
      this.emit("toolResult", params.name, false);
      return {
        content: [{
          type: "text",
          text: `Tool invocation error: ${err instanceof Error ? err.message : String(err)}`,
        }],
        isError: true,
      };
    }
  }

  override on<K extends keyof MCPServerEvents>(event: K, listener: MCPServerEvents[K]): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  override off<K extends keyof MCPServerEvents>(event: K, listener: MCPServerEvents[K]): this {
    return super.off(event, listener as (...args: unknown[]) => void);
  }
}
