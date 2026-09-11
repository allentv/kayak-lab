/**
 * Migration script: JSONL files → DuckDB
 *
 * Reads existing JSONL event files from data/events/ directory
 * and loads them into a DuckDB database using read_json_auto().
 */

import { Database } from "duckdb";
import { parseArgs } from "@std/cli/parse-args";
import { join } from "@std/path";
import { existsSync, readDirSync } from "@std/fs";

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_DATA_DIR = "data/events";
const DEFAULT_DB_PATH = "kayak.db";

// ============================================================================
// DuckDB Types
// ============================================================================

interface DuckDBDatabase {
  connect(): DuckDBConnection;
  close(): void;
}

interface DuckDBConnection {
  exec(sql: string, ...params: unknown[]): void;
  prepare(sql: string): DuckDBStatement;
  all(sql: string, params?: unknown[]): DuckDBRow[];
  close(): void;
}

interface DuckDBStatement {
  run(...params: unknown[]): void;
  close(): void;
}

type DuckDBRow = Record<string, unknown>;

// ============================================================================
// Helper Functions
// ============================================================================

function getJsonlFiles(dataDir: string): string[] {
  const files: string[] = [];
  for (const entry of readDirSync(dataDir)) {
    if (entry.isFile && entry.name.endsWith(".jsonl")) {
      files.push(join(dataDir, entry.name));
    }
  }
  return files;
}

function parseJsonlFile(filePath: string): unknown[] {
  const content = Deno.readTextFileSync(filePath);
  const lines = content.split("\n").filter((line) => line.trim() !== "");
  return lines.map((line) => JSON.parse(line));
}

function createSchema(conn: DuckDBConnection): void {
  conn.exec(`
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

function insertEventsBatch(
  conn: DuckDBConnection,
  events: unknown[]
): number {
  if (events.length === 0) return 0;

  const stmt = conn.prepare(
    `INSERT INTO events (id, session_id, sequence, event_type, payload, timestamp, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  let inserted = 0;
  for (const event of events) {
    const e = event as Record<string, unknown>;
    stmt.run(
      (e.event_id as string) || crypto.randomUUID(),
      (e.session_id as string) || "unknown",
      (e.sequence_number as number) || 0,
      (e.event_type as string) || "unknown",
      JSON.stringify(e),
      (e.timestamp as string) || new Date().toISOString(),
      JSON.stringify(e.metadata || {})
    );
    inserted++;
  }

  stmt.close();
  return inserted;
}

function verifyMigration(conn: DuckDBConnection, dataDir: string): void {
  const files = getJsonlFiles(dataDir);
  let totalJsonlEvents = 0;

  for (const file of files) {
    const events = parseJsonlFile(file);
    totalJsonlEvents += events.length;
  }

  const rows = conn.all(`SELECT COUNT(*) as cnt FROM events`);
  const totalDuckdbEvents = (rows[0].cnt as number);

  console.log(`Migration verification:`);
  console.log(`  JSONL files: ${files.length}`);
  console.log(`  JSONL events: ${totalJsonlEvents}`);
  console.log(`  DuckDB events: ${totalDuckdbEvents}`);

  if (totalJsonlEvents === totalDuckdbEvents) {
    console.log(`  ✓ Event counts match`);
  } else {
    console.log(`  ✗ Event counts mismatch!`);
  }
}

// ============================================================================
// Main Migration
// ============================================================================

async function migrate(dataDir: string, dbPath: string, verify: boolean): Promise<void> {
  console.log(`Migrating JSONL files from ${dataDir} to ${dbPath}...`);

  // Check if data directory exists
  if (!existsSync(dataDir)) {
    console.error(`Data directory not found: ${dataDir}`);
    Deno.exit(1);
  }

  // Get all JSONL files
  const files = getJsonlFiles(dataDir);
  if (files.length === 0) {
    console.log("No JSONL files found. Nothing to migrate.");
    return;
  }

  console.log(`Found ${files.length} JSONL files to migrate.`);

  // Open DuckDB
  const db = new Database(dbPath) as unknown as DuckDBDatabase;
  const conn = db.connect();

  // Create schema
  createSchema(conn);

  let totalInserted = 0;

  // Process each file
  for (const file of files) {
    const events = parseJsonlFile(file);
    const inserted = insertEventsBatch(conn, events);
    totalInserted += inserted;
    console.log(`  ${file}: ${inserted} events`);
  }

  console.log(`\nMigration complete!`);
  console.log(`Total events inserted: ${totalInserted}`);

  // Verify migration if requested
  if (verify) {
    console.log(`\nVerifying migration...`);
    verifyMigration(conn, dataDir);
  }

  // Close connection
  conn.close();
  db.close();
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["data-dir", "db-path"],
    boolean: ["verify", "help"],
    default: {
      "data-dir": DEFAULT_DATA_DIR,
      "db-path": DEFAULT_DB_PATH,
      verify: true,
    },
  });

  if (args.help) {
    console.log(`
Migration script: JSONL → DuckDB

Usage:
  deno run -A scripts/migrate-jsonl-to-duckdb.ts [options]

Options:
  --data-dir <path>   Path to JSONL files directory (default: ${DEFAULT_DATA_DIR})
  --db-path <path>    Path to DuckDB database file (default: ${DEFAULT_DB_PATH})
  --verify            Verify migration (default: true)
  --help              Show this help message
`);
    Deno.exit(0);
  }

  await migrate(args["data-dir"], args["db-path"], args.verify);
}