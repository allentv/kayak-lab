/**
 * MCP transport implementations.
 *
 * Provides stdio, HTTP, and WebSocket transports for MCP communication.
 * Each transport implements IMCPTransport and handles low-level messaging.
 */

import { EventEmitter } from "node:events";
import type {
  IMCPTransport,
  MCPRequest,
  MCPNotification,
  MCPResponse,
  MCPTransportConfig,
  TransportEvents,
  TransportState,
} from "./types.ts";
import { MCPError, MCPErrorCodes } from "./types.ts";

// ============================================================================
// Base Transport
// ============================================================================

/**
 * Abstract base for MCP transports.
 * Handles event emission and pending request tracking.
 */
abstract class BaseTransport extends EventEmitter implements IMCPTransport {
  protected _state: TransportState = "disconnected";
  protected _pendingRequests = new Map<
    string | number,
    { resolve: (res: MCPResponse) => void; reject: (err: Error) => void; timer?: number }
  >();
  protected _timeoutMs = 30_000;

  get state(): TransportState {
    return this._state;
  }

  protected setState(state: TransportState): void {
    if (this._state !== state) {
      this._state = state;
      this.emit("stateChange", state);
    }
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  async send(request: MCPRequest): Promise<MCPResponse> {
    if (this._state !== "connected") {
      throw new MCPError("Transport not connected", MCPErrorCodes.CONNECTION_ERROR);
    }

    return new Promise<MCPResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this._pendingRequests.delete(request.id);
        reject(new MCPError(`Request timed out: ${request.method}`, MCPErrorCodes.TIMEOUT_ERROR));
      }, this._timeoutMs) as unknown as number;

      this._pendingRequests.set(request.id, { resolve, reject, timer });

      this.sendRaw(JSON.stringify(request)).catch((err) => {
        clearTimeout(timer);
        this._pendingRequests.delete(request.id);
        reject(err);
      });
    });
  }

  async notify(notification: MCPNotification): Promise<void> {
    if (this._state !== "connected") {
      throw new MCPError("Transport not connected", MCPErrorCodes.CONNECTION_ERROR);
    }
    await this.sendRaw(JSON.stringify(notification));
  }

  /** Send raw data over the transport. */
  protected abstract sendRaw(data: string): Promise<void>;

  /** Handle received raw data from the transport. */
  protected handleRawMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Response to a pending request
      if ("id" in message && message.id !== null && this._pendingRequests.has(message.id)) {
        const pending = this._pendingRequests.get(message.id)!;
        clearTimeout(pending.timer);
        this._pendingRequests.delete(message.id);

        if (message.error) {
          pending.reject(new MCPError(
            message.error.message,
            message.error.code ?? MCPErrorCodes.INTERNAL_ERROR,
            message.error.data,
          ));
        } else {
          pending.resolve(message);
        }
        return;
      }

      // Notification (no id)
      if (!("id" in message)) {
        this.emit("message", message as MCPNotification);
        return;
      }

      // Response without pending request
      this.emit("message", message as MCPResponse);
    } catch {
      this.emit("error", new MCPError("Failed to parse message", MCPErrorCodes.PARSE_ERROR));
    }
  }

  protected clearPendingRequests(): void {
    for (const [, pending] of this._pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new MCPError("Transport disconnected", MCPErrorCodes.CONNECTION_ERROR));
    }
    this._pendingRequests.clear();
  }

  override on<K extends keyof TransportEvents>(event: K, listener: TransportEvents[K]): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  override off<K extends keyof TransportEvents>(event: K, listener: TransportEvents[K]): this {
    return super.off(event, listener as (...args: unknown[]) => void);
  }
}

// ============================================================================
// Stdio Transport
// ============================================================================

/**
 * MCP transport over stdio (stdin/stdout of a subprocess).
 * Used for local MCP server processes.
 */
export class StdioTransport extends BaseTransport {
  private _process: Deno.ChildProcess | null = null;
  private _reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private _buffer = "";

  constructor(
    private readonly command: string,
    private readonly args: string[] = [],
  ) {
    super();
  }

  async connect(): Promise<void> {
    if (this._state === "connected") return;
    this.setState("connecting");

    try {
      const cmd = new Deno.Command(this.command, {
        args: this.args,
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
      });

      this._process = cmd.spawn();
      this._reader = this._process.stdout.getReader();

      // Start reading stdout in background
      this._readLoop();

      this.setState("connected");
    } catch (err) {
      this.setState("error");
      throw new MCPError(
        `Failed to start process: ${err instanceof Error ? err.message : String(err)}`,
        MCPErrorCodes.CONNECTION_ERROR,
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this._state === "disconnected") return;

    this.clearPendingRequests();
    this._reader?.cancel().catch(() => {});
    this._reader = null;

    if (this._process) {
      try {
        this._process.kill("SIGTERM");
        await this._process.status;
      } catch {
        // Process already exited
      }
      this._process = null;
    }

    this._buffer = "";
    this.setState("disconnected");
  }

  protected async sendRaw(data: string): Promise<void> {
    if (!this._process) {
      throw new MCPError("No process running", MCPErrorCodes.CONNECTION_ERROR);
    }

    const encoder = new TextEncoder();
    const writer = this._process.stdin.getWriter();
    try {
      await writer.write(encoder.encode(data + "\n"));
    } finally {
      writer.releaseLock();
    }
  }

  private async _readLoop(): Promise<void> {
    if (!this._reader) return;

    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await this._reader.read();
        if (done) break;

        this._buffer += decoder.decode(value, { stream: true });

        // Process complete JSON-RPC messages (newline-delimited)
        const lines = this._buffer.split("\n");
        this._buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            this.handleRawMessage(trimmed);
          }
        }
      }
    } catch (err) {
      if (this._state !== "disconnected") {
        this.setState("error");
        this.emit("error", err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (this._state !== "disconnected") {
        this.setState("disconnected");
      }
    }
  }
}

