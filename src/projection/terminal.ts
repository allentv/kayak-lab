/**
 * Terminal projection implementation.
 *
 * Renders events to the terminal with styling and handles user input.
 */

import { BaseEvent, EventType, EventTypes } from "../types/events.ts";
import {
  IProjectionProtocol,
  Subscription,
  SubscriptionOptions,
  EventDeliveryCallback,
} from "./protocol.ts";

// ============================================================================
// Terminal Types
// ============================================================================

/** Terminal styling options. */
export interface TerminalStyle {
  /** ANSI color code or named color. */
  color?: string;
  /** ANSI background color. */
  background?: string;
  /** Bold text. */
  bold?: boolean;
  /** Italic text. */
  italic?: boolean;
  /** Underline text. */
  underline?: boolean;
  /** Dimmed text. */
  dim?: boolean;
}

/** Event renderer interface. */
export interface IEventRenderer {
  /** Render an event to terminal output. */
  render(event: BaseEvent): string;
}

/** User input handler. */
export type InputHandler = (input: string) => void | Promise<void>;

/** Terminal projection options. */
export interface TerminalProjectionOptions {
  /** Custom event renderer. */
  renderer?: IEventRenderer;
  /** Enable colored output. */
  colors?: boolean;
  /** Enable timestamps in output. */
  timestamps?: boolean;
  /** Output stream (defaults to stdout). */
  output?: WritableStream<string>;
}

// ============================================================================
// Default Event Renderer
// ============================================================================

/**
 * Default renderer that formats events for terminal display.
 */
export class DefaultEventRenderer implements IEventRenderer {
  private colors: boolean;

  constructor(colors = true) {
    this.colors = colors;
  }

  render(event: BaseEvent): string {
    const style = this.getStyleForEventType(event.event_type);
    const prefix = this.getPrefixForEventType(event.event_type);
    const timestamp = this.formatTimestamp(event.timestamp);
    const payload = this.formatPayload(event.payload);

    let output = "";
    if (timestamp) {
      output += this.colorize(`${timestamp} `, { dim: true });
    }
    output += this.colorize(`[${prefix}]`, style);
    output += ` ${payload}`;

    return output;
  }

  private getStyleForEventType(type: EventType): TerminalStyle {
    if (type.startsWith("session.")) {
      return { color: "blue", bold: true };
    }
    if (type.startsWith("tool.")) {
      return { color: "green" };
    }
    if (type.startsWith("model.")) {
      return { color: "magenta" };
    }
    if (type.startsWith("user.")) {
      return { color: "cyan" };
    }
    if (type.startsWith("context.")) {
      return { color: "yellow" };
    }
    return {};
  }

  private getPrefixForEventType(type: EventType): string {
    const parts = type.split(".");
    return parts[0]?.toUpperCase() ?? type;
  }

