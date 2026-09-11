/**
 * SQLite persistence backend for event store and memory storage.
 *
 * Implements IPersistenceBackend and IMemoryStorage interfaces using SQLite
 * embedded database. Replaces the DuckDB backend for single-binary compatibility.
 */

import { Database } from "@db/sqlite";
import { Snapshot } from "./event-store.ts";
import { IPersistenceBackend } from "./persistence.ts";
import {
  IMemoryStorage,
  StorageListOptions,
  StorageBackend,
} from "../memory/storage.ts";
import type { AnyMemory, MemoryType } from "../memory/types.ts";

// ============================================================================
// SQLite Configuration
// ============================================================================

export interface SQLiteConfig {
  /** Path to the SQLite database file. Use ':memory:' for in-memory. */
  dbPath: string;
}

// ============================================================================
// SQLite Persistence Backend
// ============================================================================

/**
 * SQLite persistence backend implementing both IPersistenceBackend and IMemoryStorage.
 * Embedded database with WAL mode for concurrent reads and SQL-based queries.
 */
export class SQLitePersistenceBackend implements IPersistenceBackend, IMemoryStorage {
  readonly backend: StorageBackend = "duckdb";
  private db: Database;
  private closed = false;

  constructor(config: SQLiteConfig) {
    this.db = new Database(config.dbPath);
    this.db.exec("PRAGMA journal_mode = WAL");
    this.db.exec("PRAGMA foreign_keys = ON");
    this.initSchema();
  }

  // --------------------------------------------------------------------------
  // Schema Initialization
  // --------------------------------------------------------------------------

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT,
        timestamp TEXT DEFAULT (datetime('now')),
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        session_id TEXT,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS snapshots (
        session_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  // --------------------------------------------------------------------------
  // IPersistenceBackend — Event Operations
  // --------------------------------------------------------------------------

  write(sessionId: string, line: string): void {
    if (this.closed) throw new Error("Backend is closed");

    const event = JSON.parse(line) as Record<string, unknown>;
    this.db.exec(
      `INSERT OR REPLACE INTO events (id, session_id, sequence, event_type, payload, timestamp, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      (event.event_id as string) || crypto.randomUUID(),
      sessionId,
      (event.sequence_number as number) || 0,
      (event.event_type as string) || "unknown",
      JSON.stringify(event),
      (event.timestamp as string) || new Date().toISOString(),
      JSON.stringify(event.metadata || {}),
    );
  }

  readLines(sessionId: string): string[] {
    if (this.closed) throw new Error("Backend is closed");

    return this.db.prepare(
      `SELECT payload FROM events WHERE session_id = ? ORDER BY sequence`,
    ).all(sessionId).map((row) => row.payload as string);
  }

  writeSnapshot(sessionId: string, data: Snapshot): void {
    if (this.closed) throw new Error("Backend is closed");

    this.db.exec(
      `INSERT OR REPLACE INTO snapshots (session_id, data, updated_at)
       VALUES (?, ?, ?)`,
      sessionId,
      JSON.stringify(data),
      new Date().toISOString(),
    );
  }

  readSnapshot(sessionId: string): Snapshot | undefined {
    if (this.closed) throw new Error("Backend is closed");

    const rows = this.db.prepare(
      `SELECT data FROM snapshots WHERE session_id = ?`,
    ).all(sessionId);
    if (rows.length === 0) return undefined;
    return JSON.parse(rows[0].data as string) as Snapshot;
  }

  listSessions(): string[] {
    if (this.closed) throw new Error("Backend is closed");

    return this.db.prepare(
      `SELECT DISTINCT session_id FROM events`,
    ).all().map((row) => row.session_id as string);
  }

  exists(sessionId: string): boolean {
    if (this.closed) throw new Error("Backend is closed");

    const row = this.db.prepare(
      `SELECT COUNT(*) as cnt FROM events WHERE session_id = ?`,
    ).get(sessionId) as { cnt: number } | undefined;
    return (row?.cnt ?? 0) > 0;
  }

  // --------------------------------------------------------------------------
  // IMemoryStorage — Memory Operations
  // --------------------------------------------------------------------------

  async store(memory: AnyMemory): Promise<void> {
    if (this.closed) throw new Error("Backend is closed");

    this.db.exec(
      `INSERT INTO memories (id, type, session_id, content, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      memory.id,
      memory.type,
      memory.session_id || null,
      JSON.stringify(memory.content),
      JSON.stringify(memory.metadata || {}),
      memory.created_at || new Date().toISOString(),
    );
  }

  async retrieve(id: string): Promise<AnyMemory | null> {
    if (this.closed) throw new Error("Backend is closed");

    const row = this.db.prepare(
      `SELECT * FROM memories WHERE id = ?`,
    ).get(id) as Record<string, unknown> | undefined;
    if (!row) return null;

    return {
      id: row.id as string,
      type: row.type as MemoryType,
      session_id: row.session_id as string,
      content: JSON.parse(row.content as string),
      metadata: JSON.parse((row.metadata as string) || "{}"),
      created_at: row.created_at as string,
    } as AnyMemory;
  }

  async delete(id: string): Promise<boolean> {
    if (this.closed) throw new Error("Backend is closed");

    const row = this.db.prepare(
      `SELECT COUNT(*) as cnt FROM memories WHERE id = ?`,
    ).get(id) as { cnt: number } | undefined;
    if ((row?.cnt ?? 0) === 0) return false;

    this.db.exec(`DELETE FROM memories WHERE id = ?`, id);
    return true;
  }

  async list(options?: StorageListOptions): Promise<AnyMemory[]> {
    if (this.closed) throw new Error("Backend is closed");

    let sql = `SELECT * FROM memories WHERE 1=1`;
    const params: (string | number | null)[] = [];

    if (options?.type) {
      sql += ` AND type = ?`;
      params.push(options.type);
    }
    if (options?.session_id) {
      sql += ` AND session_id = ?`;
      params.push(options.session_id);
    }

    sql += ` ORDER BY created_at DESC`;

    if (options?.max_results) {
      sql += ` LIMIT ?`;
      params.push(options.max_results);
    }

    return this.db.prepare(sql).all(...params).map((row) => ({
      id: row.id as string,
      type: row.type as MemoryType,
      session_id: row.session_id as string,
      content: JSON.parse(row.content as string),
      metadata: JSON.parse((row.metadata as string) || "{}"),
      created_at: row.created_at as string,
    }) as AnyMemory);
  }

  async isAvailable(): Promise<boolean> {
    return !this.closed;
  }

  // --------------------------------------------------------------------------
  // Connection Management
  // --------------------------------------------------------------------------

  getDatabase(): Database {
    return this.db;
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.db.close();
  }
}
