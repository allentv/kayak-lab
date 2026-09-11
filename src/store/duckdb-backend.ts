/**
 * DuckDB persistence backend for event store and memory storage.
 *
 * Implements IPersistenceBackend and IMemoryStorage interfaces using DuckDB
 * embedded database with columnar analytics and SQL-based queries.
 */

import { Snapshot } from "./event-store.ts";
import { IPersistenceBackend } from "./persistence.ts";
import {
  IMemoryStorage,
  StorageListOptions,
  StorageBackend,
} from "../memory/storage.ts";
import type { AnyMemory, MemoryType } from "../memory/types.ts";

// ============================================================================
// DuckDB Types (minimal, matching duckdb npm package API)
// ============================================================================

interface DuckDBDatabase {
  connect(): DuckDBConnection;
  close(): void;
}

interface DuckDBConnection {
  exec(sql: string, ...params: unknown[]): void;
  all(sql: string, params?: unknown[]): DuckDBRow[];
  close(): void;
}

type DuckDBRow = Record<string, unknown>;

// ============================================================================
// DuckDB Configuration
// ============================================================================

export interface DuckDBConfig {
  /** Path to the DuckDB database file. Defaults to 'kayak.db' */
  dbPath: string;
}

// ============================================================================
// DuckDB Persistence Backend
// ============================================================================

/**
 * DuckDB persistence backend implementing both IPersistenceBackend and IMemoryStorage.
 * Provides columnar analytics, native JSON ingestion, and SQL-based multi-dimensional queries.
 */
export class DuckDBPersistenceBackend implements IPersistenceBackend, IMemoryStorage {
  readonly backend: StorageBackend = "duckdb";
  private db: DuckDBDatabase;
  private conn: DuckDBConnection;
  private closed = false;

  constructor(config: DuckDBConfig) {
    const duckdbModule = (globalThis as unknown as { __duckdb?: unknown }).__duckdb;
    if (!duckdbModule) {
      throw new Error("DuckDB not available. Run scripts/setup-duckdb.sh first.");
    }

    this.db = new (duckdbModule as new (path: string) => DuckDBDatabase)(config.dbPath);
    this.conn = this.db.connect();
    this.initSchema();
  }

  // --------------------------------------------------------------------------
  // Schema Initialization
  // --------------------------------------------------------------------------

  private initSchema(): void {
    this.conn.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR DEFAULT (uuid()),
        session_id VARCHAR NOT NULL,
        sequence INTEGER NOT NULL,
        event_type VARCHAR NOT NULL,
        payload JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSON
      );

      CREATE TABLE IF NOT EXISTS memories (
        id VARCHAR DEFAULT (uuid()),
        type VARCHAR NOT NULL,
        session_id VARCHAR,
        content VARCHAR NOT NULL,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS snapshots (
        session_id VARCHAR PRIMARY KEY,
        data JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // --------------------------------------------------------------------------
  // IPersistenceBackend — Event Operations
  // --------------------------------------------------------------------------

  write(sessionId: string, line: string): void {
    if (this.closed) throw new Error("Backend is closed");

    const event = JSON.parse(line) as Record<string, unknown>;
    this.conn.exec(
      `INSERT INTO events (id, session_id, sequence, event_type, payload, timestamp, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        (event.event_id as string) || crypto.randomUUID(),
        sessionId,
        (event.sequence_number as number) || 0,
        (event.event_type as string) || "unknown",
        JSON.stringify(event),
        (event.timestamp as string) || new Date().toISOString(),
        JSON.stringify(event.metadata || {}),
      ]
    );
  }

  readLines(sessionId: string): string[] {
    if (this.closed) throw new Error("Backend is closed");

    const rows = this.conn.all(
      `SELECT payload FROM events WHERE session_id = ? ORDER BY sequence`,
      [sessionId]
    );
    return rows.map((row) => row.payload as string);
  }

  writeSnapshot(sessionId: string, data: Snapshot): void {
    if (this.closed) throw new Error("Backend is closed");

    this.conn.exec(
      `INSERT OR REPLACE INTO snapshots (session_id, data, updated_at)
       VALUES (?, ?, ?)`,
      [sessionId, JSON.stringify(data), new Date().toISOString()]
    );
  }

  readSnapshot(sessionId: string): Snapshot | undefined {
    if (this.closed) throw new Error("Backend is closed");

    const rows = this.conn.all(
      `SELECT data FROM snapshots WHERE session_id = ?`,
      [sessionId]
    );
    if (rows.length === 0) return undefined;
    return JSON.parse(rows[0].data as string) as Snapshot;
  }

  listSessions(): string[] {
    if (this.closed) throw new Error("Backend is closed");

    const rows = this.conn.all(
      `SELECT DISTINCT session_id FROM events`
    );
    return rows.map((row) => row.session_id as string);
  }

  exists(sessionId: string): boolean {
    if (this.closed) throw new Error("Backend is closed");

    const rows = this.conn.all(
      `SELECT COUNT(*) as cnt FROM events WHERE session_id = ?`,
      [sessionId]
    );
    return (rows[0].cnt as number) > 0;
  }

  // --------------------------------------------------------------------------
  // IMemoryStorage — Memory Operations
  // --------------------------------------------------------------------------

  async store(memory: AnyMemory): Promise<void> {
    if (this.closed) throw new Error("Backend is closed");

    this.conn.exec(
      `INSERT INTO memories (id, type, session_id, content, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        memory.id,
        memory.type,
        memory.session_id || null,
        JSON.stringify(memory.content),
        JSON.stringify(memory.metadata || {}),
        memory.created_at || new Date().toISOString(),
      ]
    );
  }

  async retrieve(id: string): Promise<AnyMemory | null> {
    if (this.closed) throw new Error("Backend is closed");

    const rows = this.conn.all(
      `SELECT * FROM memories WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) return null;

    const row = rows[0];
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

    const rows = this.conn.all(
      `SELECT COUNT(*) as cnt FROM memories WHERE id = ?`,
      [id]
    );
    if ((rows[0].cnt as number) === 0) return false;

    this.conn.exec(
      `DELETE FROM memories WHERE id = ?`,
      [id]
    );
    return true;
  }

  async list(options?: StorageListOptions): Promise<AnyMemory[]> {
    if (this.closed) throw new Error("Backend is closed");

    let sql = `SELECT * FROM memories WHERE 1=1`;
    const params: unknown[] = [];

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

    const rows = this.conn.all(sql, params);
    return rows.map((row) => ({
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

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.conn.close();
    this.db.close();
  }
}