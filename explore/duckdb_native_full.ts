/**
 * DuckDB Native Binding: Full Exploration
 *
 * Tests connectivity and query ergonomics with native Node.js binding in Deno
 */

import duckdb from "npm:duckdb";

console.log("=== DuckDB Native Binding: Full Test ===\n");

// Create in-memory database
const db = new duckdb.Database(":memory:");
const conn = db.connect();

console.log("✅ Connected to DuckDB (native)\n");

// Helper to run queries and return results
function query(sql: string): Promise<unknown[]> {
  const { promise, resolve, reject } = Promise.withResolvers<unknown[]>();
  conn.all(sql, (err: Error | null, rows: unknown[]) => {
    if (err) reject(err);
    else resolve(rows);
  });
  return promise;
}

// ============================================================================
// 1. Schema Setup
// ============================================================================

console.log("=== Schema Setup ===\n");

await query(`
  CREATE TABLE events (
    id VARCHAR DEFAULT (uuid()),
    session_id VARCHAR NOT NULL,
    sequence INTEGER NOT NULL,
    event_type VARCHAR NOT NULL,
    payload JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON
  );
`);

await query(`
  CREATE TABLE memories (
    id VARCHAR DEFAULT (uuid()),
    type VARCHAR NOT NULL,
    session_id VARCHAR,
    content VARCHAR NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log("✅ Tables created: events, memories\n");

// ============================================================================
// 2. Data Loading
// ============================================================================

console.log("=== Loading Test Data ===\n");

const eventTypes = [
  "session.created", "session.started", "tool.invocation",
  "tool.success", "tool.failure", "model.invocation",
  "model.response", "error", "session.completed",
];

const toolNames = ["shell", "read", "write", "edit", "grep", "glob", "lsp"];
const sessions = Array.from({ length: 20 }, (_, i) => `session-${String(i).padStart(3, "0")}`);

// Insert events in batches
let seq = 0;
for (let batch = 0; batch < sessions.length; batch++) {
  const values: string[] = [];
  
  for (let i = 0; i < 50; i++) {
    const sessionId = sessions[batch];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const toolName = toolNames[Math.floor(Math.random() * toolNames.length)];
    const durationMs = Math.floor(Math.random() * 5000) + 10;
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const payload = JSON.stringify({
      tool_name: toolName,
      duration_ms: durationMs,
      success: !eventType.includes("failure"),
      tokens_used: Math.floor(Math.random() * 10000),
    });

    values.push(
      `('session-${String(batch).padStart(3, "0")}', ${seq++}, '${eventType}', '${payload.replace(/'/g, "''")}'::JSON, '${timestamp}'::TIMESTAMP)`
    );
  }

  await query(`
    INSERT INTO events (session_id, sequence, event_type, payload, timestamp)
    VALUES ${values.join(",\n")}
  `);
}

const eventCount = await query("SELECT COUNT(*) as count FROM events");
console.log(`✅ Inserted ${(eventCount[0] as Record<string, unknown>).count} events`);

// Insert memories
await query(`
  INSERT INTO memories (type, session_id, content) VALUES
  ('semantic', 'session-001', 'User prefers dark mode interface'),
  ('semantic', 'session-002', 'Project uses TypeScript with strict mode'),
  ('procedural', 'session-003', 'Always run tests before committing'),
  ('episodic', 'session-004', 'User reported error with LSP connection'),
  ('semantic', 'session-005', 'Code review requires 2 approvals')
`);

const memoryCount = await query("SELECT COUNT(*) as count FROM memories");
console.log(`✅ Inserted ${(memoryCount[0] as Record<string, unknown>).count} memories\n`);

// ============================================================================
// 3. Query Ergonomics
// ============================================================================

console.log("=== Query Ergonomics Test ===\n");

// Pattern 1: Tool performance metrics
console.log("--- Tool Performance Metrics ---");
const toolPerf = await query(`
  SELECT 
    json_extract_string(payload, '$.tool_name') as tool_name,
    COUNT(*) as total_invocations,
    COUNT(CASE WHEN json_extract_string(payload, '$.success') = 'true' THEN 1 END) as success_count,
    COUNT(CASE WHEN json_extract_string(payload, '$.success') = 'false' THEN 1 END) as failure_count,
    ROUND(
      COUNT(CASE WHEN json_extract_string(payload, '$.success') = 'true' THEN 1 END) * 100.0 / COUNT(*),
      2
    ) as success_rate,
    ROUND(AVG(CAST(json_extract(payload, '$.duration_ms') AS DOUBLE)), 2) as avg_duration_ms
  FROM events
  WHERE event_type IN ('tool.invocation', 'tool.success', 'tool.failure')
  GROUP BY tool_name
  ORDER BY total_invocations DESC
`);
console.table(toolPerf);

