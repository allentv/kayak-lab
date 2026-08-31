/**
 * Persistence layer for event store.
 *
 * Provides file-based event persistence with JSONL append-only logs,
 * snapshot persistence, and startup recovery.
 */

import { BaseEvent } from "../types/events.ts";
import { Snapshot } from "./event-store.ts";

// ============================================================================
// Persistence Backend Interface
// ============================================================================

/**
 * Interface for persistence backends.
 * Implementations handle the actual disk I/O operations.
 */
export interface IPersistenceBackend {
  /**
   * Append a line to the session's JSONL file.
   * @param sessionId - The session identifier
   * @param line - The JSON line to append
   */
  write(sessionId: string, line: string): void;

  /**
   * Read all lines from the session's JSONL file.
   * @param sessionId - The session identifier
   * @returns Array of JSON lines (empty array if file doesn't exist)
   */
  readLines(sessionId: string): string[];

  /**
   * Write a snapshot to disk.
   * @param sessionId - The session identifier
   * @param data - The snapshot data to serialize and write
   */
  writeSnapshot(sessionId: string, data: Snapshot): void;

  /**
   * Read the latest snapshot from disk.
   * @param sessionId - The session identifier
   * @returns The parsed snapshot, or undefined if no snapshot exists
   */
  readSnapshot(sessionId: string): Snapshot | undefined;

  /**
   * List all session IDs that have persisted data.
   * @returns Array of session identifiers
   */
  listSessions(): string[];

  /**
   * Check if a session has persisted data.
   * @param sessionId - The session identifier
   * @returns True if the session file exists
   */
  exists(sessionId: string): boolean;
}

// ============================================================================
// Persistence Configuration
// ============================================================================

/**
 * Configuration for the persistent event store.
 */
export interface PersistenceConfig {
  /** Directory where event files are stored */
  dataDir: string;

  /** Optional custom backend implementation */
  backend?: IPersistenceBackend;
}

// ============================================================================
// File-Based Backend Implementation
// ============================================================================

/**
 * File-based persistence backend using JSONL append-only logs.
 */
export class FilePersistenceBackend implements IPersistenceBackend {
  private readonly dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  write(sessionId: string, line: string): void {
    // Ensure data directory exists
    try {
      Deno.statSync(this.dataDir);
    } catch {
      Deno.mkdirSync(this.dataDir, { recursive: true });
    }

    const filePath = `${this.dataDir}/${sessionId}.jsonl`;
    Deno.writeTextFileSync(filePath, line + "\n", { append: true });
  }

  readLines(sessionId: string): string[] {
    const filePath = `${this.dataDir}/${sessionId}.jsonl`;
    try {
      const content = Deno.readTextFileSync(filePath);
      return content.split("\n").filter((line) => line.trim() !== "");
    } catch {
      return [];
    }
  }

  writeSnapshot(sessionId: string, data: Snapshot): void {
    // Ensure data directory exists
    try {
      Deno.statSync(this.dataDir);
    } catch {
      Deno.mkdirSync(this.dataDir, { recursive: true });
    }

    const filePath = `${this.dataDir}/${sessionId}.snapshot.json`;
    Deno.writeTextFileSync(filePath, JSON.stringify(data, null, 2));
  }

  readSnapshot(sessionId: string): Snapshot | undefined {
    const filePath = `${this.dataDir}/${sessionId}.snapshot.json`;
    try {
      const content = Deno.readTextFileSync(filePath);
      return JSON.parse(content) as Snapshot;
    } catch {
      return undefined;
    }
  }

  listSessions(): string[] {
    // Ensure data directory exists
    try {
      Deno.statSync(this.dataDir);
    } catch {
      Deno.mkdirSync(this.dataDir, { recursive: true });
    }

    const sessions: string[] = [];

    for (const entry of Deno.readDirSync(this.dataDir)) {
      if (entry.isFile && entry.name.endsWith(".jsonl")) {
        sessions.push(entry.name.replace(".jsonl", ""));
      }
    }

    return sessions;
  }