  private formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return "";
    }
  }

  private formatPayload(payload: Record<string, unknown>): string {
    // Simple payload formatting
    const entries = Object.entries(payload);
    if (entries.length === 0) return "";

    const formatted = entries
      .map(([key, value]) => {
        if (typeof value === "string") return `${key}: ${value}`;
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join(", ");

    return `{${formatted}}`;
  }

  private colorize(text: string, style: TerminalStyle): string {
    if (!this.colors) return text;

    let code = "";
    if (style.bold) code += "\x1b[1m";
    if (style.italic) code += "\x1b[3m";
    if (style.underline) code += "\x1b[4m";
    if (style.dim) code += "\x1b[2m";

    if (style.color) {
      const colorCode = this.getColorCode(style.color);
      if (colorCode) code += colorCode;
    }

    if (code) {
      return `${code}${text}\x1b[0m`;
    }
    return text;
  }

  private getColorCode(color: string): string {
    const colorMap: Record<string, string> = {
      black: "\x1b[30m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      white: "\x1b[37m",
    };
    return colorMap[color] ?? "";
  }
}

// ============================================================================
// Terminal Projection
// ============================================================================

/**
 * Terminal projection that renders events to the terminal.
 *
 * Subscribes to the projection protocol and displays events
 * in a human-readable format.
 */
export class TerminalProjection {
  private protocol: IProjectionProtocol;
  private renderer: IEventRenderer;
  private options: TerminalProjectionOptions;
  private subscription: Subscription | null = null;
  private inputHandlers: Set<InputHandler> = new Set();
  private readline: unknown = null;

  constructor(
    protocol: IProjectionProtocol,
    options: TerminalProjectionOptions = {},
  ) {
    this.protocol = protocol;
    this.options = {
      colors: true,
      timestamps: true,
      ...options,
    };
    this.renderer = options.renderer ?? new DefaultEventRenderer(this.options.colors);
  }

  /**
   * Start the terminal projection for a session.
   *
   * @param sessionId - Session to display
   * @param filterOptions - Optional event filter
   */
  async start(
    sessionId: string,
    filterOptions?: SubscriptionOptions,
  ): Promise<void> {
    // Set up event delivery callback
    const callback: EventDeliveryCallback = (event) => {
      this.renderEvent(event);
    };

    // Subscribe to events
    this.subscription = this.protocol.subscribe(
      sessionId,
      callback,
      filterOptions,
    );

    // Set up input handling
    await this.setupInputHandling();
  }

  /**
   * Stop the terminal projection.
   */
  async stop(): Promise<void> {
    if (this.subscription) {
      this.protocol.unsubscribe(this.subscription.id);
      this.subscription = null;
    }

    await this.teardownInputHandling();
  }

  /**
   * Add an input handler.
   *
   * @param handler - Handler for user input
   */
  onInput(handler: InputHandler): void {
    this.inputHandlers.add(handler);
  }

  /**
   * Remove an input handler.
   *
   * @param handler - Handler to remove
   */
  removeInputHandler(handler: InputHandler): void {
    this.inputHandlers.delete(handler);
  }

  /**
   * Get current subscription state.
   */
  getSubscription(): Subscription | null {
    return this.subscription;
  }

  /**
   * Write a message directly to the terminal.
   *
   * @param message - Message to display
   */
  write(message: string): void {
    if (this.options.output) {
      const writer = this.options.output.getWriter();
      writer.write(message + "\n");
      writer.releaseLock();
    } else {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }

  private renderEvent(event: BaseEvent): void {
    const output = this.renderer.render(event);
    this.write(output);
  }

  private async setupInputHandling(): Promise<void> {
    // In a real implementation, this would set up readline
    // For now, we'll just have a placeholder
    if (typeof Deno !== "undefined") {
      // Deno environment
      this.readline = null;
    } else if (typeof process !== "undefined") {
      // Node.js environment
      this.readline = null;
    }
  }

  private async teardownInputHandling(): Promise<void> {
    this.inputHandlers.clear();
    this.readline = null;
  }
}

// ============================================================================
// Streaming Display
// ============================================================================

/**
 * Streaming display for real-time event updates.
 *
 * Handles incremental updates and redrawing of terminal content.
 */
export class StreamingDisplay {
  private terminal: TerminalProjection;
  private buffer: string[] = [];
  private maxLines: number;

  constructor(terminal: TerminalProjection, maxLines = 100) {
    this.terminal = terminal;
    this.maxLines = maxLines;
  }

  /**
   * Add a line to the display buffer.
   *
   * @param line - Line to add
   */
  addLine(line: string): void {
    this.buffer.push(line);

    // Trim buffer if too large
    if (this.buffer.length > this.maxLines) {
      this.buffer = this.buffer.slice(-this.maxLines);
    }

    this.redraw();
  }

  /**
   * Clear the display buffer.
   */
  clear(): void {
    this.buffer = [];
    this.redraw();
  }

  /**
   * Get current buffer contents.
   */
  getBuffer(): readonly string[] {
    return this.buffer;
  }

  private redraw(): void {
    // Clear screen and redraw buffer
    // In a real implementation, this would use ANSI escape codes
    // for efficient screen updates
    this.terminal.write("\x1b[2J\x1b[H");
    for (const line of this.buffer) {
      this.terminal.write(line);
    }
  }
}
