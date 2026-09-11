/**
 * POST /api/query
 * GET /api/query?sql=...
 *
 * Execute SQL queries against SQLite and return JSON results.
 * Supports both POST (body) and GET (query parameter) methods.
 *
 * Input validation prevents destructive operations (DROP, DELETE, TRUNCATE).
 */

import type { RouteHandler } from "fresh";
import { Database } from "@db/sqlite";

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

function getDatabase(): Database {
  return new Database(DB_PATH);
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
      const results = db.prepare(sql).all();
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
      const results = db.prepare(sql).all();
      db.close();
      return Response.json({ results });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Response.json({ error: message }, { status: 500 });
    }
  },
};
