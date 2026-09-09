/**
 * Quick test: better-sqlite3 in Deno (for comparison)
 */
import Database from "npm:better-sqlite3";

console.log("=== better-sqlite3 Test ===\n");

const db = new Database(":memory:");

// Create table
db.exec(`
  CREATE TABLE events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT,
    timestamp TEXT
  )
`);

// Insert test data
const insert = db.prepare(`
  INSERT INTO events (id, session_id, event_type, payload, timestamp)
  VALUES (?, ?, ?, ?, ?)
`);

for (let i = 0; i < 100; i++) {
  insert.run(`evt-${i}`, `session-${i % 10}`, "tool.invocation", "{}", new Date().toISOString());
}

// Query
const count = db.prepare("SELECT COUNT(*) as count FROM events").get();
console.log(`✅ Inserted ${count.count} events`);

// Aggregate
const stats = db.prepare(`
  SELECT 
    session_id,
    COUNT(*) as event_count
  FROM events
  GROUP BY session_id
  ORDER BY event_count DESC
`).all();

console.log("\nSession stats:");
console.table(stats);

db.close();
console.log("\n✅ better-sqlite3 works with Deno");
