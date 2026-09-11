/**
 * POST /api/query
 * GET /api/query?sql=...
 *
 * Execute SQL queries against DuckDB and return JSON results.
 * Supports both POST (body) and GET (query parameter) methods.
 *
 * Input validation prevents destructive operations (DROP, DELETE, TRUNCATE).
 */

import type { RouteHandler } from "fresh";

// ============================================================================
// DuckDB Types
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
// Configuration
// ============================================================================

const DB_PATH = "kayak.db";
const BLOCKED_KEYWORDS = ["DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE", "INSERT", "UPDATE"];

// ============================================================================
// Helper Functions
// ============================================================================

function isDestructiveSql(sql: string): boolean {
  const upperSql = sql.toUpperCase().trim();
  return BLOCKED_KEYWORDS.some((keyword) => upperSql.startsWith(keyword));
}

function getDatabase(): DuckDBDatabase {
  const duckdbModule = (globalThis as unknown as { __duckdb?: unknown }).__duckdb;
  if (!duckdbModule) {
    throw new Error("DuckDB not available. Run scripts/setup-duckdb.sh first.");
  }
  return new (duckdbModule as new (path: string) => DuckDBDatabase)(DB_PATH);
}

// ============================================================================
// Route Handler
// ============================================================================

export const handler: RouteHandler<unknown, unknown> = {
  GET(req: Request): Response {
    const url = new URL(req.url);
    const sql = url.searchParams.get("sql");

    if (!sql) {
      return Response.json({ error: "Missing 'sql' query parameter" }, { status: 400 });
    }

    if (isDestructiveSql(sql)) {
      return Response.json({ error: "Destructive SQL operation not allowed" }, { status: 403 });
    }

    try {
      const db = getDatabase();
      const conn = db.connect();
      const results = conn.all(sql);
      conn.close();
      db.close();

      return Response.json({ results });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Response.json({ error: message }, { status: 500 });
    }
  },

  async POST(req: Request): Promise<Response> {
    let body: { sql?: string };

    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const sql = body.sql;
    if (!sql) {
      return Response.json({ error: "Missing 'sql' field in request body" }, { status: 400 });
    }

    if (isDestructiveSql(sql)) {
      return Response.json({ error: "Destructive SQL operation not allowed" }, { status: 403 });
    }

    try {
      const db = getDatabase();
      const conn = db.connect();
      const results = conn.all(sql);
      conn.close();
      db.close();

      return Response.json({ results });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Response.json({ error: message }, { status: 500 });
    }
  },
};