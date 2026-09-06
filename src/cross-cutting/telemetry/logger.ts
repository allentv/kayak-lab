/**
 * Structured logger with level filtering and in-memory storage.
 */

import type { LogLevel, LogEntry, LoggerConfig } from "./types.ts";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Structured logger that outputs JSON log entries and stores them in memory.
 */
export class StructuredLogger {
  private config: LoggerConfig;
  private output: LogEntry[] = [];

  constructor(config: LoggerConfig) {
    this.config = {
      minLevel: "debug",
      ...config,
    };
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log("error", message, metadata);
  }

  setSessionId(sessionId: string): void {
    this.config.sessionId = sessionId;
  }

  getEntries(): LogEntry[] {
    return [...this.output];
  }

  clear(): void {
    this.output = [];
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.config.minLevel!]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.config.component,
      message,
    };

    if (this.config.sessionId) {
      entry.session_id = this.config.sessionId;
    }

    if (metadata && Object.keys(metadata).length > 0) {
      entry.metadata = metadata;
    }

    this.output.push(entry);

    // Also write formatted JSON to stderr for observability
    Deno.stderr.writeSync(
      new TextEncoder().encode(this.formatJson(entry) + "\n"),
    );
  }

  private formatJson(entry: LogEntry): string {
    return JSON.stringify(entry);
  }
}