// ============================================================================
// HTTP Transport
// ============================================================================

/**
 * MCP transport over HTTP (stateless request/response).
 * Uses POST for requests and GET/SSE for notifications.
 */
export class HttpTransport extends BaseTransport {
  private _baseUrl: string;
  private _headers: Record<string, string>;

  constructor(
    url: string,
    headers: Record<string, string> = {},
  ) {
    super();
    this._baseUrl = url.replace(/\/$/, "");
    this._headers = { "Content-Type": "application/json", ...headers };
  }

  async connect(): Promise<void> {
    if (this._state === "connected") return;
    this.setState("connecting");

    try {
      // Verify server is reachable with an initialize request
      const response = await fetch(this._baseUrl, {
        method: "POST",
        headers: this._headers,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "init",
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "kayak-lab", version: "1.0.0" },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.setState("connected");
    } catch (err) {
      this.setState("error");
      throw new MCPError(
        `Failed to connect to HTTP server: ${err instanceof Error ? err.message : String(err)}`,
        MCPErrorCodes.CONNECTION_ERROR,
      );
    }
  }

  async disconnect(): Promise<void> {
    this.clearPendingRequests();
    this.setState("disconnected");
  }

  protected async sendRaw(data: string): Promise<void> {
    const response = await fetch(this._baseUrl, {
      method: "POST",
      headers: this._headers,
      body: data,
    });

    if (!response.ok) {
      throw new MCPError(
        `HTTP request failed: ${response.status}`,
        MCPErrorCodes.INTERNAL_ERROR,
      );
    }

    // HTTP responses are synchronous - handle the response inline
    const responseData = await response.text();
    if (responseData.trim()) {
      this.handleRawMessage(responseData);
    }
  }
}

// ============================================================================
// WebSocket Transport
// ============================================================================

/**
 * MCP transport over WebSocket (persistent bidirectional connection).
 */
export class WebSocketTransport extends BaseTransport {
  private _ws: WebSocket | null = null;
  private _url: string;

  constructor(url: string) {
    super();
    this._url = url;
  }

  async connect(): Promise<void> {
    if (this._state === "connected") return;
    this.setState("connecting");

    return new Promise<void>((resolve, reject) => {
      try {
        this._ws = new WebSocket(this._url);

        this._ws.onopen = () => {
          this.setState("connected");
          resolve();
        };

        this._ws.onmessage = (event) => {
          if (typeof event.data === "string") {
            this.handleRawMessage(event.data);
          }
        };

        this._ws.onerror = () => {
          const error = new MCPError(
            "WebSocket error",
            MCPErrorCodes.CONNECTION_ERROR,
          );
          if (this._state === "connecting") {
            reject(error);
          } else {
            this.setState("error");
            this.emit("error", error);
          }
        };

        this._ws.onclose = () => {
          this.clearPendingRequests();
          if (this._state !== "disconnected") {
            this.setState("disconnected");
          }
        };
      } catch (err) {
        this.setState("error");
        reject(new MCPError(
          `Failed to create WebSocket: ${err instanceof Error ? err.message : String(err)}`,
          MCPErrorCodes.CONNECTION_ERROR,
        ));
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this._ws) {
      this.clearPendingRequests();
      this._ws.close();
      this._ws = null;
    }
    this.setState("disconnected");
  }

  protected async sendRaw(data: string): Promise<void> {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
      throw new MCPError("WebSocket not connected", MCPErrorCodes.CONNECTION_ERROR);
    }
    this._ws.send(data);
  }
}

// ============================================================================
// Transport Factory
// ============================================================================

/**
 * Create an MCP transport from configuration.
 */
export function createTransport(config: MCPTransportConfig): IMCPTransport {
  switch (config.type) {
    case "stdio":
      if (!config.command) {
        throw new MCPError(
          "stdio transport requires a command",
          MCPErrorCodes.INVALID_PARAMS,
        );
      }
      return new StdioTransport(config.command, config.args ?? []);

    case "http":
      if (!config.url) {
        throw new MCPError(
          "http transport requires a URL",
          MCPErrorCodes.INVALID_PARAMS,
        );
      }
      return new HttpTransport(config.url, config.headers ?? {});

    case "websocket":
      if (!config.url) {
        throw new MCPError(
          "websocket transport requires a URL",
          MCPErrorCodes.INVALID_PARAMS,
        );
      }
      return new WebSocketTransport(config.url);

    default:
      throw new MCPError(
        `Unknown transport type: ${config.type}`,
        MCPErrorCodes.INVALID_PARAMS,
      );
  }
}
