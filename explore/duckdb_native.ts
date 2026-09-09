/**
 * DuckDB Exploration: Native Binding in Deno
 *
 * Tests the native Node.js binding with Deno's Node.js compatibility
 */

import duckdb from "npm:duckdb";

console.log("=== DuckDB Native Binding Test ===\n");

// Create in-memory database
const db = new duckdb.Database(":memory:");
const conn = db.connect();

console.log("✅ Connected to DuckDB (native)\n");

// Test basic query
conn.all("SELECT 42 as answer, current_timestamp as now", (err: Error | null, rows: any[]) => {
  if (err) {
    console.error("Query failed:", err);
    return;
  }
  console.log("Query result:", rows);
  
  // Close connection
  conn.close(() => {
    db.close(() => {
      console.log("\n✅ Connection closed");
    });
  });
});
