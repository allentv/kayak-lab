/**
 * MCP client implementation.
 *
 * Connects to external MCP servers, discovers tools, and invokes them.
 * Supports automatic reconnection and event emission for observability.
 */

import { EventEmitter } from "node:events";
import type {
  IMCPClient,
  MCPClientConfig,
  MCPClientEvents,
  MCPClientState,
  MCPToolCallParams,
  MCPToolCallResult,
  MCPToolDefinition,
  IMCPTransport,
} from "./types.ts";
import { MCPError, MCPErrorCodes, type MCPErrorCode } from "./types.ts";
import { createTransport } from "./transport.ts";

// ============================================================================
// MCP Client Implementation
// ============================================================================

/**
 * MCP client that connects to external MCP servers.
 * Manages connection lifecycle, tool discovery, and tool invocation.
 */
export class MCPClient extends EventEmitter implements IMCPClient {
  readonly config: MCPClientConfig;
  private _state: MCPClientState = "disconnected";
  private _transport: IMCPTransport;
  private _tools: MCPToolDefinition[] = [];
  private _reconnectAttempts = 0;
  private _reconnectTimer: number | null = null;

  get state(): MCPClientState {
    return this._state;
  }

  get tools(): MCPToolDefinition[] {
    return [...this._tools];
  }

  constructor(config: MCPClientConfig) {
    super();
    this.config = {
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelayMs: 1000,
      ...config,
    };
    this._transport = createTransport(config.transport);

    // Wire transport events to client events
    this._transport.on("stateChange", (state) => {
      if (state === "connected") {
        this.setState("connected");
      } else if (state === "error") {
        this.setState("error");
      }
    });

    this._transport.on("error", (error) => {
      this.emit("error", this.config.name, error);
    });
  }

  private setState(state: MCPClientState, error?: Error): void {
    if (this._state === state) return;
    const oldState = this._state;
    this._state = state;

    if (state === "connected" && oldState !== "connected") {
      this._reconnectAttempts = 0;
      this.emit("connected", this.config.name);
    } else if (state === "disconnected" && oldState === "connected") {
      this.emit("disconnected", this.config.name);
      if (this.config.autoReconnect) {
        this.scheduleReconnect();
      }
    } else if (state === "error") {
      this.emit("error", this.config.name, error ?? new MCPError(
        "Connection error",
        MCPErrorCodes.CONNECTION_ERROR,
      ));
      if (this.config.autoReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    if (this._reconnectTimer !== null) return;
    if (this._reconnectAttempts >= (this.config.maxReconnectAttempts ?? 5)) {
      return;
    }

    const delay = (this.config.reconnectDelayMs ?? 1000) * Math.pow(2, this._reconnectAttempts);
    this._reconnectAttempts++;

    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer = null;
      try {
        await this.connect();
      } catch {
        // Connection failed, will retry if autoReconnect is enabled
      }
    }, delay) as unknown as number;
  }

  async connect(): Promise<void> {
    if (this._state === "connected") return;
    this.setState("connecting");

    try {
      await this._transport.connect();

      // Initialize the MCP connection
      const response = await this._transport.send({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "kayak-lab", version: "1.0.0" },
        },
      });

      if (response.error) {
        throw new MCPError(
          response.error.message,
          response.error.code as MCPErrorCode,
          response.error.data,
        );
      }

      // Send initialized notification
      await this._transport.notify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      });

      this.setState("connected");
    } catch (err) {
      const mcpErr = err instanceof MCPError
        ? err
        : new MCPError(
          `Failed to connect: ${err instanceof Error ? err.message : String(err)}`,
          MCPErrorCodes.CONNECTION_ERROR,
        );
      this.setState("error", mcpErr);
      throw mcpErr;
    }
  }

  async disconnect(): Promise<void> {
    if (this._reconnectTimer !== null) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }

    this._reconnectAttempts = 0;
    await this._transport.disconnect();
    this._tools = [];
    this.setState("disconnected");
  }

  async discover(): Promise<MCPToolDefinition[]> {
    if (this._state !== "connected") {
      throw new MCPError("Client not connected", MCPErrorCodes.CONNECTION_ERROR);
    }

    const response = await this._transport.send({
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method: "tools/list",
    });

    if (response.error) {
      throw new MCPError(
        response.error.message,
        response.error.code as MCPErrorCode,
        response.error.data,
      );
    }

    const result = response.result as { tools?: MCPToolDefinition[] };
    this._tools = result.tools ?? [];

    this.emit("toolsDiscovered", this.config.name, this._tools);
    return this._tools;
  }

  async invoke(params: MCPToolCallParams): Promise<MCPToolCallResult> {
    if (this._state !== "connected") {
      throw new MCPError("Client not connected", MCPErrorCodes.CONNECTION_ERROR);
    }

    const response = await this._transport.send({
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method: "tools/call",
      params: params as unknown as Record<string, unknown>,
    });

    if (response.error) {
      throw new MCPError(
        response.error.message,
        response.error.code as MCPErrorCode,
        response.error.data,
      );
    }

    return response.result as MCPToolCallResult;
  }

  override on<K extends keyof MCPClientEvents>(event: K, listener: MCPClientEvents[K]): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  override off<K extends keyof MCPClientEvents>(event: K, listener: MCPClientEvents[K]): this {
    return super.off(event, listener as (...args: unknown[]) => void);
  }
}