// Pattern 2: Session summaries
console.log("\n--- Session Summaries ---");
const sessionSummaries = await query(`
  SELECT 
    session_id,
    COUNT(*) as total_events,
    MIN(timestamp) as started_at,
    MAX(timestamp) as last_event_at,
    ROUND(EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) * 1000, 0) as duration_ms,
    COUNT(CASE WHEN event_type LIKE 'tool.%' THEN 1 END) as tool_call_count,
    COUNT(CASE WHEN event_type LIKE 'model.%' THEN 1 END) as model_invocation_count
  FROM events
  GROUP BY session_id
  ORDER BY total_events DESC
  LIMIT 5
`);
console.table(sessionSummaries);

// Pattern 3: Event type distribution
console.log("\n--- Event Type Distribution ---");
const eventDist = await query(`
  SELECT 
    event_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM events), 2) as percentage
  FROM events
  GROUP BY event_type
  ORDER BY count DESC
`);
console.table(eventDist);

// Pattern 4: Error patterns
console.log("\n--- Error Patterns ---");
const errorPatterns = await query(`
  SELECT 
    event_type as error_type,
    json_extract_string(payload, '$.tool_name') as tool_name,
    COUNT(*) as count,
    MAX(timestamp) as last_occurrence
  FROM events
  WHERE event_type IN ('tool.failure', 'error')
  GROUP BY error_type, tool_name
  ORDER BY count DESC
`);
console.table(errorPatterns);

// ============================================================================
// 4. Cross-Table Joins
// ============================================================================

console.log("\n=== Cross-Table Joins ===\n");

console.log("--- Sessions with Related Memories ---");
const crossJoin = await query(`
  SELECT 
    e.session_id,
    COUNT(DISTINCT e.id) as event_count,
    COUNT(DISTINCT m.id) as memory_count,
    ARRAY_AGG(DISTINCT m.type) as memory_types
  FROM events e
  LEFT JOIN memories m ON e.session_id = m.session_id
  GROUP BY e.session_id
  HAVING COUNT(DISTINCT m.id) > 0
  ORDER BY event_count DESC
`);
console.table(crossJoin);

// ============================================================================
// 5. Performance Benchmark
// ============================================================================

console.log("\n=== Performance Test ===\n");

console.log("--- Bulk Insert (10,000 events) ---");
const bulkStart = performance.now();

const bulkRows: string[] = [];
for (let i = 0; i < 10000; i++) {
  const sid = `session-bulk-${i % 100}`;
  const eventType = eventTypes[i % eventTypes.length];
  const timestamp = new Date(Date.now() - i * 1000).toISOString();
  bulkRows.push(
    `('${sid}', ${i}, '${eventType}', '{}'::JSON, '${timestamp}'::TIMESTAMP)`
  );
}

// Insert in chunks of 1000
for (let i = 0; i < bulkRows.length; i += 1000) {
  const chunk = bulkRows.slice(i, i + 1000);
  await query(`
    INSERT INTO events (session_id, sequence, event_type, payload, timestamp)
    VALUES ${chunk.join(",\n")}
  `);
}

const bulkDuration = performance.now() - bulkStart;
console.log(`✅ Inserted 10,000 events in ${bulkDuration.toFixed(2)}ms`);
console.log(`   Rate: ${(10000 / (bulkDuration / 1000)).toFixed(0)} events/sec`);

// Final count
const finalCount = await query("SELECT COUNT(*) as count FROM events");
console.log(`\nTotal events in database: ${(finalCount[0] as Record<string, unknown>).count}`);

// ============================================================================
// 6. Window Functions
// ============================================================================

console.log("\n=== Advanced Analytics ===\n");

console.log("--- Rolling Error Rate (per session) ---");
const rollingStats = await query(`
  WITH session_errors AS (
    SELECT 
      session_id,
      timestamp,
      CASE WHEN event_type IN ('tool.failure', 'error') THEN 1 ELSE 0 END as is_error,
      ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp) as event_num
    FROM events
  )
  SELECT 
    session_id,
    event_num,
    is_error,
    ROUND(
      AVG(is_error) OVER (
        PARTITION BY session_id 
        ORDER BY event_num 
        ROWS BETWEEN 9 PRECEDING AND CURRENT ROW
      ), 3
    ) as rolling_error_rate_10
  FROM session_errors
  WHERE session_id = 'session-000'
  LIMIT 10
`);
console.table(rollingStats);

// ============================================================================
// Cleanup
// ============================================================================

conn.close(() => {
  db.close(() => {
    console.log("\n✅ Native binding exploration complete");
  });
});