  exists(sessionId: string): boolean {
    try {
      Deno.statSync(`${this.dataDir}/${sessionId}.jsonl`);
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Persistent Event Store
// ============================================================================

/**
 * Persistent event store that durably writes events to disk.
 * Implements the IEventStore interface with file-based persistence.
 */
export class PersistentEventStore {
  private readonly backend: IPersistenceBackend;
  private readonly eventCache = new Map<string, BaseEvent[]>();
  private readonly snapshotCache = new Map<string, Snapshot>();

  constructor(config: PersistenceConfig) {
    this.backend = config.backend ?? new FilePersistenceBackend(config.dataDir);
    this.recover();
  }

  store(event: BaseEvent): void {
    const line = JSON.stringify(event);
    this.backend.write(event.session_id, line);

    // Update cache
    const sessionEvents = this.eventCache.get(event.session_id) ?? [];
    sessionEvents.push(event);
    this.eventCache.set(event.session_id, sessionEvents);
  }

  getEvents(sessionId: string): readonly BaseEvent[] {
    const events = this.eventCache.get(sessionId) ?? [];
    return Object.freeze([...events]);
  }

  getEventsInRange(sessionId: string, from: number, to: number): readonly BaseEvent[] {
    const events = this.eventCache.get(sessionId) ?? [];
    const filtered = events.filter((e) => e.sequence_number >= from && e.sequence_number <= to);
    return Object.freeze([...filtered]);
  }

  getLastEvent(sessionId: string): BaseEvent | undefined {
    const events = this.eventCache.get(sessionId);
    return events?.[events.length - 1];
  }

  hasSession(sessionId: string): boolean {
    return this.eventCache.has(sessionId);
  }

  getSessionIds(): string[] {
    return Array.from(this.eventCache.keys());
  }

  createSnapshot(sessionId: string, state: Record<string, unknown>): Snapshot {
    const lastEvent = this.getLastEvent(sessionId);
    const sequenceNumber = lastEvent?.sequence_number ?? 0;

    const snapshot: Snapshot = {
      session_id: sessionId,
      sequence_number: sequenceNumber,
      timestamp: new Date().toISOString(),
      state,
    };

    this.backend.writeSnapshot(sessionId, snapshot);
    this.snapshotCache.set(sessionId, snapshot);

    return snapshot;
  }

  getLatestSnapshot(sessionId: string): Snapshot | undefined {
    return this.snapshotCache.get(sessionId);
  }

  getEventsAfterSnapshot(sessionId: string, snapshot: Snapshot): readonly BaseEvent[] {
    const events = this.eventCache.get(sessionId) ?? [];
    return Object.freeze(
      events.filter((e) => e.sequence_number > snapshot.sequence_number),
    );
  }

  flush(): void {
    // Synchronous writes already guarantee durability
  }

  recover(): void {
    const sessions = this.backend.listSessions();

    for (const sessionId of sessions) {
      // Load snapshot if exists
      const snapshot = this.backend.readSnapshot(sessionId);
      if (snapshot) {
        this.snapshotCache.set(sessionId, snapshot);
      }

      // Load events from JSONL file
      const lines = this.backend.readLines(sessionId);
      const events: BaseEvent[] = [];

      for (const line of lines) {
        try {
          const event = JSON.parse(line) as BaseEvent;
          events.push(event);
        } catch {
          console.warn(`Skipping corrupted line in session ${sessionId}`);
        }
      }

      // Sort by sequence number to ensure correct order
      events.sort((a, b) => a.sequence_number - b.sequence_number);

      // If snapshot exists, only keep events after snapshot
      if (snapshot) {
        const filteredEvents = events.filter((e) => e.sequence_number > snapshot.sequence_number);
        this.eventCache.set(sessionId, filteredEvents);
      } else {
        this.eventCache.set(sessionId, events);
      }
    }
  }
}